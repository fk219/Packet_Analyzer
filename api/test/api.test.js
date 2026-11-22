import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;
let app;
let db;
let models;
let seedRules;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  db = await import('../src/db.js');
  await db.connectDb(mongod.getUri('packetanalyzer_test'));
  const { createApp } = await import('../src/app.js');
  app = createApp();
  models = await import('../src/models.js');
  ({ seedRules } = await import('../src/rules.js'));
}, 120000);

beforeEach(async () => {
  await models.Analysis.deleteMany({});
  await models.Rule.deleteMany({});
  await seedRules();
}, 30000);

afterAll(async () => {
  await db.disconnectDb();
  await mongod.stop();
}, 30000);

describe('Packet analyzer API', () => {
  it('serves health with MongoDB readiness and the app catalogue', async () => {
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.ok).toBe(true);
    expect(health.body.database).toBe('connected');

    const apps = await request(app).get('/api/apps');
    expect(apps.status).toBe(200);
    expect(apps.body.apps).toContain('YouTube');
  });

  it('analyzes the demo capture and stores the full run', async () => {
    const analyzed = await request(app).post('/api/analyze/demo');
    expect(analyzed.status).toBe(201);
    expect(analyzed.body.run.packetCount).toBe(22);
    expect(analyzed.body.run.flows.length).toBeGreaterThan(0);
    expect(analyzed.body.run.blockedFlowCount).toBeGreaterThanOrEqual(3);

    const runs = await request(app).get('/api/runs');
    expect(runs.body.items).toHaveLength(1);
    expect(runs.body.items[0].flows).toBeUndefined();

    const detail = await request(app).get(`/api/runs/${analyzed.body.run.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.run.packetTrace.length).toBeGreaterThan(0);
  });

  it('updates rules and applies them to the next run', async () => {
    const updated = await request(app)
      .put('/api/rules')
      .set('x-demo-admin-token', 'demo-operator-key')
      .send({ blockedApps: [], blockedDomains: [] });
    expect(updated.status).toBe(200);

    const analyzed = await request(app).post('/api/analyze/demo');
    expect(analyzed.body.run.blockedFlowCount).toBe(0);
  });

  it('rejects a file that is not a PCAP', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .attach('file', Buffer.from('definitely not a pcap'), 'bad.pcap');
    expect(response.status).toBe(400);
  });

  it('gates rule changes and deletes behind the operator token', async () => {
    const deniedRules = await request(app)
      .put('/api/rules')
      .send({ blockedApps: [], blockedDomains: [] });
    expect(deniedRules.status).toBe(401);

    const invalidRules = await request(app)
      .put('/api/rules')
      .set('x-demo-admin-token', 'demo-operator-key')
      .send({ blockedApps: 'not-an-array' });
    expect(invalidRules.status).toBe(400);

    const analyzed = await request(app).post('/api/analyze/demo');
    const deniedDelete = await request(app).delete(`/api/runs/${analyzed.body.run.id}`);
    expect(deniedDelete.status).toBe(401);

    const removed = await request(app)
      .delete(`/api/runs/${analyzed.body.run.id}`)
      .set('x-demo-admin-token', 'demo-operator-key');
    expect(removed.status).toBe(200);
    const runs = await request(app).get('/api/runs');
    expect(runs.body.items).toHaveLength(0);
  });
});
