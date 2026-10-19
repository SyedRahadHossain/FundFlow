const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');

const SECRET = 'test_secret';
process.env.JWT_SECRET = SECRET;

describe('verifyToken middleware', () => {
  test('rejects missing token', async () => {
    const res = await request(app).get('/api/protected');
    expect(res.status).toBe(401);
  });

  test('rejects empty Authorization header', async () => {
    const res = await request(app).get('/api/protected').set('Authorization', '');
    expect(res.status).toBe(401);
  });

  test('rejects invalid token', async () => {
    const res = await request(app).get('/api/protected').set('Authorization', 'Bearer badtoken');
    expect(res.status).toBe(401);
  });

  test('attaches user on valid token', async () => {
    const token = jwt.sign({ email: 'a@b.com', role: 'supporter' }, SECRET);
    const res = await request(app).get('/api/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('a@b.com');
    expect(res.body.user.role).toBe('supporter');
  });
});

describe('verifyRole middleware', () => {
  const verifyToken = require('../middleware/verifyToken');
  const verifyRole = require('../middleware/verifyRole');
  const express = require('express');

  let testApp;
  beforeAll(() => {
    testApp = express();
    testApp.use(express.json());
    testApp.get('/admin-only', verifyToken, verifyRole('admin'), (req, res) => res.json({ ok: true }));
  });

  test('rejects supporter hitting admin route', async () => {
    const token = jwt.sign({ email: 'sup@b.com', role: 'supporter' }, SECRET);
    const res = await request(testApp).get('/admin-only').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('allows admin through', async () => {
    const token = jwt.sign({ email: 'admin@b.com', role: 'admin' }, SECRET);
    const res = await request(testApp).get('/admin-only').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
