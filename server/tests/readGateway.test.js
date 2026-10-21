const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const SECRET = 'test_secret';
const newId = () => new mongoose.Types.ObjectId().toString();

const mockCampaigns = {};

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
  CampaignMock.find = (filter = {}) => {
    let results = Object.values(mockCampaigns);
    if (filter.status) results = results.filter((c) => c.status === filter.status);
    if (filter.creator_email) results = results.filter((c) => c.creator_email === filter.creator_email);
    if (filter.deadline?.$gt) results = results.filter((c) => new Date(c.deadline) > filter.deadline.$gt);
    const chain = {
      sort: () => chain,
      limit: (n) => { results = results.slice(0, n); return chain; },
      select: () => results,
      then: (resolve) => resolve(results),
    };
    return chain;
  };
  CampaignMock.aggregate = async () => [[]];
  CampaignMock.findById = async (id) => mockCampaigns[id.toString()] || null;
  CampaignMock.findOne = async (filter) =>
    Object.values(mockCampaigns).find((c) =>
      (!filter._id || c._id === filter._id.toString()) &&
      (!filter.creator_email || c.creator_email === filter.creator_email)
    ) || null;
  return CampaignMock;
});

jest.mock('../models/User', () => ({ findOne: async () => null }));
jest.mock('../models/Notification', () => {
  function NotificationMock(data) { Object.assign(this, data); }
  NotificationMock.prototype.save = async function () { return this; };
  return NotificationMock;
});

const app = require('../index');

const adminToken = jwt.sign({ email: 'admin@x.com', role: 'admin' }, SECRET);

beforeEach(() => {
  Object.keys(mockCampaigns).forEach((k) => delete mockCampaigns[k]);
  mockCampaigns[newId()] = {
    _id: newId(),
    title: 'A campaign',
    story: 'A story',
    category: 'Music',
    status: 'approved',
    amount_raised: 10,
    deadline: new Date(Date.now() + 86400000),
    creator_email: 'cr@x.com',
    creator_name: 'Creator',
  };
});

describe('GET /api/read — the second way to read', () => {
  test('carries a campaign read', async () => {
    const res = await request(app)
      .get('/api/read?route=campaigns&status=approved')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('A campaign');
  });

  test('carries the listing read', async () => {
    const res = await request(app)
      .get('/api/read?route=campaigns/listing')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ total: expect.any(Number) }));
  });

  test('the route name is not a proxy: anything else is refused', async () => {
    const res = await request(app)
      .get('/api/read?route=users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  test('a path that tries to climb out is refused', async () => {
    const res = await request(app)
      .get('/api/read?route=../../etc/passwd')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  test('without a route there is nothing to read', async () => {
    const res = await request(app).get('/api/read');

    expect(res.status).toBe(400);
  });

  test("the creator's own campaigns travel by the gateway", async () => {
    const res = await request(app).get('/api/read?route=campaigns/mine');

    expect(res.status).toBe(401);
  });

  test('a campaign by its id travels by the gateway', async () => {
    const id = newId();
    mockCampaigns[id] = { _id: id, title: 'By id', status: 'approved', amount_raised: 0 };

    const res = await request(app).get(`/api/read?route=campaigns/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('By id');
  });

  test('a path that is not a campaign id is refused', async () => {
    const res = await request(app)
      .get('/api/read?route=campaigns/not-an-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  test("the caller's token decides what it may read", async () => {
    // The approved catalog is public, so the read that needs a token is the
    // unfiltered one: the gateway must not hand it out to an anonymous
    // caller.
    const res = await request(app).get('/api/read?route=campaigns');

    expect(res.status).toBe(401);
  });
});
