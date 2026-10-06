/**
 * MongoDB 데이터베이스 리셋 스크립트
 * 현재 데이터베이스를 삭제(drop)하여 초기 상태로 되돌립니다.
 */
import mongoose from 'mongoose';
import { NODE_ENV } from '@config/env';
import { connectDB, disconnectDB } from '@config/database';
import { logger } from '@utils/logger';

async function resetDatabase(): Promise<void> {
  if (NODE_ENV === 'production') {
    throw new Error('Refusing to reset the database in production');
  }

  await connectDB();

  try {
    const dbName = mongoose.connection.name;
    await mongoose.connection.dropDatabase();
    logger.info(`✅ Database "${dbName}" dropped successfully!`);
  } finally {
    await disconnectDB();
  }
}

resetDatabase()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    logger.error({ error: error instanceof Error ? error.message : error }, '❌ Reset failed');
    process.exit(1);
  });
