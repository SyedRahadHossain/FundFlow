const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const newId = () => new mongoose.Types.ObjectId().toString();

// ── Mock stores ──────────────────────────────────────────────────
const mockCampaigns = {};
const mockContributions = {};
const mockUsers = {};

// ── Mock Campaign ────────────────────────────────────────────────
jest.mock('../models/Campaign', () => ({
  deleteOne: async (filter) => {
    const id = filter._id?.toString();
    const existed = Boolean(mockCampaigns[id]);
    delete mockCampaigns[id];
    return { deletedCount: existed ? 1 : 0 };
  },
}));

// ── Mock Contribution ────────────────────────────────────────────
jest.mock('../models/Contribution', () => ({
  // Mirrors the real Mongoose filter: a status value may be a plain string or a
  // `$in` list, and both must behave the same way.
  find: async (filter = {}) =>
    Object.values(mockContributions).filter(c =>
      (!filter.campaign_id || c.campaign_id === filter.campaign_id.toString()) &&
      (!filter.status ||
        (typeof filter.status === 'string'
          ? c.status === filter.status
          : filter.status.$in.includes(c.status)))
    ),
  // Honours the guard: the claim only lands while the stored status still sits
  // inside the filter, so an already-refunded row is never claimed twice.
  findOneAndUpdate: async (filter, update) => {
    const row = mockContributions[filter._id?.toString()];
    if (!row) return null;
    if (
      filter.status &&
      (typeof filter.status === 'string'
        ? row.status !== filter.status
        : !filter.status.$in.includes(row.status))
    ) {
      return null;
    }
    Object.assign(row, update.$set || {});
    return row;
  },
}));

// ── Mock User ────────────────────────────────────────────────────
jest.mock('../models/User', () => ({
  findOneAndUpdate: async (filter, update) => {
    const user = mockUsers[filter.email];
    if (!user) return null;
    if (update.$inc?.credits !== undefined) user.credits += update.$inc.credits;
    return user;
  },
}));

const { deleteCampaignWithRefunds } = require('../lib/campaignLifecycle');

// ── Helpers ──────────────────────────────────────────────────────
function seedCampaign() {
  const id = newId();
  mockCampaigns[id] = { _id: id, title: 'Test Campaign', status: 'approved', amount_raised: 0 };
  return id;
}

function seedContribution(campaignId, overrides = {}) {
  const id = newId();
  mockContributions[id] = {
    _id: id, campaign_id: campaignId, contribution_amount: 30,
    supporter_email: 'sup@x.com', creator_email: 'cr@x.com', status: 'pending',
    ...overrides,
  };
  return id;
}

beforeEach(() => {
  Object.keys(mockCampaigns).forEach(k => delete mockCampaigns[k]);
  Object.keys(mockContributions).forEach(k => delete mockContributions[k]);
  Object.keys(mockUsers).forEach(k => delete mockUsers[k]);
  // The debit already happened on submit, so a refund starts from the reduced
  // balance and must restore exactly the contribution amount.
  mockUsers['sup@x.com'] = { email: 'sup@x.com', name: 'Supporter', role: 'supporter', credits: 70 };
});

// ── Tests ────────────────────────────────────────────────────────
describe('deleteCampaignWithRefunds', () => {
  test('refunds a contribution still pending when the campaign is deleted', async () => {
    const campId = seedCampaign();
    const cid = seedContribution(campId, { status: 'pending', contribution_amount: 30 });

    const result = await deleteCampaignWithRefunds(campId);

    expect(mockUsers['sup@x.com'].credits).toBe(100); // 70 + 30 refund
    expect(mockContributions[cid].status).toBe('refunded');
    expect(result.refunded).toBe(30);
  });

  test('still refunds an approved contribution', async () => {
    const campId = seedCampaign();
    const cid = seedContribution(campId, { status: 'approved', contribution_amount: 30 });

    const result = await deleteCampaignWithRefunds(campId);

    expect(mockUsers['sup@x.com'].credits).toBe(100);
    expect(mockContributions[cid].status).toBe('refunded');
    expect(result.refunded).toBe(30);
  });

  test('refunds pending and approved together and skips rejected', async () => {
    const campId = seedCampaign();
    seedContribution(campId, { status: 'pending', contribution_amount: 20 });
    seedContribution(campId, { status: 'approved', contribution_amount: 30 });
    seedContribution(campId, { status: 'rejected', contribution_amount: 40 });

    const result = await deleteCampaignWithRefunds(campId);

    expect(mockUsers['sup@x.com'].credits).toBe(120); // 70 + 20 + 30
    expect(result.refunded).toBe(50);
  });

  test('an already-refunded contribution is not paid twice', async () => {
    const campId = seedCampaign();
    seedContribution(campId, { status: 'refunded', contribution_amount: 30 });

    const result = await deleteCampaignWithRefunds(campId);

    expect(mockUsers['sup@x.com'].credits).toBe(70); // unchanged
    expect(result.refunded).toBe(0);
  });
});
