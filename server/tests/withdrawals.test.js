const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
const SECRET = 'test_secret';
const newId = () => new mongoose.Types.ObjectId().toString();

// ── Mock stores ──────────────────────────────────────────────────
const mockCampaigns = {};
const mockWithdrawals = [];
const mockUsers = {};
const mockNotifications = [];

// ── Mock Campaign ────────────────────────────────────────────────
jest.mock('../models/Campaign', () => ({
  // The POST path awaits find() directly; the approve path chains .sort().
  find: (filter = {}) => {
    let results = Object.values(mockCampaigns).filter(c =>
      (!filter.creator_email || c.creator_email === filter.creator_email) &&
      (!filter.status || c.status === filter.status)
    );
    const chain = {
      sort: () => {
        results = [...results].sort((a, b) => (b.amount_raised || 0) - (a.amount_raised || 0));
        return chain;
      },
      then: (resolve) => resolve(results),
    };
    return chain;
  },
  findByIdAndUpdate: async (id, update) => {
    const c = mockCampaigns[id];
    if (!c) return null;
    if (update.$inc?.amount_raised !== undefined) c.amount_raised += update.$inc.amount_raised;
    return c;
  },
}));

// ── Mock Withdrawal ──────────────────────────────────────────────
jest.mock('../models/Withdrawal', () => {
  function WithdrawalMock(data) {
    Object.assign(this, data);
    this._id = this._id || newId();
    this.status = this.status || 'pending';
    this.withdraw_date = this.withdraw_date || new Date();
  }
  WithdrawalMock.prototype.save = async function () {
    const i = mockWithdrawals.findIndex(w => w._id === this._id);
    if (i >= 0) mockWithdrawals[i] = { ...this };
    else mockWithdrawals.push({ ...this });
    return this;
  };
  WithdrawalMock.find = async (filter = {}) => mockWithdrawals.filter(w =>
    (!filter.creator_email || w.creator_email === filter.creator_email) &&
    (!filter.status || w.status === filter.status)
  );
  WithdrawalMock.findById = async (id) => {
    const w = mockWithdrawals.find(x => x._id === id);
    if (!w) return null;
    return Object.assign(Object.create(WithdrawalMock.prototype), w);
  };
  return WithdrawalMock;
});

// ── Mock User ────────────────────────────────────────────────────
jest.mock('../models/User', () => ({
  findOne: async ({ email }) => mockUsers[email] || null,
}));

// ── Mock Notification ────────────────────────────────────────────
jest.mock('../models/Notification', () => {
  function NotifMock(data) { Object.assign(this, data); }
  NotifMock.prototype.save = async function () { mockNotifications.push({ ...this }); return this; };
  return NotifMock;
});

// ── Load app + mount route ───────────────────────────────────────
const app = require('../index');
app.use('/api/withdrawals', require('../routes/withdrawals'));

// ── Helpers ──────────────────────────────────────────────────────
const creatorToken = jwt.sign({ email: 'cr@x.com', role: 'creator' }, SECRET);
const adminToken = jwt.sign({ email: 'admin@x.com', role: 'admin' }, SECRET);

function seedCampaign(amountRaised) {
  const id = newId();
  mockCampaigns[id] = {
    _id: id, status: 'approved', creator_email: 'cr@x.com', amount_raised: amountRaised,
  };
  return id;
}

function seedWithdrawal(overrides = {}) {
  const w = {
    _id: newId(), creator_email: 'cr@x.com', status: 'pending',
    withdrawal_credit: 1000, withdrawal_amount: 50, ...overrides,
  };
  mockWithdrawals.push(w);
  return w;
}

const withdraw = (amount) =>
  request(app)
    .post('/api/withdrawals')
    .set('Authorization', `Bearer ${creatorToken}`)
    .send({ withdrawal_credit: amount, payment_system: 'PayPal', account_number: 'acc-1' });

beforeEach(() => {
  Object.keys(mockCampaigns).forEach(k => delete mockCampaigns[k]);
  mockWithdrawals.length = 0;
  Object.keys(mockUsers).forEach(k => delete mockUsers[k]);
  mockNotifications.length = 0;
  mockUsers['cr@x.com'] = { email: 'cr@x.com', name: 'Creator', role: 'creator', credits: 0 };
});

// ── Tests ────────────────────────────────────────────────────────
describe('POST /api/withdrawals', () => {
  test('a creator can withdraw the full raised balance once', async () => {
    seedCampaign(1000);
    const res = await withdraw(1000);
    expect(res.status).toBe(201);
    expect(mockWithdrawals).toHaveLength(1);
  });

  test('a second request cannot claim the same balance again', async () => {
    seedCampaign(1000);
    expect((await withdraw(1000)).status).toBe(201);
    const res = await withdraw(1000);
    expect(res.status).toBe(400);
    expect(mockWithdrawals).toHaveLength(1);
  });

  test('requests already pending shrink what is still available', async () => {
    seedCampaign(1000);
    expect((await withdraw(600)).status).toBe(201);
    // 1000 raised, 600 already waiting on an admin: 400 remains.
    const res = await withdraw(500);
    expect(res.status).toBe(400);
    expect(mockWithdrawals).toHaveLength(1);
  });

  test('a withdrawal below the remaining balance still succeeds', async () => {
    seedCampaign(1000);
    expect((await withdraw(600)).status).toBe(201);
    const res = await withdraw(400);
    expect(res.status).toBe(201);
    expect(mockWithdrawals).toHaveLength(2);
  });
});

describe('PATCH /api/withdrawals/:id/approve', () => {
  test('amount_raised never drops below zero when two withdrawals are approved', async () => {
    seedCampaign(1000);
    // Both were submitted against the whole balance, which the guard now
    // refuses — this pins the approval floor independently of that guard.
    const first = seedWithdrawal({ withdrawal_credit: 1000 });
    const second = seedWithdrawal({ withdrawal_credit: 1000 });

    const approve = (id) => request(app)
      .patch(`/api/withdrawals/${id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect((await approve(first._id)).status).toBe(200);
    expect((await approve(second._id)).status).toBe(200);

    const total = Object.values(mockCampaigns).reduce((s, c) => s + (c.amount_raised || 0), 0);
    expect(total).toBe(0);
    expect(total).toBeGreaterThanOrEqual(0);
  });
});
