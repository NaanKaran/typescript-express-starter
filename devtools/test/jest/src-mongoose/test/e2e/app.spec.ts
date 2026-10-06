import type { Application } from 'express';
import request from 'supertest';
import { closeTestDB, connectTestDB, createTestApp } from '@/test/setup';

describe('App E2E', () => {
  let server: Application;

  beforeAll(async () => {
    await connectTestDB();
    server = createTestApp();
  }, 120_000);

  afterAll(async () => {
    await closeTestDB();
  });

  it('should report healthy status with database connected', async () => {
    const res = await request(server).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(server).get('/api/v1/unknown');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(404);
  });
});
