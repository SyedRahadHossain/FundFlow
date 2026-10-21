import { test } from 'node:test';
import assert from 'node:assert/strict';

import { readGatewayUrl } from '../lib/readGateway.js';

/**
 * The second way to read.
 *
 * Some networks drop requests whose path contains certain words, and the
 * symptom is a page that cannot load its own data while the API is healthy:
 * no response, no status, the fetch simply fails. When that happens the
 * client asks for the same read again, with the route it wanted in the
 * query string instead of in the path.
 *
 * These are the cases that have to hold: the read is the same read, the
 * parameters survive, and anything that is not one of those reads is left
 * alone.
 */

test('a campaign read travels by the gateway', () => {
  assert.equal(
    readGatewayUrl('/api/campaigns?status=approved'),
    '/api/read?route=campaigns&status=approved'
  );
});

test('the listing read travels by the gateway', () => {
  assert.equal(
    readGatewayUrl('/api/campaigns/listing?category=Education'),
    '/api/read?route=campaigns%2Flisting&category=Education'
  );
});

test('a read without parameters still travels', () => {
  assert.equal(readGatewayUrl('/api/campaigns'), '/api/read?route=campaigns');
});

test("the creator's own campaigns travel by the gateway", () => {
  assert.equal(readGatewayUrl('/api/campaigns/mine'), '/api/read?route=campaigns%2Fmine');
});

test('a campaign by its id travels by the gateway', () => {
  const id = '6ad743d1ff492efebfc15123';
  assert.equal(
    readGatewayUrl(`/api/campaigns/${id}`),
    `/api/read?route=campaigns%2F${id}`
  );
});

test('a path that is not a campaign id is left alone', () => {
  assert.equal(readGatewayUrl('/api/campaigns/not-an-id'), null);
});

test('another API is left alone', () => {
  assert.equal(readGatewayUrl('/api/notifications'), null);
  assert.equal(readGatewayUrl('/api/auth/me'), null);
});

test('a path that is not an API call is left alone', () => {
  assert.equal(readGatewayUrl('/campaigns'), null);
  assert.equal(readGatewayUrl(''), null);
});
