const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
const SECRET = 'test_secret';

// ── Mock store ───────────────────────────────────────────────────
const mockNotifications = [];

// ── Mock Notification ────────────────────────────────────────────
// The mock keeps the real schema in the loop: updateMany applies its $set
// through a real Mongoose document, so strict mode strips exactly the paths
// the production schema would strip. A hand-mocked object with a hardcoded
// `read` field would pass even while the real route is a no-op.
jest.mock('../models/Notification', () => {
  const RealNotification = jest.requireActual('../models/Notification');

  function NotificationMock(data) { Object.assign(this, data); }
  NotificationMock.prototype.save = async function () {
    mockNotifications.push({ ...this });
    return this;
  };
  NotificationMock.find = (filter = {}) => {
    let r = [...mockNotifications];
    if (filter.toEmail) r = r.filter(n => n.toEmail === filter.toEmail);
    return { sort: () => r, then: (res) => res(r) };
  };
  NotificationMock.updateMany = async (filter, update) => {
    const $set = update.$set || {};
    const targets = mockNotifications.filter(n => !filter.toEmail || n.toEmail === filter.toEmail);
    targets.forEach(n => {
      // Round-trip through the real schema so the write is stripped exactly as
      // strict mode would strip it in the database.
      const doc = new RealNotification(n);
      doc.set($set);
      Object.assign(n, doc.toObject());
    });
    return { modifiedCount: targets.length };
  };
  return NotificationMock;
});

// ── App ──────────────────────────────────────────────────────────
const app = require('../index');

const supporterToken = jwt.sign({ email: 'sup@x.com', role: 'supporter' }, SECRET);

async function seed(data) {
  const Notification = require('../models/Notification');
  const n = new Notification(data);
  await n.save();
  return n;
}

beforeEach(() => {
  mockNotifications.length = 0;
});

describe('POST /api/notifications/mark-all-read', () => {
  test('persists read=true for the current user only', async () => {
    await seed({ message: 'n1', toEmail: 'sup@x.com', actionRoute: '/a', time: new Date() });
    await seed({ message: 'n2', toEmail: 'sup@x.com', actionRoute: '/b', time: new Date() });
    await seed({ message: 'n3', toEmail: 'cr@x.com',  actionRoute: '/c', time: new Date() });

    const res = await request(app)
      .post('/api/notifications/mark-all-read')
      .set('Authorization', `Bearer ${supporterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Assert on persisted state, read back through the model — not on the
    // update call args.
    const Notification = require('../models/Notification');
    const mine = await Notification.find({ toEmail: 'sup@x.com' });
    expect(mine).toHaveLength(2);
    expect(mine.every(n => n.read === true)).toBe(true);

    const others = await Notification.find({ toEmail: 'cr@x.com' });
    expect(others).toHaveLength(1);
    expect(others.every(n => n.read !== true)).toBe(true);
  });

  test('the stored notifications expose a persistent read flag', async () => {
    await seed({ message: 'n1', toEmail: 'sup@x.com', actionRoute: '/a', time: new Date() });

    await request(app)
      .post('/api/notifications/mark-all-read')
      .set('Authorization', `Bearer ${supporterToken}`);

    const Notification = require('../models/Notification');
    const [stored] = await Notification.find({ toEmail: 'sup@x.com' });
    expect(stored.read).toBe(true);
  });
});
