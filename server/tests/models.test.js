/**
 * Model schema validation tests — no live DB required.
 * We instantiate documents and call validateSync() to check schema rules.
 */

const mongoose = require('mongoose');

// Disconnect any lingering connection attempts
beforeAll(() => mongoose.disconnect());

describe('User model', () => {
  const User = require('../models/User');

  test('valid supporter has credits 50', () => {
    const u = new User({ email: 'a@b.com', name: 'Ann', role: 'supporter', credits: 50 });
    const err = u.validateSync();
    expect(err).toBeUndefined();
    expect(u.credits).toBe(50);
    expect(u.role).toBe('supporter');
  });

  test('valid creator has credits 20', () => {
    const u = new User({ email: 'c@b.com', name: 'Eve', role: 'creator', credits: 20 });
    expect(u.validateSync()).toBeUndefined();
    expect(u.role).toBe('creator');
  });

  test('rejects invalid role', () => {
    const u = new User({ email: 'd@b.com', name: 'Bad', role: 'hacker', credits: 0 });
    const err = u.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.role).toBeDefined();
  });

  test('requires email', () => {
    const u = new User({ name: 'No Email', role: 'supporter', credits: 50 });
    const err = u.validateSync();
    expect(err.errors.email).toBeDefined();
  });

  test('requires name', () => {
    const u = new User({ email: 'x@b.com', role: 'supporter', credits: 50 });
    const err = u.validateSync();
    expect(err.errors.name).toBeDefined();
  });
});

describe('Campaign model', () => {
  const Campaign = require('../models/Campaign');

  test('defaults to status=pending and amount_raised=0', () => {
    const c = new Campaign({
      title: 'Solar pump', story: 'We need water', category: 'Community',
      funding_goal: 1000, minimum_contribution: 10,
      deadline: new Date(Date.now() + 86400000),
      reward_info: 'T-shirt', campaign_image_url: 'https://img.com/x.jpg',
      creator_email: 'cr@b.com', creator_name: 'Cr',
    });
    expect(c.validateSync()).toBeUndefined();
    expect(c.status).toBe('pending');
    expect(c.amount_raised).toBe(0);
  });

  test('rejects invalid status', () => {
    const c = new Campaign({
      title: 'X', story: 'X', category: 'X',
      funding_goal: 10, minimum_contribution: 1,
      deadline: new Date(), reward_info: 'X',
      campaign_image_url: 'https://x.com/x.jpg',
      creator_email: 'x@x.com', creator_name: 'X',
      status: 'bad_status',
    });
    const err = c.validateSync();
    expect(err.errors.status).toBeDefined();
  });
});

describe('Contribution model', () => {
  const Contribution = require('../models/Contribution');

  test('defaults to status=pending', () => {
    const contrib = new Contribution({
      campaign_id: new mongoose.Types.ObjectId(),
      campaign_title: 'C',
      contribution_amount: 50,
      supporter_email: 'sup@b.com', supporter_name: 'Sup',
      creator_email: 'cr@b.com', creator_name: 'Cr',
    });
    expect(contrib.validateSync()).toBeUndefined();
    expect(contrib.status).toBe('pending');
    expect(contrib.contribution_amount).toBe(50);
  });
});

describe('Withdrawal model', () => {
  const Withdrawal = require('../models/Withdrawal');

  test('defaults to status=pending', () => {
    const w = new Withdrawal({
      creator_email: 'cr@b.com', creator_name: 'Cr',
      withdrawal_credit: 200, withdrawal_amount: 10,
      payment_system: 'stripe', account_number: 'acct_123',
    });
    expect(w.validateSync()).toBeUndefined();
    expect(w.status).toBe('pending');
    expect(w.withdrawal_amount).toBe(10);
  });

  test('requires creator_email', () => {
    const w = new Withdrawal({
      creator_name: 'Cr', withdrawal_credit: 200,
      withdrawal_amount: 10, payment_system: 'stripe', account_number: '123',
    });
    const err = w.validateSync();
    expect(err.errors.creator_email).toBeDefined();
  });
});

describe('Notification model', () => {
  const Notification = require('../models/Notification');

  test('saves valid notification shape', () => {
    const n = new Notification({
      message: 'Your contribution was approved',
      toEmail: 'sup@b.com',
      actionRoute: '/dashboard/supporter-home',
    });
    expect(n.validateSync()).toBeUndefined();
    expect(n.time).toBeDefined();
  });
});

describe('Payment model', () => {
  const Payment = require('../models/Payment');

  test('valid payment passes schema', () => {
    const p = new Payment({ supporter_email: 'sup@b.com', credits: 100, amount: 10 });
    expect(p.validateSync()).toBeUndefined();
  });
});

describe('Report model', () => {
  const Report = require('../models/Report');

  test('valid report passes schema', () => {
    const r = new Report({
      reporter_email: 'rep@b.com',
      campaign_id: new mongoose.Types.ObjectId(),
      campaign_title: 'Scam Campaign',
      reason: 'Looks fraudulent',
    });
    expect(r.validateSync()).toBeUndefined();
  });
});
