import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_FILTERS,
  CATEGORIES,
  toQuery,
  fromQuery,
  hasActiveFilters,
  countActiveFilters,
  applyFilters,
} from '../lib/campaignFilters.js';

/**
 * The filter state travels in two directions: from the controls into a query
 * string for the API, and from a query string back into the controls. Both
 * directions have to agree, or a reader who filters and reloads the page
 * sees something else than they left.
 */

test('a fresh filter set has no active filters', () => {
  assert.equal(hasActiveFilters(DEFAULT_FILTERS), false);
  assert.equal(countActiveFilters(DEFAULT_FILTERS), 0);
});

test('the query string leaves out the defaults', () => {
  assert.equal(toQuery(DEFAULT_FILTERS), '');
  assert.equal(toQuery({ ...DEFAULT_FILTERS, category: 'All', sort: 'newest', deadline: 'any' }), '');
});

test('the query string carries only what was changed', () => {
  const query = toQuery({ ...DEFAULT_FILTERS, q: 'clinic', category: 'Music' });
  assert.deepEqual(query.split('&').sort(), ['category=Music', 'q=clinic']);
});

test('the page number is carried when it is past the first one', () => {
  assert.equal(toQuery({ ...DEFAULT_FILTERS, page: 3 }), 'page=3');
});

test('a search term is encoded rather than pasted', () => {
  assert.equal(toQuery({ ...DEFAULT_FILTERS, q: 'a b&c' }), 'q=a+b%26c');
});

test('the goal bounds are carried as numbers', () => {
  const query = toQuery({ ...DEFAULT_FILTERS, minGoal: '100', maxGoal: '2000' });
  assert.deepEqual(query.split('&').sort(), ['maxGoal=2000', 'minGoal=100']);
});

test('a query string comes back as the filter set that produced it', () => {
  const filters = { ...DEFAULT_FILTERS, q: 'clinic', category: 'Music', deadline: 'ending', sort: 'funded', minGoal: '100', maxGoal: '2000', page: 2 };
  const parsed = fromQuery(new URLSearchParams(toQuery(filters)));
  assert.deepEqual(parsed, filters);
});

test('an unknown value falls back to the default instead of reaching the API', () => {
  const parsed = fromQuery(new URLSearchParams('sort=random&deadline=soonish&category=Nonsense'));
  assert.equal(parsed.sort, 'newest');
  assert.equal(parsed.deadline, 'any');
  assert.equal(parsed.category, 'All');
});

test('a junk goal bound is dropped rather than sent', () => {
  const parsed = fromQuery(new URLSearchParams('minGoal=many&maxGoal='));
  assert.equal(parsed.minGoal, '');
  assert.equal(parsed.maxGoal, '');
});

test('the category list is the one the platform knows', () => {
  assert.ok(CATEGORIES.includes('All'));
  assert.ok(CATEGORIES.includes('Music'));
  assert.ok(CATEGORIES.includes('Environment'));
});

// ── The browser-side fallback ─────────────────────────────────────
// When the server cannot be asked, the filters still have to answer. These
// are the same rules the server runs, so the two paths agree.

const NOW = new Date('2026-10-21T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

function campaign(overrides = {}) {
  return {
    _id: overrides._id || 'id',
    title: 'A campaign',
    story: 'A story.',
    category: 'Music',
    creator_name: 'A Creator',
    funding_goal: 1000,
    amount_raised: 100,
    deadline: new Date(NOW.getTime() + 10 * DAY).toISOString(),
    createdAt: new Date(NOW.getTime() - 5 * DAY).toISOString(),
    ...overrides,
  };
}

const CATALOGUE = [
  campaign({ _id: 'a', title: 'A Clinic Queue That Works Offline', category: 'Technology', funding_goal: 500 }),
  campaign({ _id: 'b', title: 'The Night Market Print Residency', category: 'Art & Design', creator_name: 'Amara Osei' }),
  campaign({ _id: 'c', title: 'Solar Panels for Riverside Hall', category: 'Environment', deadline: new Date(NOW.getTime() - 3 * DAY).toISOString() }),
  campaign({ _id: 'd', title: 'Little Ears', category: 'Health', funding_goal: 4000 }),
];

test('the fallback filters by category', () => {
  const out = applyFilters(CATALOGUE, { ...DEFAULT_FILTERS, category: 'Environment' }, { now: NOW });
  assert.deepEqual(out.campaigns.map((c) => c._id), ['c']);
  assert.equal(out.total, 1);
});

test('the fallback searches the title and the creator', () => {
  assert.deepEqual(
    applyFilters(CATALOGUE, { ...DEFAULT_FILTERS, q: 'clinic' }, { now: NOW }).campaigns.map((c) => c._id),
    ['a']
  );
  assert.deepEqual(
    applyFilters(CATALOGUE, { ...DEFAULT_FILTERS, q: 'osei' }, { now: NOW }).campaigns.map((c) => c._id),
    ['b']
  );
});

test('the fallback separates running campaigns from ended ones', () => {
  assert.deepEqual(
    applyFilters(CATALOGUE, { ...DEFAULT_FILTERS, deadline: 'active' }, { now: NOW }).campaigns.map((c) => c._id),
    ['a', 'b', 'd']
  );
  assert.deepEqual(
    applyFilters(CATALOGUE, { ...DEFAULT_FILTERS, deadline: 'ended' }, { now: NOW }).campaigns.map((c) => c._id),
    ['c']
  );
});

test('the fallback filters by funding goal', () => {
  // 'a' has a goal of 500 and 'd' has 4000, so only 'b' and 'c' are inside
  // the 800-2000 band.
  const out = applyFilters(CATALOGUE, { ...DEFAULT_FILTERS, minGoal: '800', maxGoal: '2000' }, { now: NOW });
  assert.deepEqual(out.campaigns.map((c) => c._id), ['b', 'c']);
});

test('the fallback sorts', () => {
  const byFunded = applyFilters(CATALOGUE, { ...DEFAULT_FILTERS, sort: 'funded' }, { now: NOW });
  assert.deepEqual(byFunded.campaigns.map((c) => c._id), ['a', 'b', 'c', 'd']);
  const byGoal = applyFilters(CATALOGUE, { ...DEFAULT_FILTERS, sort: 'goal' }, { now: NOW });
  assert.deepEqual(byGoal.campaigns.map((c) => c._id), ['d', 'b', 'c', 'a']);
});

test('the fallback counts every category, not only the chosen one', () => {
  const out = applyFilters(CATALOGUE, { ...DEFAULT_FILTERS, category: 'Music' }, { now: NOW });
  const counts = Object.fromEntries(out.facets.categories.map((c) => [c.value, c.count]));
  assert.equal(counts.Environment, 1);
  assert.equal(counts.Health, 1);
});

test('the fallback pages', () => {
  const out = applyFilters(CATALOGUE, { ...DEFAULT_FILTERS, page: 2 }, { now: NOW, limit: 2 });
  assert.equal(out.total, 4);
  assert.equal(out.pages, 2);
  assert.equal(out.campaigns.length, 2);
});

test('the fallback survives an empty or broken list', () => {
  const out = applyFilters(undefined, DEFAULT_FILTERS, { now: NOW });
  assert.deepEqual(out.campaigns, []);
  assert.equal(out.total, 0);
});
