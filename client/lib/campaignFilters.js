/**
 * Filter state for the campaign index.
 *
 * The controls hold a plain object, this module turns it into the query the
 * API takes and reads one back. Both directions have to agree: a reader who
 * filters and reloads must see the same list.
 *
 * The category list lives here because both the public index and the
 * supporter dashboard show the same one, and a list that differs between
 * two surfaces is a list that lies on one of them.
 */

export const CATEGORIES = [
  'All',
  'Technology',
  'Art & Design',
  'Community',
  'Health',
  'Music',
  'Education',
  'Environment',
  'Gaming',
  'Other',
];

export const DEADLINE_OPTIONS = [
  { value: 'any', label: 'Any deadline' },
  { value: 'active', label: 'Still running' },
  { value: 'ending', label: 'Ending in 30 days' },
  { value: 'ended', label: 'Already ended' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'ending', label: 'Ending soonest' },
  { value: 'funded', label: 'Most funded' },
  { value: 'goal', label: 'Largest goal' },
];

export const DEFAULT_FILTERS = {
  q: '',
  category: 'All',
  deadline: 'any',
  sort: 'newest',
  minGoal: '',
  maxGoal: '',
  page: 1,
};

const DEADLINE_VALUES = DEADLINE_OPTIONS.map((o) => o.value);
const SORT_VALUES = SORT_OPTIONS.map((o) => o.value);

const readString = (params, key) => {
  const value = params.get ? params.get(key) : params[key];
  return typeof value === 'string' ? value : '';
};

const readGoal = (params, key) => {
  const value = readString(params, key).trim();
  return /^\d+$/.test(value) ? value : '';
};

/**
 * The query the API takes. Defaults are left out, so an unfiltered page
 * asks for the plain catalog and the URL stays readable.
 */
export function toQuery(filters) {
  const params = new URLSearchParams();

  const q = (filters.q || '').trim();
  if (q) params.set('q', q);
  if (filters.category && filters.category !== 'All') params.set('category', filters.category);
  if (filters.deadline && filters.deadline !== 'any') params.set('deadline', filters.deadline);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  if (filters.minGoal) params.set('minGoal', filters.minGoal);
  if (filters.maxGoal) params.set('maxGoal', filters.maxGoal);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));

  return params.toString();
}

/**
 * The filters a query string describes. A value the API would refuse falls
 * back to the default here, so the controls never show a state the server
 * will reject.
 */
export function fromQuery(params) {
  const q = readString(params, 'q').trim();
  const category = readString(params, 'category');
  const deadline = readString(params, 'deadline');
  const sort = readString(params, 'sort');
  const page = Number.parseInt(readString(params, 'page'), 10);

  return {
    q: q.slice(0, 120),
    category: CATEGORIES.includes(category) ? category : 'All',
    deadline: DEADLINE_VALUES.includes(deadline) ? deadline : 'any',
    sort: SORT_VALUES.includes(sort) ? sort : 'newest',
    minGoal: readGoal(params, 'minGoal'),
    maxGoal: readGoal(params, 'maxGoal'),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

/** Which filters are doing something — the count is what the badge shows. */
export function countActiveFilters(filters) {
  let count = 0;
  if ((filters.q || '').trim()) count += 1;
  if (filters.category && filters.category !== 'All') count += 1;
  if (filters.deadline && filters.deadline !== 'any') count += 1;
  if (filters.sort && filters.sort !== 'newest') count += 1;
  if (filters.minGoal) count += 1;
  if (filters.maxGoal) count += 1;
  if (filters.page && filters.page > 1) count += 1;
  return count;
}

export function hasActiveFilters(filters) {
  return countActiveFilters(filters) > 0;
}

/**
 * The same filters, applied in the browser.
 *
 * The server does the filtering; this is the fallback for when the server
 * cannot be asked - a request that never reaches the API must not leave the
 * reader with an empty page. It reads the approved list and filters it here,
 * with the same rules, so the two paths answer alike.
 *
 * The category counts are computed over everything except the category
 * itself, which is what the server does too: the reader can switch
 * categories and still see what each one holds.
 */
export function applyFilters(campaigns, filters, { now = new Date(), limit = 12 } = {}) {
  const list = Array.isArray(campaigns) ? campaigns : [];
  const q = (filters.q || '').trim().toLowerCase();

  const matchesQuery = (c) => {
    if (!q) return true;
    const haystack = `${c.title || ''} ${c.story || ''} ${c.creator_name || ''}`.toLowerCase();
    return haystack.includes(q);
  };

  const matchesGoal = (c) => {
    const goal = Number(c.funding_goal);
    if (filters.minGoal && goal < Number(filters.minGoal)) return false;
    if (filters.maxGoal && goal > Number(filters.maxGoal)) return false;
    return true;
  };

  const matchesDeadline = (c) => {
    const mode = filters.deadline;
    if (!mode || mode === 'any') return true;
    const deadline = new Date(c.deadline).getTime();
    if (Number.isNaN(deadline)) return false;
    if (mode === 'active') return deadline > now.getTime();
    if (mode === 'ended') return deadline <= now.getTime();
    if (mode === 'ending') {
      const soon = now.getTime() + 30 * 24 * 60 * 60 * 1000;
      return deadline > now.getTime() && deadline <= soon;
    }
    return true;
  };

  // The counts ignore the category filter, so switching category still
  // shows what the other categories hold.
  const counted = list.filter((c) => matchesQuery(c) && matchesGoal(c) && matchesDeadline(c));
  const categories = {};
  for (const c of counted) categories[c.category] = (categories[c.category] || 0) + 1;

  const filtered = counted.filter(
    (c) => !filters.category || filters.category === 'All' || c.category === filters.category
  );

  const sorters = {
    newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    ending: (a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0),
    funded: (a, b) => (b.amount_raised || 0) - (a.amount_raised || 0),
    goal: (a, b) => (b.funding_goal || 0) - (a.funding_goal || 0),
  };
  const sorted = [...filtered].sort(sorters[filters.sort] || sorters.newest);

  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = filters.page && filters.page > 0 ? filters.page : 1;

  return {
    campaigns: sorted.slice((page - 1) * limit, page * limit),
    total,
    page,
    limit,
    pages,
    facets: {
      categories: Object.entries(categories)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
    },
  };
}
