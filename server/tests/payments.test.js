const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
const SECRET = 'test_secret';

// In-memory fixtures. The name must start with `mock` so the jest.mock factory
// is allowed to close over it.
const mockPayments = {};

jest.mock('../models/Payment', () => ({
  countDocuments: async (filter = {}) =>
    Object.values(mockPayments).filter(
      (p) => !filter.supporter_email || p.supporter_email === filter.supporter_email
    ).length,
  // Mirrors the `$group` the route runs: sum the field named in `$sum`.
  aggregate: async (pipeline = []) => {
    const group = pipeline.find((stage) => stage.$group)?.$group || {};
    const entry = Object.entries(group).find(([key]) => key !== '_id');
    if (!entry) return [];
    const field = String(entry[1].$sum).replace('$', '');
    const total = Object.values(mockPayments).reduce((sum, p) => sum + (p[field] || 0), 0);
    return Object.keys(mockPayments).length ? [{ _id: null, [entry[0]]: total }] : [];
  },
}));

const app = require('../index');

const token = (email, role) => jwt.sign({ email, role }, SECRET);
const get = (email, role) =>
  request(app).get('/api/payments/all').set('Authorization', `Bearer ${token(email, role)}`);

describe('GET /api/payments/all', () => {
  beforeEach(() => {
    Object.keys(mockPayments).forEach((k) => delete mockPayments[k]);
  });

  test('requires authentication', async () => {
    const res = await request(app).get('/api/payments/all');
    expect(res.status).toBe(401);
  });

  test('is admin only', async () => {
    const res = await get('sup@x.com', 'supporter');
    expect(res.status).toBe(403);
  });

  test('admin receives the payment count and the summed dollar volume', async () => {
    mockPayments.p1 = { supporter_email: 'sup@x.com', credits: 100, amount: 10 };
    mockPayments.p2 = { supporter_email: 'sup@x.com', credits: 200, amount: 20 };
    mockPayments.p3 = { supporter_email: 'other@x.com', credits: 50, amount: 5 };

    const res = await get('admin@x.com', 'admin');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 3, totalVolume: 35 });
  });

  test('returns zero volume when there are no payments', async () => {
    const res = await get('admin@x.com', 'admin');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 0, totalVolume: 0 });
  });
});
