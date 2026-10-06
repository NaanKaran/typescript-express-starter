/**
 * 인덱스 동기화 스크립트
 * 프로덕션에서는 autoIndex가 꺼져 있으므로 배포 시 이 스크립트로 스키마 인덱스를 반영합니다.
 */
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '@config/database';
import '@models/user.model';
import { logger } from '@utils/logger';

async function syncIndexes(): Promise<void> {
  await connectDB();

  try {
    for (const modelName of mongoose.modelNames()) {
      const dropped = await mongoose.model(modelName).syncIndexes();
      logger.info(
        `🗂️  ${modelName}: indexes synced${dropped.length ? ` (dropped: ${dropped.join(', ')})` : ''}`,
      );
    }
  } finally {
    await disconnectDB();
  }
}

syncIndexes()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    logger.error({ error: error instanceof Error ? error.message : error }, '❌ Index sync failed');
    process.exit(1);
  });
