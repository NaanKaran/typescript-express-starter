import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { Application } from 'express';
import request from 'supertest';
import {
  closeTestDB,
  connectTestDB,
  createTestApp,
  getUniqueUser,
  resetUserDB,
} from '@/test/setup';

describe('Users API', () => {
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

  it('should create a new user', async () => {
    const user = getUniqueUser();
    const res = await request(server).post(`${prefix}/users`).send(user);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.email).toBe(user.email);
    expect(res.body.data.isActive).toBe(true);
    expect(res.body.data.password).toBeUndefined();
  });

  it('should retrieve all users', async () => {
    const user = getUniqueUser();
    await request(server).post(`${prefix}/users`).send(user);
    const res = await request(server).get(`${prefix}/users`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].email).toBe(user.email);
  });

  it('should paginate and search users', async () => {
    for (let i = 0; i < 3; i += 1) {
      await request(server).post(`${prefix}/users`).send(getUniqueUser());
    }
    await request(server)
      .post(`${prefix}/users`)
      .send({ ...getUniqueUser(), firstName: 'Findme' });

    const page = await request(server).get(`${prefix}/users?page=1&limit=2`);
    expect(page.statusCode).toBe(200);
    expect(page.body.data).toHaveLength(2);
    expect(page.body.total).toBe(4);
    expect(page.body.totalPages).toBe(2);

    const search = await request(server).get(`${prefix}/users?search=findme`);
    expect(search.statusCode).toBe(200);
    expect(search.body.total).toBe(1);
    expect(search.body.data[0].firstName).toBe('Findme');
  });

  it('should retrieve a user by id', async () => {
    const user = getUniqueUser();
    const createRes = await request(server).post(`${prefix}/users`).send(user);
    const id = createRes.body.data.id;

    const res = await request(server).get(`${prefix}/users/${id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe(user.email);
  });

  it('should update user information', async () => {
    const user = getUniqueUser();
    const createRes = await request(server).post(`${prefix}/users`).send(user);
    const id = createRes.body.data.id;

    const res = await request(server)
      .put(`${prefix}/users/${id}`)
      .send({ password: 'newpassword123', firstName: 'Updated' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.firstName).toBe('Updated');

    // 변경된 비밀번호로 로그인 가능해야 함
    const loginRes = await request(server)
      .post(`${prefix}/auth/login`)
      .send({ email: user.email, password: 'newpassword123' });
    expect(loginRes.statusCode).toBe(200);
  });

  it('should reject updating to an email that already exists', async () => {
    const first = getUniqueUser();
    const second = getUniqueUser();
    await request(server).post(`${prefix}/users`).send(first);
    const createRes = await request(server).post(`${prefix}/users`).send(second);

    const res = await request(server)
      .put(`${prefix}/users/${createRes.body.data.id}`)
      .send({ email: first.email });

    expect(res.statusCode).toBe(409);
  });

  it('should delete a user', async () => {
    const user = getUniqueUser();
    const createRes = await request(server).post(`${prefix}/users`).send(user);
    const id = createRes.body.data.id;

    const res = await request(server).delete(`${prefix}/users/${id}`);
    expect(res.statusCode).toBe(204);

    const getRes = await request(server).get(`${prefix}/users/${id}`);
    expect(getRes.statusCode).toBe(404);
  });

  it('should return 404 if user does not exist', async () => {
    const nonExistentId = '000000000000000000000000'; // Valid ObjectId format but non-existent
    const res = await request(server).get(`${prefix}/users/${nonExistentId}`);

    expect(res.statusCode).toBe(404);
  });

  it('should return 404 for a malformed id', async () => {
    const res = await request(server).get(`${prefix}/users/not-an-object-id`);

    expect(res.statusCode).toBe(404);
  });
});
