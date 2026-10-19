const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
const SECRET = 'test_secret';
const newId = () => new mongoose.Types.ObjectId().toString();

// ── Mock stores ──────────────────────────────────────────────────
const mockWithdrawals = {};
const mockCampaigns = {};
const mockUsers = {};
const mockPayments = {};
const mockNotifications = [];
const mockReports = {};

// ── Mock Withdrawal ──────────────────────────────────────────────
jest.mock('../models/Withdrawal', () => {
  function W(data) { Object.assign(this, data); this._id = newId(); if (!this.status) this.status = 'pending'; }
  W.prototype.save = async function () { mockWithdrawals[this._id] = { ...this }; return this; };
  W.findById = async (id) => {
    const found = mockWithdrawals[id.toString()];
    if (!found) return null;
    const inst = new W(found);
    inst.save = async function () { mockWithdrawals[this._id] = { ...this }; return this; };
    return inst;
  };
  W.find = (filter = {}) => {
    let r = Object.values(mockWithdrawals);
    if (filter.status) r = r.filter(w => w.status === filter.status);
    if (filter.creator_email) r = r.filter(w => w.creator_email === filter.creator_email);
    return { sort: () => r, then: (res) => res(r) };
  };
  return W;
});

// ── Mock Campaign ────────────────────────────────────────────────
jest.mock('../models/Campaign', () => ({
  find: (filter = {}) => {
    let r = Object.values(mockCampaigns);
    if (filter.creator_email) r = r.filter(c => c.creator_email === filter.creator_email);
    if (filter.status) r = r.filter(c => c.status === filter.status);
    return { sort: () => r, then: (res) => res(r) };
  },
  findById: async (id) => mockCampaigns[id.toString()] || null,
  findByIdAndUpdate: async (id, update) => {
    if (mockCampaigns[id] && update.$inc?.amount_raised !== undefined) {
      mockCampaigns[id].amount_raised += update.$inc.amount_raised;
    }
    return mockCampaigns[id] || null;
  },
  findByIdAndDelete: async (id) => { delete mockCampaigns[id]; return null; },
}));

// ── Mock User ────────────────────────────────────────────────────
jest.mock('../models/User', () => ({
  findOne: async ({ email }) => mockUsers[email] || null,
  findOneAndUpdate: async ({ email }, update) => {
    if (mockUsers[email] && update.$inc?.credits !== undefined) {
      mockUsers[email].credits += update.$inc.credits;
    }
    return mockUsers[email] || null;
  },
  find: () => ({ select: () => Object.values(mockUsers) }),
  countDocuments: async (filter) => Object.values(mockUsers).filter(u => (!filter?.role || u.role === filter.role)).length,
  findByIdAndDelete: async (id) => {
    const u = Object.values(mockUsers).find(u => u._id === id);
    if (u) delete mockUsers[u.email];
    return u || null;
  },
  findByIdAndUpdate: (id, update, opts) => {
    const u = Object.values(mockUsers).find(u => u._id === id);
    if (u && update.$set?.role) u.role = update.$set.role;
    const result = u || null;
    return { select: () => result, then: (res) => res(result) };
  },
}));

// ── Mock Payment ─────────────────────────────────────────────────
jest.mock('../models/Payment', () => {
  function P(data) { Object.assign(this, data); this._id = newId(); }
  P.prototype.save = async function () { mockPayments[this._id] = { ...this }; return this; };
  P.find = (filter = {}) => {
    let r = Object.values(mockPayments);
    if (filter.supporter_email) r = r.filter(p => p.supporter_email === filter.supporter_email);
    return { sort: () => r, then: (res) => res(r) };
  };
  return P;
});

// ── Mock Notification ────────────────────────────────────────────
jest.mock('../models/Notification', () => {
  function N(data) { Object.assign(this, data); }
  N.prototype.save = async function () { mockNotifications.push({ ...this }); return this; };
  N.find = (filter = {}) => {
    let r = [...mockNotifications];
    if (filter.toEmail) r = r.filter(n => n.toEmail === filter.toEmail);
    return { sort: () => r, then: (res) => res(r) };
  };
  N.updateMany = async (filter, update) => {
    let r = [...mockNotifications];
    if (filter.toEmail) r = r.filter(n => n.toEmail === filter.toEmail);
    r.forEach(n => Object.assign(n, update.$set || {}));
    return { modifiedCount: r.length };
  };
  return N;
});

// ── Mock Report ──────────────────────────────────────────────────
jest.mock('../models/Report', () => {
  function R(data) { Object.assign(this, data); this._id = newId(); }
  R.prototype.save = async function () { mockReports[this._id] = { ...this }; return this; };
  R.find = () => { let r = Object.values(mockReports); return { sort: () => r, then: (res) => res(r) }; };
  return R;
});

// ── App + routes ─────────────────────────────────────────────────
const app = require('../index');
app.use('/api/withdrawals',  require('../routes/withdrawals'));
app.use('/api/payments',     require('../routes/payments'));
app.use('/api/notifications',require('../routes/notifications'));
app.use('/api/reports',      require('../routes/reports'));
app.use('/api/users',        require('../routes/users'));

const creatorToken   = jwt.sign({ email: 'cr@x.com', role: 'creator' }, SECRET);
const adminToken     = jwt.sign({ email: 'adm@x.com', role: 'admin' }, SECRET);
const supporterToken = jwt.sign({ email: 'sup@x.com', role: 'supporter' }, SECRET);

beforeEach(() => {
  [mockWithdrawals, mockCampaigns, mockUsers, mockPayments, mockReports].forEach(store =>
    Object.keys(store).forEach(k => delete store[k])
  );
  mockNotifications.length = 0;
  mockUsers['cr@x.com']  = { _id: 'uid_cr',  email: 'cr@x.com',  name: 'Creator',   role: 'creator',   credits: 20 };
  mockUsers['sup@x.com'] = { _id: 'uid_sup', email: 'sup@x.com', name: 'Supporter', role: 'supporter', credits: 100 };
  mockUsers['adm@x.com'] = { _id: 'uid_adm', email: 'adm@x.com', name: 'Admin',     role: 'admin',     credits: 0 };
});

// ── Withdrawal tests ─────────────────────────────────────────────
describe('POST /api/withdrawals', () => {
  test('rejects if raised credits < 200', async () => {
    mockCampaigns['c1'] = { _id: 'c1', creator_email: 'cr@x.com', status: 'approved', amount_raised: 150 };
    const res = await request(app)
      .post('/api/withdrawals')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ withdrawal_credit: 150, payment_system: 'stripe', account_number: '123' });
    expect(res.status).toBe(400);
  });

  test('creates withdrawal with correct dollar amount (20 credits = $1)', async () => {
    mockCampaigns['c1'] = { _id: 'c1', creator_email: 'cr@x.com', status: 'approved', amount_raised: 400 };
    const res = await request(app)
      .post('/api/withdrawals')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ withdrawal_credit: 200, payment_system: 'stripe', account_number: '123' });
    expect(res.status).toBe(201);
    expect(res.body.withdrawal_amount).toBe(10); // 200/20 = $10
    expect(res.body.status).toBe('pending');
  });

  test('rejects withdrawal exceeding total raised', async () => {
    mockCampaigns['c1'] = { _id: 'c1', creator_email: 'cr@x.com', status: 'approved', amount_raised: 300 };
    const res = await request(app)
      .post('/api/withdrawals')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ withdrawal_credit: 500, payment_system: 'stripe', account_number: '123' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/withdrawals/:id/approve', () => {
  test('sets status to approved and notifies creator', async () => {
    mockCampaigns['c1'] = { _id: 'c1', creator_email: 'cr@x.com', status: 'approved', amount_raised: 400 };
    const wid = newId();
    mockWithdrawals[wid] = {
      _id: wid, creator_email: 'cr@x.com', withdrawal_credit: 200,
      withdrawal_amount: 10, status: 'pending',
    };
    const res = await request(app)
      .patch(`/api/withdrawals/${wid}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
    expect(mockNotifications.some(n => n.toEmail === 'cr@x.com')).toBe(true);
  });
});

// ── Payment tests ────────────────────────────────────────────────
describe('POST /api/payments', () => {
  test('route no longer exists — credits cannot be minted from a request body', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${supporterToken}`)
      .send({ credits: 1000000, amount: 0.01 });
    expect(res.status).toBe(404);
    expect(mockUsers['sup@x.com'].credits).toBe(100);
    expect(Object.keys(mockPayments).length).toBe(0);
  });
});

// ── Notification tests ───────────────────────────────────────────
describe('GET /api/notifications', () => {
  test('returns only current user notifications', async () => {
    mockNotifications.push({ message: 'For sup', toEmail: 'sup@x.com', actionRoute: '/', time: new Date() });
    mockNotifications.push({ message: 'For cr', toEmail: 'cr@x.com', actionRoute: '/', time: new Date() });
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${supporterToken}`);
    expect(res.status).toBe(200);
    expect(res.body.every(n => n.toEmail === 'sup@x.com')).toBe(true);
  });

  test('POST /api/notifications/mark-all-read marks user notifications read', async () => {
    mockNotifications.push({ message: 'n1', toEmail: 'sup@x.com', read: false, time: new Date() });
    mockNotifications.push({ message: 'n2', toEmail: 'sup@x.com', read: false, time: new Date() });
    mockNotifications.push({ message: 'n3', toEmail: 'cr@x.com', read: false, time: new Date() });
    const res = await request(app)
      .post('/api/notifications/mark-all-read')
      .set('Authorization', `Bearer ${supporterToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const unread = mockNotifications.filter(n => n.toEmail === 'sup@x.com' && !n.read);
    expect(unread.length).toBe(0);
  });
});

// ── Reports tests ────────────────────────────────────────────────
describe('POST /api/reports', () => {
  test('supporter can report a campaign', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${supporterToken}`)
      .send({ campaign_id: newId(), campaign_title: 'Scam', reason: 'Fake' });
    expect(res.status).toBe(201);
  });

  test('creator cannot submit reports', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ campaign_id: newId(), campaign_title: 'X', reason: 'Y' });
    expect(res.status).toBe(403);
  });

  test('reporter_name is resolved server-side from the reporter\'s account', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${supporterToken}`)
      .send({ campaign_id: newId(), campaign_title: 'Scam', reason: 'Fake' });
    expect(res.status).toBe(201);
    expect(res.body.reporter_email).toBe('sup@x.com');
    expect(res.body.reporter_name).toBe('Supporter');
    expect(mockReports[res.body._id].reporter_name).toBe('Supporter');
  });

  test('a client-supplied reporter_name cannot attribute a report to someone else', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${supporterToken}`)
      .send({
        campaign_id: newId(),
        campaign_title: 'Scam',
        reason: 'Fake',
        reporter_email: 'admin@elsewhere.com',
        reporter_name: 'Someone Else',
      });
    expect(res.status).toBe(201);
    expect(res.body.reporter_email).toBe('sup@x.com');
    expect(res.body.reporter_name).toBe('Supporter');
  });

  test('reporter_name falls back to the email when the account has no name', async () => {
    mockUsers['noname@x.com'] = { email: 'noname@x.com', role: 'supporter', credits: 10 };
    const anon = jwt.sign({ email: 'noname@x.com', role: 'supporter' }, SECRET);
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${anon}`)
      .send({ campaign_id: newId(), campaign_title: 'Scam', reason: 'Fake' });
    expect(res.status).toBe(201);
    expect(res.body.reporter_name).toBe('noname@x.com');
  });
});

// ── User management tests ────────────────────────────────────────
describe('PATCH /api/users/:id/role', () => {
  test('admin can change user role', async () => {
    const res = await request(app)
      .patch('/api/users/uid_sup/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'creator' });
    expect(res.status).toBe(200);
    expect(mockUsers['sup@x.com'].role).toBe('creator');
  });

  test('rejects invalid role', async () => {
    const res = await request(app)
      .patch('/api/users/uid_sup/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'hacker' });
    expect(res.status).toBe(400);
  });

  test('supporter cannot manage users', async () => {
    const res = await request(app)
      .patch('/api/users/uid_cr/role')
      .set('Authorization', `Bearer ${supporterToken}`)
      .send({ role: 'admin' });
    expect(res.status).toBe(403);
  });
});
