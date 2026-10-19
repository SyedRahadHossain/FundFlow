const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV   = 'test';
const SECRET = 'test_secret';

// A real .env may inject a live Stripe test key, so the "not configured" case
// below removes it explicitly instead of depending on the environment.
const app = require('../index');
app.use('/api/stripe', require('../routes/stripe'));

const supporterToken = jwt.sign({ email: 'sup@x.com', role: 'supporter' }, SECRET);
const creatorToken   = jwt.sign({ email: 'cr@x.com',  role: 'creator'   }, SECRET);

describe('POST /api/stripe/create-checkout-session', () => {
  test('rejects unauthenticated request', async () => {
    const res = await request(app).post('/api/stripe/create-checkout-session')
      .send({ credits: 100 });
    expect(res.status).toBe(401);
  });

  test('rejects creator (supporter only)', async () => {
    const res = await request(app).post('/api/stripe/create-checkout-session')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ credits: 100 });
    expect(res.status).toBe(403);
  });

  test('returns 400 if credits missing', async () => {
    const res = await request(app).post('/api/stripe/create-checkout-session')
      .set('Authorization', `Bearer ${supporterToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 for a package the server does not sell', async () => {
    const res = await request(app).post('/api/stripe/create-checkout-session')
      .set('Authorization', `Bearer ${supporterToken}`)
      .send({ credits: 1000000, amount: 0.01 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unknown credit package/i);
  });

  test('returns 503 when Stripe key not configured', async () => {
    const saved = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    try {
      const res = await request(app).post('/api/stripe/create-checkout-session')
        .set('Authorization', `Bearer ${supporterToken}`)
        .send({ credits: 100 });
      expect(res.status).toBe(503);
      expect(res.body.error).toMatch(/not configured/i);
    } finally {
      if (saved !== undefined) process.env.STRIPE_SECRET_KEY = saved;
    }
  });
});
