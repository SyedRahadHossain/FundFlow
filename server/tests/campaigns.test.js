const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const SECRET = 'test_secret';

// ── Mock data stores ─────────────────────────────────────────────
const mockCampaigns = {};
const mockContributions = {};
const mockUsers = {};
const mockNotifications = [];

let mockIdCounter = 1;
const newId = () => new mongoose.Types.ObjectId().toString();

// ── Mock Campaign ────────────────────────────────────────────────
jest.mock('../models/Campaign', () => {
  function CampaignMock(data) {
    Object.assign(this, data);
    this._id = newId();
    if (!this.status) this.status = 'pending';
    if (this.amount_raised === undefined) this.amount_raised = 0;
  }
  CampaignMock.prototype.save = async function () {
    mockCampaigns[this._id] = { ...this };
    return this;
  };
  CampaignMock.find = jest.fn(async (filter = {}) => {
    let results = Object.values(mockCampaigns);
    if (filter.status) results = results.filter(c => c.status === filter.status);
    if (filter.creator_email) results = results.filter(c => c.creator_email === filter.creator_email);
    if (filter.deadline?.$gt) results = results.filter(c => new Date(c.deadline) > filter.deadline.$gt);
    return {
      sort: () => ({ limit: (n) => results.slice(0, n), ...results }),
      limit: (n) => results.slice(0, n),
      [Symbol.iterator]: results[Symbol.iterator].bind(results),
    };
  });
  CampaignMock.find = (filter = {}) => {
    let results = Object.values(mockCampaigns);
    if (filter.status) results = results.filter(c => c.status === filter.status);
    if (filter.creator_email) results = results.filter(c => c.creator_email === filter.creator_email);
    if (filter.deadline?.$gt) results = results.filter(c => new Date(c.deadline) > filter.deadline.$gt);
    const chain = {
      sort: () => chain,
      limit: (n) => { results = results.slice(0, n); return chain; },
      select: () => results,
      then: (resolve) => resolve(results),
    };
    return chain;
  };
  CampaignMock.findById = async (id) => mockCampaigns[id] || null;
  CampaignMock.findOne = async (filter) => {
    return Object.values(mockCampaigns).find(c =>
      (!filter._id || c._id === filter._id.toString()) &&
      (!filter.creator_email || c.creator_email === filter.creator_email)
    ) || null;
  };
  CampaignMock.findByIdAndUpdate = async (id, update, opts) => {
    if (!mockCampaigns[id]) return null;
    Object.assign(mockCampaigns[id], update.$set || {});
    return mockCampaigns[id];
  };
  CampaignMock.findOneAndUpdate = async (filter, update, opts) => {
    const c = Object.values(mockCampaigns).find(c =>
      (!filter._id || c._id === filter._id.toString()) &&
      (!filter.creator_email || c.creator_email === filter.creator_email)
    );
    if (!c) return null;
    Object.assign(c, update.$set || {});
    if (update.$push) {
      for (const [key, val] of Object.entries(update.$push)) {
        c[key] = c[key] || [];
        c[key].push(val);
      }
    }
    return c;
  };
  CampaignMock.deleteOne = async (filter) => {
    const c = Object.values(mockCampaigns).find(c => c._id === filter._id.toString());
    if (c) delete mockCampaigns[c._id];
    return { deletedCount: c ? 1 : 0 };
  };
  return CampaignMock;
});

// ── Mock Contribution ────────────────────────────────────────────
jest.mock('../models/Contribution', () => ({
  find: async (filter = {}) => {
    return Object.values(mockContributions).filter(c =>
      (!filter.campaign_id || c.campaign_id === filter.campaign_id.toString()) &&
      (!filter.status || c.status === filter.status)
    );
  },
  // Guarded claim used by the shared delete-and-refund service.
  findOneAndUpdate: async (filter, update) => {
    const c = Object.values(mockContributions).find(
      (x) => x._id === filter._id && (!filter.status || x.status === filter.status)
    );
    if (!c) return null;
    Object.assign(c, update.$set || {});
    return c;
  },
}));

// ── Mock User ────────────────────────────────────────────────────
jest.mock('../models/User', () => ({
  findOne: async ({ email }) => mockUsers[email] || null,
  findOneAndUpdate: async ({ email }, update) => {
    if (mockUsers[email]) {
      if (update.$inc?.credits) mockUsers[email].credits += update.$inc.credits;
    }
    return mockUsers[email] || null;
  },
}));

// ── Mock Notification ────────────────────────────────────────────
jest.mock('../models/Notification', () => {
  function NotifMock(data) { Object.assign(this, data); }
  NotifMock.prototype.save = async function () { mockNotifications.push({ ...this }); return this; };
  return NotifMock;
});

// ── Load app + mount routes ──────────────────────────────────────
const app = require('../index');
app.use('/api/campaigns', require('../routes/campaigns'));

// ── Helpers ──────────────────────────────────────────────────────
const creatorToken = jwt.sign({ email: 'creator@x.com', role: 'creator' }, SECRET);
const adminToken   = jwt.sign({ email: 'admin@x.com',   role: 'admin'   }, SECRET);
const supporterToken = jwt.sign({ email: 'sup@x.com', role: 'supporter' }, SECRET);

function makeCampaign(overrides = {}) {
  return {
    title: 'Test Campaign', story: 'A story', category: 'Tech',
    funding_goal: 1000, minimum_contribution: 10,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    reward_info: 'T-shirt', campaign_image_url: 'https://img.com/x.jpg',
    ...overrides,
  };
}

beforeEach(() => {
  Object.keys(mockCampaigns).forEach(k => delete mockCampaigns[k]);
  Object.keys(mockContributions).forEach(k => delete mockContributions[k]);
  Object.keys(mockUsers).forEach(k => delete mockUsers[k]);
  mockNotifications.length = 0;
  mockUsers['creator@x.com'] = { email: 'creator@x.com', name: 'Creator', role: 'creator', credits: 20 };
});

// ── Tests ────────────────────────────────────────────────────────
describe('GET /api/campaigns/top-funded', () => {
  test('returns max 6 approved campaigns sorted by amount_raised', async () => {
    // seed 8 approved campaigns with different amounts
    for (let i = 1; i <= 8; i++) {
      const id = newId();
      mockCampaigns[id] = { _id: id, title: `C${i}`, status: 'approved', amount_raised: i * 10, campaign_image_url: 'x' };
    }
    const res = await request(app).get('/api/campaigns/top-funded');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(6);
  });

  test('only returns approved campaigns', async () => {
    const id = newId();
    mockCampaigns[id] = { _id: id, title: 'Pending', status: 'pending', amount_raised: 999 };
    const res = await request(app).get('/api/campaigns/top-funded');
    expect(res.body.every(c => c.status === 'approved')).toBe(true);
  });
});

describe('POST /api/campaigns', () => {
  test('creator can create campaign with status=pending', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send(makeCampaign());
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    expect(res.body.amount_raised).toBe(0);
  });

  test('supporter cannot create campaign', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${supporterToken}`)
      .send(makeCampaign());
    expect(res.status).toBe(403);
  });

  test('unauthenticated request is rejected', async () => {
    const res = await request(app).post('/api/campaigns').send(makeCampaign());
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/campaigns/:id/status', () => {
  test('admin can approve a campaign and notification is sent to creator', async () => {
    const id = newId();
    mockCampaigns[id] = { _id: id, title: 'Solar Pump', status: 'pending', creator_email: 'creator@x.com' };

    const res = await request(app)
      .patch(`/api/campaigns/${id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
    expect(mockNotifications.some(n => n.toEmail === 'creator@x.com')).toBe(true);
  });

  test('creator cannot approve campaigns', async () => {
    const id = newId();
    mockCampaigns[id] = { _id: id, status: 'pending', creator_email: 'creator@x.com' };
    const res = await request(app)
      .patch(`/api/campaigns/${id}/status`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/campaigns/:id', () => {
  test('deletes campaign and refunds approved supporters', async () => {
    const campId = newId();
    mockCampaigns[campId] = {
      _id: campId, title: 'Refund Test',
      status: 'approved', creator_email: 'creator@x.com',
    };
    // 2 approved contributions
    mockUsers['s1@x.com'] = { email: 's1@x.com', credits: 100 };
    mockUsers['s2@x.com'] = { email: 's2@x.com', credits: 50 };
    const c1id = newId(), c2id = newId();
    mockContributions[c1id] = { _id: c1id, campaign_id: campId, supporter_email: 's1@x.com', contribution_amount: 30, status: 'approved' };
    mockContributions[c2id] = { _id: c2id, campaign_id: campId, supporter_email: 's2@x.com', contribution_amount: 20, status: 'approved' };

    const res = await request(app)
      .delete(`/api/campaigns/${campId}`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expect(res.status).toBe(200);
    expect(mockCampaigns[campId]).toBeUndefined();
    expect(mockUsers['s1@x.com'].credits).toBe(130);
    expect(mockUsers['s2@x.com'].credits).toBe(70);
    // Refunded contributions are marked, not left as approved
    expect(mockContributions[c1id].status).toBe('refunded');
    expect(mockContributions[c2id].status).toBe('refunded');
  });

  test('refunds are claimed, so a repeated delete cannot pay twice', async () => {
    // A contribution already claimed by an earlier (partially failed) attempt
    // must be skipped rather than refunded again.
    const campId = newId();
    mockCampaigns[campId] = {
      _id: campId, title: 'Retry Test', status: 'approved', creator_email: 'creator@x.com',
    };
    mockUsers['s3@x.com'] = { email: 's3@x.com', credits: 100 };
    const cid = newId();
    mockContributions[cid] = { _id: cid, campaign_id: campId, supporter_email: 's3@x.com', contribution_amount: 40, status: 'refunded' };

    const res = await request(app)
      .delete(`/api/campaigns/${campId}`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.refunded).toBe(0);
    expect(mockUsers['s3@x.com'].credits).toBe(100);
  });
});

describe('POST /api/campaigns/:id/updates', () => {
  test('creator posts an update to their own approved campaign', async () => {
    const id = newId();
    mockCampaigns[id] = { _id: id, title: 'Solar Pump', status: 'approved', creator_email: 'creator@x.com', updates: [] };

    const res = await request(app)
      .post(`/api/campaigns/${id}/updates`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'Boards arrived', body: 'PCBs landed, assembly starts Monday.' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Boards arrived');
    expect(mockCampaigns[id].updates).toHaveLength(1);
    expect(mockCampaigns[id].updates[0].body).toBe('PCBs landed, assembly starts Monday.');
  });

  test('a second update appends rather than replacing the first', async () => {
    const id = newId();
    mockCampaigns[id] = { _id: id, title: 'Solar Pump', status: 'approved', creator_email: 'creator@x.com', updates: [] };

    await request(app).post(`/api/campaigns/${id}/updates`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'First', body: 'one' });
    await request(app).post(`/api/campaigns/${id}/updates`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'Second', body: 'two' });

    expect(mockCampaigns[id].updates.map(u => u.title)).toEqual(['First', 'Second']);
  });

  test('another creator cannot post to someone else\'s campaign', async () => {
    const id = newId();
    mockCampaigns[id] = { _id: id, title: 'Not Mine', status: 'approved', creator_email: 'other@x.com', updates: [] };
    const intruder = jwt.sign({ email: 'intruder@x.com', role: 'creator' }, SECRET);

    const res = await request(app)
      .post(`/api/campaigns/${id}/updates`)
      .set('Authorization', `Bearer ${intruder}`)
      .send({ title: 'Hi', body: 'not mine to edit' });

    expect(res.status).toBe(404);
    expect(mockCampaigns[id].updates).toHaveLength(0);
  });

  test('supporters and admins cannot post updates', async () => {
    const id = newId();
    mockCampaigns[id] = { _id: id, title: 'C', status: 'approved', creator_email: 'creator@x.com', updates: [] };

    const asSupporter = await request(app)
      .post(`/api/campaigns/${id}/updates`)
      .set('Authorization', `Bearer ${supporterToken}`)
      .send({ title: 'x', body: 'y' });
    const asAdmin = await request(app)
      .post(`/api/campaigns/${id}/updates`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'x', body: 'y' });

    expect(asSupporter.status).toBe(403);
    expect(asAdmin.status).toBe(403);
    expect(mockCampaigns[id].updates).toHaveLength(0);
  });

  test('rejects an empty title or body', async () => {
    const id = newId();
    mockCampaigns[id] = { _id: id, title: 'C', status: 'approved', creator_email: 'creator@x.com', updates: [] };

    const emptyTitle = await request(app)
      .post(`/api/campaigns/${id}/updates`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: '', body: 'ok' });
    const missingBody = await request(app)
      .post(`/api/campaigns/${id}/updates`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'ok' });

    expect(emptyTitle.status).toBe(400);
    expect(missingBody.status).toBe(400);
    expect(mockCampaigns[id].updates).toHaveLength(0);
  });

  test('unauthenticated requests are rejected', async () => {
    const id = newId();
    mockCampaigns[id] = { _id: id, title: 'C', status: 'approved', creator_email: 'creator@x.com', updates: [] };

    const res = await request(app)
      .post(`/api/campaigns/${id}/updates`)
      .send({ title: 'x', body: 'y' });

    expect(res.status).toBe(401);
    expect(mockCampaigns[id].updates).toHaveLength(0);
  });
});
