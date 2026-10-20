/**
 * Admin report queue.
 *
 * Dismissing a report used to exist only in the client's state: the row
 * disappeared, and every reload brought it back. These tests pin the queue
 * itself — a dismissal is a request the server keeps, not a local filter.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const SECRET = 'test_secret';

const mockReports = {};
const newId = () => new mongoose.Types.ObjectId().toString();

jest.mock('../models/Report', () => {
  function ReportMock(data) {
    Object.assign(this, data);
    this._id = newId();
    this.date = new Date();
  }
  ReportMock.prototype.save = async function () {
    mockReports[this._id] = { ...this };
    return this;
  };
  ReportMock.find = () => {
    const results = Object.values(mockReports);
    return { sort: () => results };
  };
  ReportMock.findById = async (id) => mockReports[id] || null;
  ReportMock.findOneAndDelete = async (filter) => {
    const id = String(filter._id);
    const report = mockReports[id];
    if (!report) return null;
    delete mockReports[id];
    return report;
  };
  return ReportMock;
});

const app = require('../index');

const adminToken = jwt.sign({ email: 'adm@x.com', role: 'admin' }, SECRET);
const creatorToken = jwt.sign({ email: 'cr@x.com', role: 'creator' }, SECRET);

beforeEach(() => {
  Object.keys(mockReports).forEach((k) => delete mockReports[k]);
  mockReports['rep1'] = {
    _id: 'rep1',
    reporter_email: 'sup@x.com',
    reporter_name: 'Supporter',
    campaign_id: newId(),
    campaign_title: 'Scam',
    reason: 'Fake totals',
    date: new Date(),
  };
});

describe('DELETE /api/reports/:id', () => {
  test('an admin dismissal is kept by the server, so a reload cannot bring the report back', async () => {
    const del = await request(app)
      .delete('/api/reports/rep1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);

    const after = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(after.status).toBe(200);
    expect(after.body.some((r) => r._id === 'rep1')).toBe(false);
  });

  test('a creator cannot dismiss a report', async () => {
    const res = await request(app)
      .delete('/api/reports/rep1')
      .set('Authorization', `Bearer ${creatorToken}`);
    expect(res.status).toBe(403);
    expect(mockReports['rep1']).toBeDefined();
  });

  test('an anonymous request cannot dismiss a report', async () => {
    const res = await request(app).delete('/api/reports/rep1');
    expect(res.status).toBe(401);
    expect(mockReports['rep1']).toBeDefined();
  });

  test('an unknown report id answers 404', async () => {
    const res = await request(app)
      .delete(`/api/reports/${newId()}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  test('a second dismissal of the same report answers 404', async () => {
    await request(app)
      .delete('/api/reports/rep1')
      .set('Authorization', `Bearer ${adminToken}`);
    const again = await request(app)
      .delete('/api/reports/rep1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(again.status).toBe(404);
  });
});
