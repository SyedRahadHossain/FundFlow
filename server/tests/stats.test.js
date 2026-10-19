const request = require('supertest');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

// In-memory fixtures. Names must start with `mock` so the jest.mock factories
// are allowed to close over them.
const mockData = { campaigns: [], contributions: [] };

// Minimal evaluator for the two filter shapes routes/stats.js uses.
const mockMatch = (doc, filter = {}) => {
  if (!doc) return false;
  if (filter.status && doc.status !== filter.status) return false;
  if (filter.deadline?.$gt && !(new Date(doc.deadline) > filter.deadline.$gt)) return false;
  const expr = filter.$expr?.$gte;
  if (expr) {
    const [left, right] = expr.map((v) => doc[String(v).slice(1)]);
    if (!(left >= right)) return false;
  }
  return true;
};

const mockAggregate = (rows, pipeline) => {
  const filtered = rows.filter((r) => mockMatch(r, pipeline[0].$match || {}));
  // The matched stage is `{ $group: { ... } }`, so the accumulator lives one
  // level deeper than it looks.
  const group = pipeline.find((stage) => stage.$group)?.$group;
  if (!group || !filtered.length) return [];
  const sumField = group.credits?.$sum;
  if (!sumField) return [];
  const key = String(sumField).slice(1);
  return [{ _id: null, credits: filtered.reduce((sum, r) => sum + (r[key] || 0), 0) }];
};

const mockDistinct = (rows, field, filter = {}) => [
  ...new Set(rows.filter((r) => mockMatch(r, filter)).map((r) => r[field])),
];

jest.mock('../models/Campaign', () => ({
  countDocuments: async (filter = {}) =>
    mockData.campaigns.filter((c) => mockMatch(c, filter)).length,
  aggregate: async (pipeline) => mockAggregate(mockData.campaigns, pipeline),
  distinct: async (field, filter) => mockDistinct(mockData.campaigns, field, filter),
}));

jest.mock('../models/Contribution', () => ({
  distinct: async (field, filter) => mockDistinct(mockData.contributions, field, filter),
}));

const app = require('../index');

const future = () => new Date(Date.now() + 86400000);
const past = () => new Date(Date.now() - 86400000);

describe('GET /api/stats', () => {
  beforeEach(() => {
    mockData.campaigns = [];
    mockData.contributions = [];
  });

  test('is public — no token required', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
  });

  test('reports zeros on an empty platform instead of inventing activity', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.body).toEqual({
      campaigns_live: 0,
      campaigns_raised: 0,
      credits_raised: 0,
      supporters: 0,
      creators: 0,
    });
  });

  test('counts only approved campaigns that have not passed their deadline as live', async () => {
    mockData.campaigns = [
      { status: 'approved', deadline: future(), amount_raised: 10, funding_goal: 100, creator_email: 'a@x.com' },
      { status: 'approved', deadline: past(), amount_raised: 10, funding_goal: 100, creator_email: 'b@x.com' },
      { status: 'pending', deadline: future(), amount_raised: 0, funding_goal: 100, creator_email: 'c@x.com' },
      { status: 'rejected', deadline: future(), amount_raised: 0, funding_goal: 100, creator_email: 'd@x.com' },
    ];
    const res = await request(app).get('/api/stats');
    expect(res.body.campaigns_live).toBe(1);
  });

  test('sums raised credits from approved campaigns only', async () => {
    mockData.campaigns = [
      { status: 'approved', deadline: future(), amount_raised: 250, funding_goal: 100, creator_email: 'a@x.com' },
      { status: 'approved', deadline: future(), amount_raised: 50, funding_goal: 100, creator_email: 'a@x.com' },
      { status: 'pending', deadline: future(), amount_raised: 9999, funding_goal: 100, creator_email: 'b@x.com' },
    ];
    const res = await request(app).get('/api/stats');
    expect(res.body.credits_raised).toBe(300);
  });

  test('counts a goal as raised only when the amount meets or beats the goal', async () => {
    mockData.campaigns = [
      { status: 'approved', deadline: future(), amount_raised: 100, funding_goal: 100, creator_email: 'a@x.com' },
      { status: 'approved', deadline: future(), amount_raised: 99, funding_goal: 100, creator_email: 'b@x.com' },
      { status: 'approved', deadline: future(), amount_raised: 500, funding_goal: 100, creator_email: 'c@x.com' },
    ];
    const res = await request(app).get('/api/stats');
    expect(res.body.campaigns_raised).toBe(2);
  });

  test('counts distinct supporters and distinct creators, not contributions', async () => {
    mockData.campaigns = [
      { status: 'approved', deadline: future(), amount_raised: 10, funding_goal: 5, creator_email: 'a@x.com' },
      { status: 'approved', deadline: future(), amount_raised: 10, funding_goal: 5, creator_email: 'a@x.com' },
      { status: 'approved', deadline: future(), amount_raised: 10, funding_goal: 5, creator_email: 'b@x.com' },
    ];
    mockData.contributions = [
      { status: 'approved', supporter_email: 's1@x.com' },
      { status: 'approved', supporter_email: 's1@x.com' },
      { status: 'approved', supporter_email: 's2@x.com' },
      { status: 'pending', supporter_email: 's3@x.com' },
      { status: 'rejected', supporter_email: 's4@x.com' },
      { status: 'refunded', supporter_email: 's5@x.com' },
    ];
    const res = await request(app).get('/api/stats');
    expect(res.body.supporters).toBe(2);
    expect(res.body.creators).toBe(2);
  });

  test('every value is a number', async () => {
    const res = await request(app).get('/api/stats');
    for (const v of Object.values(res.body)) expect(typeof v).toBe('number');
  });

  test('is cacheable for a minute', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.headers['cache-control']).toBe('public, max-age=60');
  });
});
