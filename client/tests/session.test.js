import { test } from 'node:test';
import assert from 'node:assert/strict';

import { sessionResponseShouldEndSession } from '../lib/session.js';

/**
 * A session check that fails has to end the session.
 *
 * `/api/auth/me` answers 404 when the token is valid but the account behind
 * it is gone — a deleted account, or a demo account removed from the
 * database. The old rule only ended a session on a 401, and it exempted
 * every `/api/auth/` URL, so a deleted account kept a ghost session: the
 * navbar still showed it, with credits that no longer existed.
 */

test('a rejected session check ends the session', () => {
  assert.equal(sessionResponseShouldEndSession({ status: 401, url: '/api/auth/me' }), true);
});

test('a missing account ends the session', () => {
  assert.equal(sessionResponseShouldEndSession({ status: 404, url: '/api/auth/me' }), true);
});

test('a rejected request to any other route ends the session', () => {
  assert.equal(sessionResponseShouldEndSession({ status: 401, url: '/api/campaigns' }), true);
});

test('a missing resource that is not the session does not end it', () => {
  assert.equal(sessionResponseShouldEndSession({ status: 404, url: '/api/campaigns/abc' }), false);
});

test('a failed sign-in attempt does not end the session', () => {
  assert.equal(sessionResponseShouldEndSession({ status: 401, url: '/api/auth/login' }), false);
  assert.equal(sessionResponseShouldEndSession({ status: 401, url: '/api/auth/register' }), false);
});

test('a failed password reset does not end the session', () => {
  assert.equal(sessionResponseShouldEndSession({ status: 400, url: '/api/auth/forgot-password' }), false);
  assert.equal(sessionResponseShouldEndSession({ status: 400, url: '/api/auth/reset-password' }), false);
});

test('a successful session check keeps the session', () => {
  assert.equal(sessionResponseShouldEndSession({ status: 200, url: '/api/auth/me' }), false);
});
