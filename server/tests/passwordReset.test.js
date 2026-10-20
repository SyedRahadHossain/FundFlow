/**
 * Password recovery tests.
 *
 * The models are mocked the way the other suites mock them: an in-memory
 * store stands in for MongoDB, so no live database is needed. The reset
 * token never leaves the server in production, so the tests read the raw
 * token out of the console line the route prints outside production.
 */
const request = require('supertest');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

// ── Mock User model ──────────────────────────────────────────────
const mockUsers = {};

jest.mock('../models/User', () => {
  function UserMock(data) {
    Object.assign(this, data);
    if (!this._id) this._id = 'u_' + Math.random().toString(36).slice(2);
  }
  UserMock.prototype.save = async function () {
    mockUsers[this.email] = { ...this };
    return this;
  };
  UserMock.findOne = async (filter = {}) => {
    let found = null;
    if (filter.email) {
      found = mockUsers[filter.email] || null;
    } else if (filter._id) {
      const id = String(filter._id);
      found = Object.values(mockUsers).find((u) => String(u._id) === id) || null;
    }
    if (!found) return null;
    // A document, not a bare object: the reset route writes to it and saves it.
    return new UserMock({ ...found });
  };
  return UserMock;
});

// ── Mock PasswordResetToken model ────────────────────────────────
const mockTokens = {};

jest.mock('../models/PasswordResetToken', () => {
  function TokenMock(data) {
    Object.assign(this, data);
    if (!this._id) this._id = 't_' + Math.random().toString(36).slice(2);
  }
  TokenMock.prototype.save = async function () {
    mockTokens[this.token_hash] = { ...this };
    return this;
  };
  TokenMock.findOne = async (filter = {}) => {
    const found = Object.values(mockTokens).find((t) => t.token_hash === filter.token_hash);
    // A document, so the route can spend it.
    return found ? new TokenMock({ ...found }) : null;
  };
  TokenMock.updateMany = async (filter = {}, update = {}) => {
    let modified = 0;
    Object.values(mockTokens).forEach((t) => {
      const sameUser = String(t.user_id) === String(filter.user_id);
      const matchesUsed = filter.used === undefined ? true : t.used === filter.used;
      if (sameUser && matchesUsed) {
        Object.assign(t, update.$set || {});
        modified += 1;
      }
    });
    return { modifiedCount: modified };
  };
  return TokenMock;
});

// ── Load app AFTER mocks ─────────────────────────────────────────
const app = require('../index');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const GENERIC_MESSAGE =
  'If an account exists for that address, a password reset link is on its way.';

// The raw token is only ever printed to the console, so the tests read it
// back from there — exactly the way a developer reads it outside production.
const readRawToken = (logSpy) => {
  const lines = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');
  const match = lines.match(/reset-password\?token=([a-f0-9]+)/);
  return match ? match[1] : null;
};

let logSpy;
let warnSpy;

beforeEach(async () => {
  Object.keys(mockUsers).forEach((k) => delete mockUsers[k]);
  Object.keys(mockTokens).forEach((k) => delete mockTokens[k]);
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const hashed = await bcrypt.hash('OldPass123!', 10);
  mockUsers['ana@x.com'] = {
    _id: 'u_ana', email: 'ana@x.com', name: 'Ana', role: 'supporter',
    credits: 50, password: hashed,
  };
});

afterEach(() => {
  logSpy.mockRestore();
  warnSpy.mockRestore();
  process.env.NODE_ENV = 'test';
});

describe('POST /api/auth/forgot-password', () => {
  test('answers the same way for an address with no account', async () => {
    const res = await request(app).post('/api/auth/forgot-password')
      .send({ email: 'nobody@x.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(GENERIC_MESSAGE);
    expect(Object.keys(mockTokens)).toHaveLength(0);
  });

  test('never reveals whether an account exists', async () => {
    const known = await request(app).post('/api/auth/forgot-password')
      .send({ email: 'ana@x.com' });
    const unknown = await request(app).post('/api/auth/forgot-password')
      .send({ email: 'nobody@x.com' });

    expect(known.status).toBe(unknown.status);
    expect(known.body).toEqual(unknown.body);
    // No token, no address, no hint in the body.
    expect(JSON.stringify(known.body)).not.toContain('token');
    expect(JSON.stringify(known.body)).not.toContain('ana@x.com');
  });

  test('stores a hashed, single-use token that expires in an hour', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: 'ana@x.com' });

    const records = Object.values(mockTokens);
    expect(records).toHaveLength(1);

    const record = records[0];
    expect(record.user_id).toBe('u_ana');
    expect(record.used).toBe(false);
    expect(record.token_hash).toMatch(/^[a-f0-9]{64}$/);

    const rawToken = readRawToken(logSpy);
    expect(rawToken).toMatch(/^[a-f0-9]{64}$/);
    // The raw token is never stored — only its hash.
    expect(record.token_hash).not.toBe(rawToken);
    expect(record.token_hash).toBe(sha256(rawToken));

    const ttl = new Date(record.expires_at).getTime() - Date.now();
    expect(ttl).toBeGreaterThan(55 * 60 * 1000);
    expect(ttl).toBeLessThanOrEqual(60 * 60 * 1000);
  });

  test('rejects a malformed address', async () => {
    const res = await request(app).post('/api/auth/forgot-password')
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  test('prints the reset link outside production', async () => {
    process.env.NODE_ENV = 'development';
    await request(app).post('/api/auth/forgot-password').send({ email: 'ana@x.com' });

    const printed = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(printed).toContain('/reset-password?token=');
  });

  test('never prints the link in production', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(app).post('/api/auth/forgot-password')
      .send({ email: 'ana@x.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(GENERIC_MESSAGE);
    const printed = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(printed).not.toContain('reset-password?token=');
    // It says the link was not delivered, without naming the account.
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls.join(' ')).not.toContain('ana@x.com');
  });
});

describe('POST /api/auth/reset-password', () => {
  const requestReset = async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: 'ana@x.com' });
    return readRawToken(logSpy);
  };

  test('changes the password so the new one signs in and the old one does not', async () => {
    const rawToken = await requestReset();

    const res = await request(app).post('/api/auth/reset-password')
      .send({ token: rawToken, password: 'BrandNew456!' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/password updated/i);

    const withNew = await request(app).post('/api/auth/login')
      .send({ email: 'ana@x.com', password: 'BrandNew456!' });
    expect(withNew.status).toBe(200);
    expect(withNew.body.token).toBeDefined();

    const withOld = await request(app).post('/api/auth/login')
      .send({ email: 'ana@x.com', password: 'OldPass123!' });
    expect(withOld.status).toBe(401);
  });

  test('a token can only be used once', async () => {
    const rawToken = await requestReset();

    const first = await request(app).post('/api/auth/reset-password')
      .send({ token: rawToken, password: 'BrandNew456!' });
    expect(first.status).toBe(200);

    const second = await request(app).post('/api/auth/reset-password')
      .send({ token: rawToken, password: 'Another456!' });
    expect(second.status).toBe(400);
    expect(second.body.error).toMatch(/invalid or has expired/i);
  });

  test('a fresh request invalidates the link it supersedes', async () => {
    const first = await requestReset();
    logSpy.mockClear();
    const second = await requestReset();

    const stale = await request(app).post('/api/auth/reset-password')
      .send({ token: first, password: 'BrandNew456!' });
    expect(stale.status).toBe(400);

    const fresh = await request(app).post('/api/auth/reset-password')
      .send({ token: second, password: 'BrandNew456!' });
    expect(fresh.status).toBe(200);
  });

  test('rejects an expired token', async () => {
    const rawToken = 'a'.repeat(64);
    mockTokens[sha256(rawToken)] = {
      _id: 't_expired',
      user_id: 'u_ana',
      token_hash: sha256(rawToken),
      expires_at: new Date(Date.now() - 60 * 1000),
      used: false,
    };

    const res = await request(app).post('/api/auth/reset-password')
      .send({ token: rawToken, password: 'BrandNew456!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or has expired/i);

    // The password was left alone.
    const stillOld = await request(app).post('/api/auth/login')
      .send({ email: 'ana@x.com', password: 'OldPass123!' });
    expect(stillOld.status).toBe(200);
  });

  test('rejects an unknown token', async () => {
    const res = await request(app).post('/api/auth/reset-password')
      .send({ token: 'b'.repeat(64), password: 'BrandNew456!' });
    expect(res.status).toBe(400);
  });

  test('enforces the register route password rules', async () => {
    const rawToken = await requestReset();

    const tooShort = await request(app).post('/api/auth/reset-password')
      .send({ token: rawToken, password: 'short' });
    expect(tooShort.status).toBe(400);

    const stillOld = await request(app).post('/api/auth/login')
      .send({ email: 'ana@x.com', password: 'OldPass123!' });
    expect(stillOld.status).toBe(200);
  });

  test('rejects a request with no token', async () => {
    const res = await request(app).post('/api/auth/reset-password')
      .send({ password: 'BrandNew456!' });
    expect(res.status).toBe(400);
  });
});
