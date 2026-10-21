const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const SECRET = 'test_secret';
const newId = () => new mongoose.Types.ObjectId().toString();

const mockCampaigns = {};
const mockUsers = {};
const mockNotifications = [];

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
  CampaignMock.findById = async (id) => mockCampaigns[id.toString()] || null;
  CampaignMock.findOne = async (filter) =>
    Object.values(mockCampaigns).find((c) =>
      (!filter._id || c._id === filter._id.toString()) &&
      (!filter.creator_email || c.creator_email === filter.creator_email)
    ) || null;
  CampaignMock.findOneAndUpdate = async (filter, update) => {
    const c = Object.values(mockCampaigns).find((x) =>
      (!filter._id || x._id === filter._id.toString()) &&
      (!filter.creator_email || x.creator_email === filter.creator_email)
    );
    if (!c) return null;
    Object.assign(c, update.$set || {});
    if (update.$push) {
      for (const [key, value] of Object.entries(update.$push)) {
        c[key] = c[key] || [];
        c[key].push(value);
      }
    }
    return c;
  };
  CampaignMock.findByIdAndUpdate = async (id, update) => {
    if (!mockCampaigns[id.toString()]) return null;
    Object.assign(mockCampaigns[id.toString()], update.$set || {});
    return mockCampaigns[id.toString()];
  };
  return CampaignMock;
});

jest.mock('../models/User', () => ({
  findOne: async ({ email }) => mockUsers[email] || null,
}));

jest.mock('../models/Notification', () => {
  function NotificationMock(data) { Object.assign(this, data); }
  NotificationMock.prototype.save = async function () {
    mockNotifications.push({ ...this });
    return this;
  };
  return NotificationMock;
});

const app = require('../index');
app.use('/api/campaigns', require('../routes/campaigns'));

const creatorToken = jwt.sign({ email: 'cr@x.com', role: 'creator' }, SECRET);
const adminToken = jwt.sign({ email: 'admin@x.com', role: 'admin' }, SECRET);

const HOSTILE = 'A campaign to drive Muslims out of the district';

function seed(overrides = {}) {
  const id = newId();
  mockCampaigns[id] = {
    _id: id,
    title: 'A quiet project',
    story: 'A community project that helps families.',
    category: 'Community',
    funding_goal: 500,
    minimum_contribution: 10,
    deadline: new Date(Date.now() + 86400000),
    reward_info: '',
    creator_email: 'cr@x.com',
    creator_name: 'Creator',
    amount_raised: 0,
    status: 'pending',
    updates: [],
    ...overrides,
  };
  return id;
}

beforeEach(() => {
  Object.keys(mockCampaigns).forEach((k) => delete mockCampaigns[k]);
  mockNotifications.length = 0;
  mockUsers['cr@x.com'] = { email: 'cr@x.com', name: 'Creator', role: 'creator', credits: 20 };
});

describe('POST /api/campaigns — the content policy', () => {
  test('refuses a campaign that attacks Islam', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Neighbourhood march',
        story: HOSTILE,
        category: 'Community',
        funding_goal: 500,
        minimum_contribution: 10,
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/attack a religion/i);
    expect(Object.keys(mockCampaigns)).toHaveLength(0);
  });

  test('refuses a campaign whose title attacks Islam', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: HOSTILE,
        story: 'A story about a community project.',
        category: 'Community',
        funding_goal: 500,
        minimum_contribution: 10,
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(422);
    expect(Object.keys(mockCampaigns)).toHaveLength(0);
  });

  test('accepts a campaign about a mosque', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'A new roof for the village mosque',
        story: 'The mosque roof leaks in the rains and the hall has to be closed.',
        category: 'Community',
        funding_goal: 500,
        minimum_contribution: 10,
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(Object.keys(mockCampaigns)).toHaveLength(1);
  });

  test('the refusal does not repeat the offending text back', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Neighbourhood march',
        story: HOSTILE,
        category: 'Community',
        funding_goal: 500,
        minimum_contribution: 10,
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(JSON.stringify(res.body)).not.toMatch(/muslim/i);
  });
});

describe('PATCH /api/campaigns/:id — the content policy', () => {
  test('refuses an edit that turns the campaign into an attack', async () => {
    const id = seed();

    const res = await request(app)
      .patch(`/api/campaigns/${id}`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'A quiet project', story: HOSTILE, reward_info: '' });

    expect(res.status).toBe(422);
    expect(mockCampaigns[id].story).toBe('A community project that helps families.');
  });

  test('accepts an ordinary edit', async () => {
    const id = seed();

    const res = await request(app)
      .patch(`/api/campaigns/${id}`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'A better title', story: 'A longer story about the project.', reward_info: 'A thank you note' });

    expect(res.status).toBe(200);
    expect(mockCampaigns[id].title).toBe('A better title');
  });
});

describe('PATCH /api/campaigns/:id/status — the content policy', () => {
  test('refuses to publish a campaign that attacks Islam', async () => {
    const id = seed({ story: HOSTILE });

    const res = await request(app)
      .patch(`/api/campaigns/${id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(422);
    expect(mockCampaigns[id].status).toBe('pending');
  });

  test('lets an admin reject such a campaign', async () => {
    const id = seed({ story: HOSTILE });

    const res = await request(app)
      .patch(`/api/campaigns/${id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' });

    expect(res.status).toBe(200);
    expect(mockCampaigns[id].status).toBe('rejected');
  });

  test('publishes an ordinary campaign', async () => {
    const id = seed();

    const res = await request(app)
      .patch(`/api/campaigns/${id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(200);
    expect(mockCampaigns[id].status).toBe('approved');
  });
});

describe('POST /api/campaigns/:id/updates — the content policy', () => {
  test('refuses a progress update that attacks Islam', async () => {
    const id = seed();

    const res = await request(app)
      .post(`/api/campaigns/${id}/updates`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'Next week', body: HOSTILE });

    expect(res.status).toBe(422);
    expect(mockCampaigns[id].updates).toHaveLength(0);
  });

  test('accepts an ordinary progress update', async () => {
    const id = seed();

    const res = await request(app)
      .post(`/api/campaigns/${id}/updates`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'Roof finished', body: 'The mosque roof is on and the hall is open again.' });

    expect(res.status).toBe(201);
    expect(mockCampaigns[id].updates).toHaveLength(1);
  });
});
