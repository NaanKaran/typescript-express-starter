import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { Application } from 'express';
import request from 'supertest';
import {
  closeTestDB,
  connectTestDB,
  createTestApp,
  extractAuthToken,
  getUniqueUser,
  resetUserDB,
} from '@/test/setup';

describe('Auth API', () => {
  let server: Application;
  const prefix = '/api/v1';

  beforeAll(async () => {
    await connectTestDB();
    server = createTestApp();
  }, 120_000);

  beforeEach(async () => {
    await resetUserDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('should successfully register a new user', async () => {
    const user = getUniqueUser();
    const res = await request(server).post(`${prefix}/auth/signup`).send(user);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.email).toBe(user.email);
    expect(res.body.data.id).toMatch(/^[a-f\d]{24}$/);
    expect(res.body.data.password).toBeUndefined();
  });

  it('should reject duplicate signup with 409', async () => {
    const user = getUniqueUser();
    await request(server).post(`${prefix}/auth/signup`).send(user);
    const res = await request(server).post(`${prefix}/auth/signup`).send(user);

    expect(res.statusCode).toBe(409);
  });

  it('should reject invalid signup payload with 400', async () => {
    const res = await request(server)
      .post(`${prefix}/auth/signup`)
      .send({ email: 'not-an-email', password: 'short' });

    expect(res.statusCode).toBe(400);
  });

  it('should login a user and set a cookie', async () => {
    const user = getUniqueUser();
    await request(server).post(`${prefix}/auth/signup`).send(user);
    const res = await request(server).post(`${prefix}/auth/login`).send(user);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe(user.email);
    expect(res.body.data.password).toBeUndefined();
    expect(extractAuthToken(res.headers['set-cookie'])).not.toBe('');
  });

  it('should reject login with wrong password', async () => {
    const user = getUniqueUser();
    await request(server).post(`${prefix}/auth/signup`).send(user);
    const res = await request(server)
      .post(`${prefix}/auth/login`)
      .send({ ...user, password: 'wrongpassword1' });

    expect(res.statusCode).toBe(401);
  });

  it('should logout a user', async () => {
    const user = getUniqueUser();
    await request(server).post(`${prefix}/auth/signup`).send(user);
    const loginRes = await request(server).post(`${prefix}/auth/login`).send(user);
    const authToken = extractAuthToken(loginRes.headers['set-cookie']);

    const logoutRes = await request(server)
      .post(`${prefix}/auth/logout`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.body.message).toBe('logout');
  });

  it('should reject logout without a token', async () => {
    const res = await request(server).post(`${prefix}/auth/logout`);

    expect(res.statusCode).toBe(401);
  });
});
