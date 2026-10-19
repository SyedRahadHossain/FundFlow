const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
const SECRET = 'test_secret';
const newId = () => new mongoose.Types.ObjectId().toString();

// ── Mock stores ──────────────────────────────────────────────────
const mockCampaigns = {};
const mockContributions = {};
const mockUsers = {};
const mockNotifications = [];

// ── Mock Campaign ────────────────────────────────────────────────
jest.mock('../models/Campaign', () => ({
  findById: async (id) => mockCampaigns[id.toString()] || null,
  findByIdAndUpdate: async (id, update) => {
    if (mockCampaigns[id]) {
      if (update.$inc?.amount_raised) mockCampaigns[id].amount_raised += update.$inc.amount_raised;
    }
    return mockCampaigns[id] || null;
  },
}));

// ── Mock Contribution ────────────────────────────────────────────
jest.mock('../models/Contribution', () => {
  function ContribMock(data) {
    Object.assign(this, data);
    this._id = newId();
    if (!this.status) this.status = 'pending';
  }
  ContribMock.prototype.save = async function () {
    mockContributions[this._id] = { ...this };
    return this;
  };
  ContribMock.findOne = async (filter) => {
    const found = Object.values(mockContributions).find(c =>
      (!filter._id || c._id === filter._id.toString()) &&
      (!filter.creator_email || c.creator_email === filter.creator_email) &&
      (!filter.supporter_email || c.supporter_email === filter.supporter_email)
    );
    if (!found) return null;
    const inst = new ContribMock(found);
    inst.save = async function () { mockContributions[this._id] = { ...this }; return this; };
    return inst;
  };
  ContribMock.find = (filter = {}) => {
    let results = Object.values(mockContributions).filter(c =>
      (!filter.supporter_email || c.supporter_email === filter.supporter_email) &&
      (!filter.campaign_id || c.campaign_id === filter.campaign_id.toString()) &&
      (!filter.status || c.status === filter.status) &&
      (!filter.creator_email || c.creator_email === filter.creator_email)
    );
    // skip/limit actually slice, matching Mongoose — otherwise every paginated
    // response would silently return the full set.
    let skipped = 0;
    const chain = {
      sort: () => chain,
      skip: (n) => { skipped = n; return chain; },
      limit: (n) => results.slice(skipped, skipped + n),
      then: (resolve) => resolve(results.slice(skipped)),
    };
    return chain;
  };
  // Mirrors the real Mongoose behaviour: countDocuments honours the same
  // filter find() does, so totals stay consistent under a status filter.
  ContribMock.countDocuments = async (filter = {}) =>
    Object.values(mockContributions).filter(c =>
      (!filter.supporter_email || c.supporter_email === filter.supporter_email) &&
      (!filter.campaign_id || c.campaign_id === filter.campaign_id.toString()) &&
      (!filter.status || c.status === filter.status) &&
      (!filter.creator_email || c.creator_email === filter.creator_email)
    ).length;
  return ContribMock;
});

// ── Mock User ────────────────────────────────────────────────────
jest.mock('../models/User', () => ({
  findOne: async ({ email }) => mockUsers[email] || null,
  findOneAndUpdate: async ({ email }, update) => {
    if (mockUsers[email] && update.$inc?.credits !== undefined) {
      mockUsers[email].credits += update.$inc.credits;
    }
    return mockUsers[email] || null;
  },
}));

// ── Mock Notification ────────────────────────────────────────────
jest.mock('../models/Notification', () => {
  function N(data) { Object.assign(this, data); }
  N.prototype.save = async function () { mockNotifications.push({ ...this }); return this; };
  return N;
});

// ── App setup ────────────────────────────────────────────────────
const app = require('../index');
app.use('/api/contributions', require('../routes/contributions'));

const creatorToken   = jwt.sign({ email: 'cr@x.com', role: 'creator' }, SECRET);
const supporterToken = jwt.sign({ email: 'sup@x.com', role: 'supporter' }, SECRET);

function seedCampaign(overrides = {}) {
  const id = newId();
  mockCampaigns[id] = {
    _id: id, title: 'Test Campaign',
    status: 'approved',
    minimum_contribution: 10,
    deadline: new Date(Date.now() + 86400000),
    creator_email: 'cr@x.com', creator_name: 'Creator',
    amount_raised: 0,
    ...overrides,
  };
  return id;
}

beforeEach(() => {
  Object.keys(mockCampaigns).forEach(k => delete mockCampaigns[k]);
  Object.keys(mockContributions).forEach(k => delete mockContributions[k]);
  Object.keys(mockUsers).forEach(k => delete mockUsers[k]);
  mockNotifications.length = 0;
  mockUsers['sup@x.com'] = { email: 'sup@x.com', name: 'Supporter', role: 'supporter', credits: 100 };
  mockUsers['cr@x.com']  = { email: 'cr@x.com',  name: 'Creator',   role: 'creator',   credits: 20  };
});

// ── Tests ────────────────────────────────────────────────────────
describe('POST /api/contributions', () => {
  test('deducts credits from supporter on submit', async () => {
    const campId = seedCampaign();
    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${supporterToken}`)
      .send({ campaign_id: campId, contribution_amount: 30 });
    expect(res.status).toBe(201);
    expect(mockUsers['sup@x.com'].credits).toBe(70);
  });

  test('contribution saved with status=pending', async () => {
    const campId = seedCampaign();
    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${supporterToken}`)
      .send({ campaign_id: campId, contribution_amount: 20 });
    expect(res.body.status).toBe('pending');
  });

  test('rejects if insufficient credits', async () => {
    const campId = seedCampaign();
    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${supporterToken}`)
      .send({ campaign_id: campId, contribution_amount: 200 });
    expect(res.status).toBe(400);
    expect(mockUsers['sup@x.com'].credits).toBe(100); // unchanged
  });

  test('rejects if below minimum contribution', async () => {
    const campId = seedCampaign({ minimum_contribution: 50 });
    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${supporterToken}`)
      .send({ campaign_id: campId, contribution_amount: 5 });
    expect(res.status).toBe(400);
  });

  test('notifies creator on new contribution', async () => {
    const campId = seedCampaign();
    await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${supporterToken}`)
      .send({ campaign_id: campId, contribution_amount: 10 });
    expect(mockNotifications.some(n => n.toEmail === 'cr@x.com')).toBe(true);
  });

  test('creator cannot contribute', async () => {
    const campId = seedCampaign();
    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ campaign_id: campId, contribution_amount: 10 });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/contributions/:id/approve', () => {
  test('adds amount to campaign amount_raised', async () => {
    const campId = seedCampaign();
    const cid = newId();
    mockContributions[cid] = {
      _id: cid, campaign_id: campId, contribution_amount: 50,
      supporter_email: 'sup@x.com', creator_email: 'cr@x.com',
      campaign_title: 'Test', creator_name: 'Creator', status: 'pending',
    };
    const res = await request(app)
      .patch(`/api/contributions/${cid}/approve`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
    expect(mockCampaigns[campId].amount_raised).toBe(50);
  });

  test('notifies supporter on approval', async () => {
    const campId = seedCampaign();
    const cid = newId();
    mockContributions[cid] = {
      _id: cid, campaign_id: campId, contribution_amount: 25,
      supporter_email: 'sup@x.com', creator_email: 'cr@x.com',
      campaign_title: 'Test', creator_name: 'Creator', status: 'pending',
    };
    await request(app)
      .patch(`/api/contributions/${cid}/approve`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expect(mockNotifications.some(n => n.toEmail === 'sup@x.com')).toBe(true);
  });
});

describe('PATCH /api/contributions/:id/reject', () => {
  test('refunds exact contribution amount to supporter', async () => {
    const campId = seedCampaign();
    const cid = newId();
    mockContributions[cid] = {
      _id: cid, campaign_id: campId, contribution_amount: 30,
      supporter_email: 'sup@x.com', creator_email: 'cr@x.com',
      campaign_title: 'Test', creator_name: 'Creator', status: 'pending',
    };
    // Supporter already had credits deducted on submit
    mockUsers['sup@x.com'].credits = 70;

    const res = await request(app)
      .patch(`/api/contributions/${cid}/reject`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rejected');
    expect(mockUsers['sup@x.com'].credits).toBe(100); // 70 + 30 refund
  });

  test('notifies supporter on rejection', async () => {
    const campId = seedCampaign();
    const cid = newId();
    mockContributions[cid] = {
      _id: cid, campaign_id: campId, contribution_amount: 10,
      supporter_email: 'sup@x.com', creator_email: 'cr@x.com',
      campaign_title: 'Test', creator_name: 'Creator', status: 'pending',
    };
    await request(app)
      .patch(`/api/contributions/${cid}/reject`)
      .set('Authorization', `Bearer ${creatorToken}`);
    expect(mockNotifications.some(n => n.toEmail === 'sup@x.com')).toBe(true);
  });
});

describe('GET /api/contributions/mine — status filter', () => {
  function seedContribution(status, amount = 10) {
    const cid = newId();
    mockContributions[cid] = {
      _id: cid, campaign_id: seedCampaign(), contribution_amount: amount,
      supporter_email: 'sup@x.com', creator_email: 'cr@x.com',
      campaign_title: 'Test', creator_name: 'Creator', status,
    };
    return cid;
  }

  test('returns every status when no filter is given', async () => {
    seedContribution('approved');
    seedContribution('pending');
    seedContribution('rejected');

    const res = await request(app)
      .get('/api/contributions/mine')
      .set('Authorization', `Bearer ${supporterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.contributions).toHaveLength(3);
  });

  test('status=approved returns only approved contributions', async () => {
    seedContribution('approved', 40);
    seedContribution('approved', 25);
    seedContribution('pending');
    seedContribution('rejected');

    const res = await request(app)
      .get('/api/contributions/mine?status=approved')
      .set('Authorization', `Bearer ${supporterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.contributions.every(c => c.status === 'approved')).toBe(true);
  });

  test('the filtered total drives pagination', async () => {
    for (let i = 0; i < 5; i++) seedContribution('approved');
    seedContribution('pending');

    const res = await request(app)
      .get('/api/contributions/mine?status=approved&page=1&limit=2')
      .set('Authorization', `Bearer ${supporterToken}`);

    expect(res.body.total).toBe(5);
    expect(res.body.totalPages).toBe(3);
    expect(res.body.contributions).toHaveLength(2);
  });

  test('an unknown status is rejected rather than silently matching nothing', async () => {
    seedContribution('approved');

    const res = await request(app)
      .get('/api/contributions/mine?status=not_a_status')
      .set('Authorization', `Bearer ${supporterToken}`);

    expect(res.status).toBe(400);
  });

  test('the filter still scopes to the logged-in supporter', async () => {
    const cid = newId();
    mockContributions[cid] = {
      _id: cid, campaign_id: seedCampaign(), contribution_amount: 10,
      supporter_email: 'someone_else@x.com', creator_email: 'cr@x.com',
      campaign_title: 'Test', creator_name: 'Creator', status: 'approved',
    };
    seedContribution('approved');

    const res = await request(app)
      .get('/api/contributions/mine?status=approved')
      .set('Authorization', `Bearer ${supporterToken}`);

    expect(res.body.total).toBe(1);
    expect(res.body.contributions[0].supporter_email).toBe('sup@x.com');
  });
});
