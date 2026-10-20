import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_FILTERS,
  CATEGORIES,
  toQuery,
  fromQuery,
  hasActiveFilters,
  countActiveFilters,
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
