/**
 * Regression tests for the credit-integrity P0s.
 *
 * Covers: admin deletion of a reported campaign refunding supporters, and the
 * Stripe webhook as the only path that may grant credits.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
const SECRET = 'test_secret';

const mockUsers = {};
const mockPayments = {};
const mockCampaigns = {};
const mockContributions = {};

jest.mock('../models/User', () => ({
  findOne: async ({ email }) => mockUsers[email] || null,
  findOneAndUpdate: async ({ email }, update) => {
    if (mockUsers[email] && update.$inc?.credits) {
      mockUsers[email].credits += update.$inc.credits;
    }
    return mockUsers[email] || null;
  },
}));

jest.mock('../models/Payment', () => {
  function PaymentMock(data) {
    Object.assign(this, data);
  }
  PaymentMock.prototype.save = async function () {
    if (this.stripe_session_id && mockPayments[this.stripe_session_id]) {
      throw Object.assign(new Error('dup'), { code: 11000 });
    }
    if (this.stripe_session_id) mockPayments[this.stripe_session_id] = { ...this };
    return this;
  };
  PaymentMock.deleteOne = async (filter) => {
    delete mockPayments[filter.stripe_session_id];
    return { deletedCount: 1 };
  };
  return PaymentMock;
});

jest.mock('../models/Campaign', () => ({
  findById: async (id) => mockCampaigns[id] || null,
  deleteOne: async (filter) => {
    delete mockCampaigns[filter._id];
    return { deletedCount: 1 };
  },
}));

jest.mock('../models/Contribution', () => ({
  find: async (filter = {}) =>
    Object.values(mockContributions).filter(
      (c) =>
        (!filter.campaign_id || c.campaign_id === filter.campaign_id) &&
        (!filter.status || c.status === filter.status)
    ),
  findOneAndUpdate: async (filter, update) => {
    const c = Object.values(mockContributions).find(
      (x) => x._id === filter._id && (!filter.status || x.status === filter.status)
    );
    if (!c) return null;
    Object.assign(c, update.$set || {});
    return c;
  },
}));

// Stripe is mocked at the SDK boundary: only signature verification and the
// event payload matter to the route.
const mockConstructEvent = jest.fn();
jest.mock('stripe', () => () => ({
  webhooks: { constructEvent: mockConstructEvent },
}));

const app = require('../index');
app.use('/api/reports', require('../routes/reports'));

const adminToken = jwt.sign({ email: 'adm@x.com', role: 'admin' }, SECRET);
const supporterToken = jwt.sign({ email: 'sup@x.com', role: 'supporter' }, SECRET);

beforeEach(() => {
  [mockUsers, mockPayments, mockCampaigns, mockContributions].forEach((store) =>
    Object.keys(store).forEach((k) => delete store[k])
  );
  mockConstructEvent.mockReset();
  mockUsers['sup@x.com'] = { email: 'sup@x.com', name: 'Supporter', role: 'supporter', credits: 100 };
});

// ── Admin campaign deletion ──────────────────────────────────────
describe('DELETE /api/reports/:campaign_id/campaign', () => {
  test('refunds approved supporters before destroying the campaign', async () => {
    mockCampaigns['camp1'] = { _id: 'camp1', title: 'Scam', status: 'approved' };
    mockContributions['con1'] = {
      _id: 'con1', campaign_id: 'camp1', supporter_email: 'sup@x.com',
      contribution_amount: 30, status: 'approved',
    };

    const res = await request(app)
      .delete('/api/reports/camp1/campaign')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.refunded).toBe(30);
    expect(mockUsers['sup@x.com'].credits).toBe(130);
    expect(mockContributions['con1'].status).toBe('refunded');
    expect(mockCampaigns['camp1']).toBeUndefined();
  });

  test('returns 404 for an unknown campaign and refunds nothing', async () => {
    const res = await request(app)
      .delete('/api/reports/missing/campaign')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(mockUsers['sup@x.com'].credits).toBe(100);
  });

  test('supporter cannot delete a campaign', async () => {
    mockCampaigns['camp1'] = { _id: 'camp1', title: 'Scam', status: 'approved' };
    const res = await request(app)
      .delete('/api/reports/camp1/campaign')
      .set('Authorization', `Bearer ${supporterToken}`);
    expect(res.status).toBe(403);
    expect(mockCampaigns['camp1']).toBeDefined();
  });
});

// ── Stripe webhook ───────────────────────────────────────────────
describe('POST /api/stripe/webhook', () => {
  const savedKey = process.env.STRIPE_SECRET_KEY;
  const savedWebhook = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_webhook';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  afterAll(() => {
    if (savedKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = savedKey;
    if (savedWebhook === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = savedWebhook;
  });

  const paidSession = (overrides = {}) => ({
    id: 'cs_test_1',
    amount_total: 2500,
    payment_status: 'paid',
    metadata: { supporter_email: 'sup@x.com', credits: '300', amount: '25' },
    ...overrides,
  });

  test('grants credits for a verified checkout.session.completed event', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: paidSession() },
    });

    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', 'sig')
      .send('{}');

    expect(res.status).toBe(200);
    expect(mockUsers['sup@x.com'].credits).toBe(400);
    expect(mockPayments['cs_test_1']).toBeDefined();
  });

  test('is idempotent — a replayed event does not grant credits twice', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: paidSession() },
    });

    await request(app).post('/api/stripe/webhook').set('stripe-signature', 'sig').send('{}');
    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', 'sig')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body.duplicate).toBe(true);
    expect(mockUsers['sup@x.com'].credits).toBe(400);
  });

  test('rejects a request with an invalid signature', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('bad signature');
    });

    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', 'forged')
      .send('{}');

    expect(res.status).toBe(400);
    expect(mockUsers['sup@x.com'].credits).toBe(100);
  });

  test('ignores an event whose amount does not match the metadata', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: paidSession({ amount_total: 1 }) },
    });

    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', 'sig')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body.ignored).toBe('amount mismatch');
    expect(mockUsers['sup@x.com'].credits).toBe(100);
  });

  test('ignores unrelated event types', async () => {
    mockConstructEvent.mockReturnValue({ type: 'invoice.created', data: { object: {} } });

    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', 'sig')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body.ignored).toBe('invoice.created');
    expect(mockUsers['sup@x.com'].credits).toBe(100);
  });

  test('returns 503 when the webhook secret is not configured', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', 'sig')
      .send('{}');
    expect(res.status).toBe(503);
  });
});
