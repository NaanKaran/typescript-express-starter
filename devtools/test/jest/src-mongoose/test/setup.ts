import 'reflect-metadata';
import type { Application } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { container } from 'tsyringe';
import App from '@/app';
import { setupContainer } from '@config/container';
import { connectDB, disconnectDB } from '@config/database';
import { UserModel } from '@models/user.model';
import { AuthRoute } from '@routes/auth.route';
import { UsersRoute } from '@routes/users.route';

let mongod: MongoMemoryServer | undefined;

/**
 * 테스트용 MongoDB 연결
 * - 기본: mongodb-memory-server (in-memory, 외부 DB 불필요)
 * - MONGODB_TEST_URL 지정 시: 해당 MongoDB 사용 (예: CI 서비스 컨테이너)
 */
export async function connectTestDB(): Promise<void> {
  const externalUrl = process.env.MONGODB_TEST_URL;
  if (externalUrl) {
    await connectDB(externalUrl);
  } else {
    mongod ??= await MongoMemoryServer.create();
    await connectDB(mongod.getUri());
  }
  // unique 인덱스(email)가 생성된 상태에서 테스트하도록 보장
  await UserModel.syncIndexes();
}

export async function closeTestDB(): Promise<void> {
  await disconnectDB();
  if (mongod) {
    await mongod.stop();
    mongod = undefined;
  }
}

export function createTestApp(): Application {
  setupContainer();
  const routes = [container.resolve(UsersRoute), container.resolve(AuthRoute)];
  return new App(routes).getServer();
}

export async function resetUserDB(): Promise<void> {
  await UserModel.deleteMany({});
}

export function getUniqueUser() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return {
    email: `test-${timestamp}-${random}@example.com`,
    password: 'password123',
  };
}

/** Set-Cookie 헤더에서 Authorization 토큰 추출 */
export function extractAuthToken(setCookie: string | string[] | undefined): string {
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const authCookie = cookies.find((cookie) => cookie.startsWith('Authorization='));
  return authCookie ? authCookie.split(';')[0].slice('Authorization='.length) : '';
}
