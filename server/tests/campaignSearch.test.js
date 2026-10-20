const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
const SECRET = 'test_secret';
const newId = () => new mongoose.Types.ObjectId().toString();

const mockCampaigns = {};
let lastPipeline = null;

// ── A tiny evaluator for the stages the search route sends ───────
// The route runs one aggregation: $match → $facet. This mock evaluates
// exactly those stages, so the route is tested against the pipeline it
// really sends rather than against a find() shortcut.
const matches = (doc, m = {}) => {
  if (m.status && doc.status !== m.status) return false;
  if (m.category && doc.category !== m.category) return false;
  if (m.funding_goal) {
    if (m.funding_goal.$gte !== undefined && doc.funding_goal < m.funding_goal.$gte) return false;
    if (m.funding_goal.$lte !== undefined && doc.funding_goal > m.funding_goal.$lte) return false;
  }
  if (m.deadline) {
    if (m.deadline.$gt !== undefined && !(new Date(doc.deadline) > new Date(m.deadline.$gt))) return false;
    if (m.deadline.$lte !== undefined && !(new Date(doc.deadline) <= new Date(m.deadline.$lte))) return false;
  }
  if (m.$or) {
    const hit = m.$or.some((cond) =>
      Object.entries(cond).every(([field, value]) =>
        value instanceof RegExp ? value.test(String(doc[field] ?? '')) : doc[field] === value
      )
    );
    if (!hit) return false;
  }
  return true;
};

const bySort = (spec) => (a, b) => {
  for (const [field, dir] of Object.entries(spec)) {
    const av = a[field];
    const bv = b[field];
    if (av === bv) continue;
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    // dir 1 sorts ascending, dir -1 descending.
    return av > bv ? dir : -dir;
  }
  return 0;
};

jest.mock('../models/Campaign', () => {
  function CampaignMock(data) {
    Object.assign(this, data);
    this._id = newId();
  }
  CampaignMock.aggregate = async (pipeline = []) => {
    lastPipeline = pipeline;
    const baseMatch = (pipeline.find((s) => s.$match) || {}).$match || {};
    const facet = (pipeline.find((s) => s.$facet) || {}).$facet || {};
    const rows = Object.values(mockCampaigns).filter((c) => matches(c, baseMatch));

    const runBranch = (stages) => {
      let out = rows;
      for (const stage of stages) {
        if (stage.$match) out = out.filter((c) => matches(c, stage.$match));
        if (stage.$sort) out = [...out].sort(bySort(stage.$sort));
        if (stage.$skip) out = out.slice(stage.$skip);
        if (stage.$limit) out = out.slice(0, stage.$limit);
      }
      return out;
    };

    const result = {};
    for (const [name, stages] of Object.entries(facet)) {
      if (name === 'total') {
        const counted = runBranch(stages.filter((s) => !s.$count));
        result.total = counted.length ? [{ count: counted.length }] : [];
      } else if (name === 'categories') {
        const grouped = {};
        for (const c of rows) grouped[c.category] = (grouped[c.category] || 0) + 1;
        result.categories = Object.entries(grouped)
          .map(([value, count]) => ({ _id: value, count }))
          .sort((a, b) => b.count - a.count || a._id.localeCompare(b._id));
      } else {
        result[name] = runBranch(stages);
      }
    }
    return [result];
  };
  return CampaignMock;
});

const app = require('../index');
app.use('/api/campaigns', require('../routes/campaigns'));

const adminToken = jwt.sign({ email: 'admin@x.com', role: 'admin' }, SECRET);

const DAY = 86400000;
const soon = (days) => new Date(Date.now() + days * DAY);
const past = (days) => new Date(Date.now() - days * DAY);

function seed(overrides = {}) {
  const id = newId();
  mockCampaigns[id] = {
    _id: id,
    title: 'Solar Panels for Riverside Hall',
    story: 'Panels for the hall roof and a battery.',
    category: 'Environment',
    funding_goal: 2400,
    minimum_contribution: 20,
    deadline: soon(20),
    creator_email: 'maya@x.com',
    creator_name: 'Maya Okafor',
    amount_raised: 2496,
    status: 'approved',
    createdAt: new Date(),
    ...overrides,
  };
  return id;
}

beforeEach(() => {
  Object.keys(mockCampaigns).forEach((k) => delete mockCampaigns[k]);
  lastPipeline = null;
});

describe('GET /api/campaigns/search', () => {
  test('returns only approved campaigns to an anonymous caller', async () => {
    seed({ title: 'Approved one' });
    seed({ title: 'Pending one', status: 'pending' });
    seed({ title: 'Rejected one', status: 'rejected' });

    const res = await request(app).get('/api/campaigns/search');

    expect(res.status).toBe(200);
    expect(res.body.campaigns).toHaveLength(1);
    expect(res.body.campaigns[0].title).toBe('Approved one');
  });

  test('answers with the pagination shape the client needs', async () => {
    seed();
    seed();

    const res = await request(app).get('/api/campaigns/search');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        total: 2,
        page: 1,
        limit: 12,
        pages: 1,
      })
    );
    expect(Array.isArray(res.body.facets.categories)).toBe(true);
  });

  test('searches the title case-insensitively', async () => {
    seed({ title: 'A Clinic Queue That Works Offline' });
    seed({ title: 'The Night Market Print Residency' });

    const res = await request(app).get('/api/campaigns/search?q=CLINIC');

    expect(res.status).toBe(200);
    expect(res.body.campaigns).toHaveLength(1);
    expect(res.body.campaigns[0].title).toBe('A Clinic Queue That Works Offline');
  });

  test('searches the creator name', async () => {
    seed({ title: 'One', creator_name: 'Amara Osei' });
    seed({ title: 'Two', creator_name: 'Daniel Reyes' });

    const res = await request(app).get('/api/campaigns/search?q=osei');

    expect(res.status).toBe(200);
    expect(res.body.campaigns).toHaveLength(1);
    expect(res.body.campaigns[0].creator_name).toBe('Amara Osei');
  });

  test('filters by category', async () => {
    seed({ title: 'Music one', category: 'Music' });
    seed({ title: 'Music two', category: 'Music' });
    seed({ title: 'Education one', category: 'Education' });

    const res = await request(app).get('/api/campaigns/search?category=Music');

    expect(res.status).toBe(200);
    expect(res.body.campaigns).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  test('the deadline filter separates running campaigns from ended ones', async () => {
    seed({ title: 'Running', deadline: soon(5) });
    seed({ title: 'Ended', deadline: past(5) });

    const active = await request(app).get('/api/campaigns/search?deadline=active');
    const ended = await request(app).get('/api/campaigns/search?deadline=ended');

    expect(active.body.campaigns.map((c) => c.title)).toEqual(['Running']);
    expect(ended.body.campaigns.map((c) => c.title)).toEqual(['Ended']);
  });

  test('the ending filter keeps campaigns inside the next thirty days', async () => {
    seed({ title: 'Ending next week', deadline: soon(7) });
    seed({ title: 'Ending next month', deadline: soon(25) });
    seed({ title: 'Ending next year', deadline: soon(200) });

    const res = await request(app).get('/api/campaigns/search?deadline=ending');

    expect(res.body.campaigns.map((c) => c.title).sort()).toEqual([
      'Ending next month',
      'Ending next week',
    ]);
  });

  test('filters by funding goal range', async () => {
    seed({ title: 'Small', funding_goal: 400 });
    seed({ title: 'Middle', funding_goal: 1200 });
    seed({ title: 'Large', funding_goal: 5000 });

    const res = await request(app).get('/api/campaigns/search?minGoal=1000&maxGoal=2000');

    expect(res.status).toBe(200);
    expect(res.body.campaigns.map((c) => c.title)).toEqual(['Middle']);
  });

  test('rejects an inverted goal range', async () => {
    const res = await request(app).get('/api/campaigns/search?minGoal=900&maxGoal=100');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/goal/i);
  });

  test('rejects a goal that is not a number', async () => {
    const res = await request(app).get('/api/campaigns/search?minGoal=many');

    expect(res.status).toBe(400);
  });

  test('rejects an unknown deadline value', async () => {
    const res = await request(app).get('/api/campaigns/search?deadline=soonish');

    expect(res.status).toBe(400);
  });

  test('rejects an unknown sort value', async () => {
    const res = await request(app).get('/api/campaigns/search?sort=random');

    expect(res.status).toBe(400);
  });

  test('rejects an unknown status value', async () => {
    const res = await request(app).get('/api/campaigns/search?status=deleted');

    expect(res.status).toBe(400);
  });

  test('rejects a status filter that is not a plain string', async () => {
    const res = await request(app).get('/api/campaigns/search?status[$ne]=approved');

    expect(res.status).toBe(400);
  });

  test('rejects a repeated status parameter', async () => {
    const res = await request(app).get('/api/campaigns/search?status=approved&status=pending');

    expect(res.status).toBe(400);
  });

  test('rejects a search term longer than the limit', async () => {
    const res = await request(app).get(`/api/campaigns/search?q=${'x'.repeat(200)}`);

    expect(res.status).toBe(400);
  });

  test('keeps unapproved campaigns away from an anonymous caller asking for them', async () => {
    seed({ title: 'Pending one', status: 'pending' });

    const res = await request(app).get('/api/campaigns/search?status=pending');

    expect(res.status).toBe(401);
  });

  test('lets an admin search the pending queue', async () => {
    seed({ title: 'Pending one', status: 'pending' });
    seed({ title: 'Approved one', status: 'approved' });

    const res = await request(app)
      .get('/api/campaigns/search?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.campaigns).toHaveLength(1);
    expect(res.body.campaigns[0].title).toBe('Pending one');
  });

  test('pages through the results and counts the whole set', async () => {
    for (let i = 1; i <= 5; i += 1) seed({ title: `Campaign ${i}`, createdAt: new Date(Date.now() - i * 1000) });

    const res = await request(app).get('/api/campaigns/search?page=2&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.campaigns).toHaveLength(2);
    expect(res.body.total).toBe(5);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(2);
    expect(res.body.pages).toBe(3);
  });

  test('rejects a page below one and a limit above the cap', async () => {
    const zero = await request(app).get('/api/campaigns/search?page=0');
    const huge = await request(app).get('/api/campaigns/search?limit=500');

    expect(zero.status).toBe(400);
    expect(huge.status).toBe(400);
  });

  test('sorts by amount raised when asked', async () => {
    seed({ title: 'Least funded', amount_raised: 100 });
    seed({ title: 'Most funded', amount_raised: 900 });

    const res = await request(app).get('/api/campaigns/search?sort=funded');

    expect(res.body.campaigns.map((c) => c.title)).toEqual(['Most funded', 'Least funded']);
  });

  test('sorts by soonest deadline when asked', async () => {
    seed({ title: 'Later', deadline: soon(40) });
    seed({ title: 'Sooner', deadline: soon(3) });

    const res = await request(app).get('/api/campaigns/search?sort=ending');

    expect(res.body.campaigns.map((c) => c.title)).toEqual(['Sooner', 'Later']);
  });

  test('counts the categories beside the rows', async () => {
    seed({ category: 'Music' });
    seed({ category: 'Music' });
    seed({ category: 'Education' });

    const res = await request(app).get('/api/campaigns/search');

    expect(res.body.facets.categories).toEqual([
      { value: 'Music', count: 2 },
      { value: 'Education', count: 1 },
    ]);
  });

  test('counts every category even when one is selected', async () => {
    seed({ category: 'Music' });
    seed({ category: 'Music' });
    seed({ category: 'Education' });

    const res = await request(app).get('/api/campaigns/search?category=Music');

    expect(res.body.campaigns).toHaveLength(2);
    expect(res.body.facets.categories.map((c) => c.value).sort()).toEqual(['Education', 'Music']);
  });

  test('runs the filters through an aggregation pipeline', async () => {
    seed();

    await request(app).get('/api/campaigns/search?category=Music&q=hall');

    expect(lastPipeline).not.toBeNull();
    expect(lastPipeline.some((stage) => stage.$facet)).toBe(true);
    expect(lastPipeline.some((stage) => stage.$match)).toBe(true);
  });
});
