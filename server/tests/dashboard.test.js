const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
const SECRET = 'test_secret';

// In-memory fixtures. The name must start with `mock` so jest.mock factories
// are allowed to close over it.
const mockCounts = { contributions: [], withdrawals: [], campaigns: [] };

const matching = (rows, filter) =>
  rows.filter(
    (r) =>
      (!filter.status || r.status === filter.status) &&
      (!filter.supporter_email || r.supporter_email === filter.supporter_email) &&
      (!filter.creator_email || r.creator_email === filter.creator_email)
  ).length;

jest.mock('../models/Contribution', () => ({
  countDocuments: async (filter = {}) => matching(mockCounts.contributions, filter),
}));

jest.mock('../models/Withdrawal', () => ({
  countDocuments: async (filter = {}) => matching(mockCounts.withdrawals, filter),
}));

jest.mock('../models/Campaign', () => ({
  countDocuments: async (filter = {}) => matching(mockCounts.campaigns, filter),
}));

const app = require('../index');

const token = (email, role) => jwt.sign({ email, role }, SECRET);
const get = (email, role) =>
  request(app).get('/api/dashboard/counts').set('Authorization', `Bearer ${token(email, role)}`);

describe('GET /api/dashboard/counts', () => {
  beforeEach(() => {
    mockCounts.contributions = [
      { status: 'pending', supporter_email: 'sup@x.com', creator_email: 'cr@x.com' },
      { status: 'approved', supporter_email: 'sup@x.com', creator_email: 'cr@x.com' },
      { status: 'pending', supporter_email: 'other@x.com', creator_email: 'cr@x.com' },
    ];
    mockCounts.withdrawals = [
      { status: 'pending', creator_email: 'cr@x.com' },
      { status: 'approved', creator_email: 'cr@x.com' },
      { status: 'pending', creator_email: 'other@x.com' },
    ];
    mockCounts.campaigns = [{ status: 'pending' }, { status: 'approved' }, { status: 'pending' }];
  });

  test('requires authentication', async () => {
    const res = await request(app).get('/api/dashboard/counts');
    expect(res.status).toBe(401);
  });

  test('supporter counts only their own pending contributions', async () => {
    const res = await get('sup@x.com', 'supporter');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pendingContributions: 1, pendingWithdrawals: 0, pendingCampaigns: 0 });
  });

  test('creator counts pending contributions to their campaigns and their withdrawals', async () => {
    const res = await get('cr@x.com', 'creator');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pendingContributions: 2, pendingWithdrawals: 1, pendingCampaigns: 0 });
  });

  test('admin counts platform-wide pending campaigns and withdrawals', async () => {
    const res = await get('admin@x.com', 'admin');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pendingContributions: 0, pendingWithdrawals: 2, pendingCampaigns: 2 });
  });

  test('every role receives all three keys as numbers', async () => {
    const res = await get('sup@x.com', 'supporter');
    expect(Object.keys(res.body).sort()).toEqual([
      'pendingCampaigns',
      'pendingContributions',
      'pendingWithdrawals',
    ]);
    for (const v of Object.values(res.body)) expect(typeof v).toBe('number');
  });
});
