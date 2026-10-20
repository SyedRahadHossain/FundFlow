/**
 * The password recovery routes sit inside the /api/auth rate limiter.
 *
 * index.js skips the limiter while NODE_ENV is 'test', and the skip is read
 * per request — so this suite turns the skip off for one test and drives the
 * real limiter that the server mounts, instead of a limiter built for the test.
 */
const request = require('supertest');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

jest.mock('../models/User', () => ({
  findOne: async () => null,
}));

jest.mock('../models/PasswordResetToken', () => ({
  findOne: async () => null,
  updateMany: async () => ({ modifiedCount: 0 }),
}));

const app = require('../index');

afterEach(() => {
  process.env.NODE_ENV = 'test';
});

describe('POST /api/auth/forgot-password rate limit', () => {
  test('the auth limiter answers 429 once the budget is spent', async () => {
    process.env.NODE_ENV = 'development'; // the limiter only skips in test env

    const statuses = [];
    for (let i = 0; i < 25; i++) {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: `nobody${i}@x.com` });
      statuses.push(res.status);
    }

    expect(statuses[0]).toBe(200);
    expect(statuses).toContain(429);
    // Once the budget is spent it stays spent.
    expect(statuses[statuses.length - 1]).toBe(429);
  });
});
