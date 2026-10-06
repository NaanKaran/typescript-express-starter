import os from 'node:os';
import mongoose from 'mongoose';
import { MONGODB_DB_NAME, MONGODB_MAX_POOL_SIZE, MONGODB_URL, NODE_ENV } from '@config/env';
import { logger } from '@utils/logger';

/**
 * Mongoose 전역 설정
 * - strictQuery: 스키마에 없는 필드로 필터링하면 무시
 * - debug: 개발 환경에서 쿼리 로깅
 */
mongoose.set('strictQuery', true);
if (NODE_ENV === 'development') {
  mongoose.set('debug', (collection: string, method: string, ...args: unknown[]) => {
    logger.debug({ collection, method, args }, 'mongoose');
  });
}

let listenersRegistered = false;

function registerConnectionListeners(): void {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('connected', () => logger.info('🔗 MongoDB connected'));
  mongoose.connection.on('reconnected', () => logger.info('🔁 MongoDB reconnected'));
  mongoose.connection.on('disconnected', () => logger.warn('📴 MongoDB disconnected'));
  mongoose.connection.on('error', (error: Error) => {
    logger.error({ error: error.message }, '❌ MongoDB connection error');
  });
}

/**
 * MongoDB 연결
 * @param uri 연결 문자열 (기본값: MONGODB_URL) - 테스트에서 in-memory 서버 주소 주입용
 */
export async function connectDB(uri: string = MONGODB_URL): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
    return mongoose;
  }

  registerConnectionListeners();

  const conn = await mongoose.connect(uri, {
    dbName: MONGODB_DB_NAME,
    maxPoolSize: MONGODB_MAX_POOL_SIZE,
    serverSelectionTimeoutMS: 5_000,
    socketTimeoutMS: 45_000,
    // 프로덕션에서는 인덱스를 마이그레이션/스크립트(db:indexes)로 관리
    autoIndex: NODE_ENV !== 'production',
    // 드라이버 기본값은 동적 import('os')로 로드 → Jest(CJS VM) 환경에서 핸드셰이크 실패
    // Node.js os 모듈을 명시적으로 주입해 모든 런타임/테스트 러너에서 동일하게 동작하도록 함
    runtimeAdapters: { os },
  });

  logger.info(`🍃 Using MongoDB database "${conn.connection.name}"`);
  return conn;
}

/**
 * MongoDB 연결 해제
 */
export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) return;
  await mongoose.disconnect();
}

/**
 * 연결 상태 확인 (헬스체크용)
 */
export function isDBConnected(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}
