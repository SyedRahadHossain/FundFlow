/**
 * Auth endpoint tests.
 * Mock mongoose models so no live DB needed.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

// ── Mock User model ──────────────────────────────────────────────
const mockUsers = {};

jest.mock('../models/User', () => {
  function UserMock(data) {
    Object.assign(this, data);
    this._id = 'mock_id_' + Math.random();
  }
  UserMock.prototype.save = async function () {
    if (mockUsers[this.email]) throw Object.assign(new Error('dup'), { code: 11000 });
    mockUsers[this.email] = { ...this };
    return this;
  };
  UserMock.findOne = async ({ email }) => mockUsers[email] || null;
  UserMock.findOneAndUpdate = async ({ email }, update, opts) => {
    if (!mockUsers[email]) {
      if (!opts?.upsert) return null;
      const newUser = { ...update.$setOnInsert, email, _id: 'mock_' + email };
      mockUsers[email] = newUser;
      return newUser;
    }
    return mockUsers[email];
  };
  return UserMock;
});

// ── Mock firebase-admin verification ─────────────────────────────
const mockVerifyIdToken = jest.fn();
jest.mock('../lib/firebaseAdmin', () => ({
  getFirebaseAdmin: () => ({
    auth: () => ({ verifyIdToken: mockVerifyIdToken }),
  }),
}));

// ── Load app AFTER mocks ─────────────────────────────────────────
const app = require('../index');

// Mount auth routes
const authRouter = require('../routes/auth');
app.use('/api/auth', authRouter);

beforeEach(() => { Object.keys(mockUsers).forEach(k => delete mockUsers[k]); });

describe('POST /api/auth/register', () => {
  test('creates supporter with 50 credits', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@x.com', password: 'Pass123!', role: 'supporter' });
    expect(res.status).toBe(201);
    expect(res.body.user.credits).toBe(50);
    expect(res.body.user.role).toBe('supporter');
    expect(res.body.token).toBeDefined();
  });

  test('refuses to register an admin', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Root', email: 'root@x.com', password: 'Pass123!', role: 'admin' });
    expect(res.status).toBe(400);
    expect(mockUsers['root@x.com']).toBeUndefined();
  });

  test('creates creator with 20 credits', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Eve', email: 'eve@x.com', password: 'Pass123!', role: 'creator' });
    expect(res.status).toBe(201);
    expect(res.body.user.credits).toBe(20);
    expect(res.body.user.role).toBe('creator');
  });

  test('rejects duplicate email with 409', async () => {
    await request(app).post('/api/auth/register')
      .send({ name: 'First', email: 'dup@x.com', password: 'Pass123!', role: 'supporter' });
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Second', email: 'dup@x.com', password: 'Pass123!', role: 'supporter' });
    expect(res.status).toBe(409);
  });

  test('does not return password in response', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Safe', email: 'safe@x.com', password: 'Pass123!', role: 'supporter' });
    expect(res.body.user.password).toBeUndefined();
  });

  test('token decodes to correct email and role', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Dec', email: 'dec@x.com', password: 'Pass123!', role: 'creator' });
    const decoded = jwt.verify(res.body.token, 'test_secret');
    expect(decoded.email).toBe('dec@x.com');
    expect(decoded.role).toBe('creator');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Pre-seed a user with hashed password
    const hashed = await bcrypt.hash('Pass123!', 10);
    mockUsers['login@x.com'] = {
      _id: 'mock_login', email: 'login@x.com',
      name: 'Login User', role: 'supporter', credits: 50, password: hashed,
    };
  });

  test('returns token on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'login@x.com', password: 'Pass123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('returns 401 on wrong password', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'login@x.com', password: 'WrongPass!' });
    expect(res.status).toBe(401);
  });

  test('returns 401 on unknown email', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'ghost@x.com', password: 'Pass123!' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/google', () => {
  beforeEach(() => mockVerifyIdToken.mockReset());

  const verifiedClaims = (overrides = {}) => ({
    email: 'g@gmail.com',
    name: 'Google User',
    picture: 'https://photo.url',
    email_verified: true,
    firebase: { sign_in_provider: 'google.com' },
    ...overrides,
  });

  test('creates new user on first google login (supporter default)', async () => {
    mockVerifyIdToken.mockResolvedValue(verifiedClaims());
    const res = await request(app).post('/api/auth/google')
      .send({ idToken: 'a-valid-firebase-id-token' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('supporter');
  });

  test('returns token for existing google user', async () => {
    mockUsers['g2@gmail.com'] = {
      _id: 'g2', email: 'g2@gmail.com', name: 'G2', role: 'supporter', credits: 50, password: '',
    };
    mockVerifyIdToken.mockResolvedValue(verifiedClaims({ email: 'g2@gmail.com' }));
    const res = await request(app).post('/api/auth/google')
      .send({ idToken: 'a-valid-firebase-id-token' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects a forged body with no id token', async () => {
    const res = await request(app).post('/api/auth/google')
      .send({ email: 'admin@fundflow.com', name: 'Attacker' });
    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  test('rejects an unverifiable id token', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('invalid'));
    const res = await request(app).post('/api/auth/google')
      .send({ idToken: 'a-forged-firebase-id-token' });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test('rejects a non-google sign-in provider', async () => {
    mockVerifyIdToken.mockResolvedValue(
      verifiedClaims({ firebase: { sign_in_provider: 'password' } })
    );
    const res = await request(app).post('/api/auth/google')
      .send({ idToken: 'a-valid-firebase-id-token' });
    expect(res.status).toBe(401);
  });

  test('rejects an unverified email', async () => {
    mockVerifyIdToken.mockResolvedValue(verifiedClaims({ email_verified: false }));
    const res = await request(app).post('/api/auth/google')
      .send({ idToken: 'a-valid-firebase-id-token' });
    expect(res.status).toBe(401);
  });
});
