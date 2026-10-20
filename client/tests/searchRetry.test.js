import { test } from 'node:test';
import assert from 'node:assert/strict';

import { searchOutcome, SEARCH_RETRY_DELAY_MS } from '../lib/searchRetry.js';

/**
 * A search that fails is usually a cold start, not a broken endpoint.
 *
 * The server is a serverless function: the first request after a deploy
 * pays for the wake-up, and a brief blip there should not leave the reader
 * looking at "We couldn't load campaigns" on a page whose API is fine.
 * One retry, then the honest error.
 */

test('the first failure is retried', () => {
  assert.equal(searchOutcome(0), 'retry');
});

test('the second failure is reported', () => {
  assert.equal(searchOutcome(1), 'fail');
});

test('the retry waits long enough for a cold start', () => {
  assert.ok(SEARCH_RETRY_DELAY_MS >= 1000);
});
