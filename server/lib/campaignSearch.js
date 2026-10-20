/**
 * Server-side campaign search.
 *
 * The public campaign index used to filter a list the browser already held,
 * which meant the answer was capped by what had been sent down. This module
 * turns a query string into one aggregation pipeline, so the database does
 * the matching, the counting and the paging.
 *
 * Two rules shape everything here:
 *
 *   1. An unapproved campaign is moderation data. The status filter is a
 *      plain whitelisted string, and anything other than "approved" is
 *      refused by the route unless the caller is an admin. The same reason
 *      `?status[$ne]=x` is rejected on the list route: Express's extended
 *      query parser turns that into an operator object, which would
 *      otherwise reach the pipeline.
 *
 *   2. Every value is validated before it reaches the pipeline. A filter
 *      that is not a number, a deadline that is not a mode, a page below one
 *      — each is a 400, not a silently ignored parameter.
 */

const DEADLINE_MODES = ['active', 'ending', 'ended'];
const SORT_MODES = ['newest', 'ending', 'funded', 'goal'];
const STATUS_MODES = ['approved', 'pending', 'rejected'];

// "Ending soon" means inside the next month.
const ENDING_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const MAX_QUERY_LENGTH = 120;
const MAX_CATEGORY_LENGTH = 80;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

const SORT_SPECS = {
  newest: { createdAt: -1 },
  ending: { deadline: 1 },
  funded: { amount_raised: -1 },
  goal: { funding_goal: -1 },
};

/** A search term is a literal, not a pattern: escape the regex metacharacters. */
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isPlainString = (value) => typeof value === 'string';

const parsePositiveInteger = (value) => {
  if (!isPlainString(value) || !/^\d+$/.test(value.trim())) return null;
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : null;
};

/**
 * Read the query string into a validated filter set.
 *
 * Returns `{ filters, errors }`. An empty `errors` means the query is
 * usable; otherwise the route answers 400 with the first message.
 */
function parseCampaignSearchQuery(query = {}) {
  const errors = [];
  const filters = {
    status: 'approved',
    sort: 'newest',
    page: 1,
    limit: DEFAULT_LIMIT,
  };

  // Express 5's simple query parser keeps `status[$ne]=x` as a literal key
  // instead of an operator object, so the bracket syntax never reaches
  // Mongo — it would simply be ignored. Ignoring it is not good enough for
  // a filter surface: a reader who typed it deserves to be told, not
  // quietly handed the unfiltered catalog.
  const bracketedKey = Object.keys(query).find((key) => key.includes('[') || key.includes(']'));
  if (bracketedKey) {
    errors.push('Unsupported query parameter syntax.');
  }

  if (query.q !== undefined) {
    if (!isPlainString(query.q)) {
      errors.push('Search term must be text.');
    } else if (query.q.trim().length > MAX_QUERY_LENGTH) {
      errors.push(`Search term must be ${MAX_QUERY_LENGTH} characters or fewer.`);
    } else {
      filters.q = query.q.trim();
    }
  }

  if (query.category !== undefined) {
    if (!isPlainString(query.category)) {
      errors.push('Category must be text.');
    } else if (query.category.trim().length > MAX_CATEGORY_LENGTH) {
      errors.push(`Category must be ${MAX_CATEGORY_LENGTH} characters or fewer.`);
    } else if (query.category.trim()) {
      filters.category = query.category.trim();
    }
  }

  if (query.deadline !== undefined) {
    if (!isPlainString(query.deadline) || !DEADLINE_MODES.includes(query.deadline)) {
      errors.push(`Deadline filter must be one of: ${DEADLINE_MODES.join(', ')}.`);
    } else {
      filters.deadline = query.deadline;
    }
  }

  if (query.status !== undefined) {
    if (!isPlainString(query.status) || !STATUS_MODES.includes(query.status)) {
      errors.push(`Status filter must be one of: ${STATUS_MODES.join(', ')}.`);
    } else {
      filters.status = query.status;
    }
  }

  if (query.sort !== undefined) {
    if (!isPlainString(query.sort) || !SORT_MODES.includes(query.sort)) {
      errors.push(`Sort must be one of: ${SORT_MODES.join(', ')}.`);
    } else {
      filters.sort = query.sort;
    }
  }

  if (query.minGoal !== undefined) {
    const parsed = parsePositiveInteger(query.minGoal);
    if (parsed === null) errors.push('Minimum goal must be a whole number of credits.');
    else filters.minGoal = parsed;
  }

  if (query.maxGoal !== undefined) {
    const parsed = parsePositiveInteger(query.maxGoal);
    if (parsed === null) errors.push('Maximum goal must be a whole number of credits.');
    else filters.maxGoal = parsed;
  }

  if (
    filters.minGoal !== undefined &&
    filters.maxGoal !== undefined &&
    filters.minGoal > filters.maxGoal
  ) {
    errors.push('Minimum goal cannot be larger than the maximum goal.');
  }

  if (query.page !== undefined) {
    const parsed = parsePositiveInteger(query.page);
    if (parsed === null) errors.push('Page must be a whole number of one or more.');
    else filters.page = parsed;
  }

  if (query.limit !== undefined) {
    const parsed = parsePositiveInteger(query.limit);
    if (parsed === null || parsed > MAX_LIMIT) {
      errors.push(`Limit must be a whole number between 1 and ${MAX_LIMIT}.`);
    } else {
      filters.limit = parsed;
    }
  }

  return { filters, errors };
}

/**
 * The pipeline.
 *
 * One pass, three answers: the rows for this page, the size of the whole
 * filtered set, and the category counts. The category facet is computed
 * before the category filter applies, so the filter can offer every
 * category with its count and let the reader switch between them.
 *
 * The text match is a case-insensitive regular expression over the title,
 * the story and the creator name, because a reader typing "clin" wants
 * "Clinic". A text index would be the next step at scale; it matches whole
 * words only, and it cannot search a partial one.
 */
function buildCampaignSearchPipeline(filters, now = new Date()) {
  const match = { status: filters.status };

  if (filters.q) {
    const term = new RegExp(escapeRegex(filters.q), 'i');
    match.$or = [{ title: term }, { story: term }, { creator_name: term }];
  }

  if (filters.minGoal !== undefined || filters.maxGoal !== undefined) {
    match.funding_goal = {};
    if (filters.minGoal !== undefined) match.funding_goal.$gte = filters.minGoal;
    if (filters.maxGoal !== undefined) match.funding_goal.$lte = filters.maxGoal;
  }

  if (filters.deadline) {
    if (filters.deadline === 'active') {
      match.deadline = { $gt: now };
    } else if (filters.deadline === 'ending') {
      match.deadline = { $gt: now, $lte: new Date(now.getTime() + ENDING_WINDOW_DAYS * DAY_MS) };
    } else {
      match.deadline = { $lte: now };
    }
  }

  const categoryMatch = filters.category ? { $match: { category: filters.category } } : null;
  const sort = SORT_SPECS[filters.sort] || SORT_SPECS.newest;
  const skip = (filters.page - 1) * filters.limit;

  return [
    { $match: match },
    {
      $facet: {
        campaigns: [
          ...(categoryMatch ? [categoryMatch] : []),
          { $sort: sort },
          { $skip: skip },
          { $limit: filters.limit },
        ],
        total: [
          ...(categoryMatch ? [categoryMatch] : []),
          { $count: 'count' },
        ],
        categories: [
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ],
      },
    },
  ];
}

module.exports = {
  parseCampaignSearchQuery,
  buildCampaignSearchPipeline,
  DEADLINE_MODES,
  SORT_MODES,
  STATUS_MODES,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
