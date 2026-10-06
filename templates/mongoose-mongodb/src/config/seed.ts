import { connectDB, disconnectDB } from '@config/database';
import { UserModel } from '@models/user.model';
import { Hash } from '@utils/hash';
import { logger } from '@utils/logger';

async function seed() {
  await connectDB();

  try {
    logger.info('🌱 Starting database seeding...');

    if ((await UserModel.estimatedDocumentCount()) > 0) {
      logger.info('📋 Users already exist, skipping seed...');
      return;
    }

    const testUsers = [
      {
        email: 'admin@example.com',
        password: await Hash.hashPassword('admin123'),
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
      },
      {
        email: 'user@example.com',
        password: await Hash.hashPassword('user123'),
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      },
      {
        email: 'inactive@example.com',
        password: await Hash.hashPassword('inactive123'),
        firstName: 'Inactive',
        lastName: 'User',
        isActive: false,
      },
    ];

    await UserModel.insertMany(testUsers);

    logger.info(`✅ Seeded ${testUsers.length} users successfully`);
    logger.info('👤 Test accounts:');
    logger.info('   - admin@example.com (password: admin123)');
    logger.info('   - user@example.com (password: user123)');
    logger.info('   - inactive@example.com (password: inactive123) [inactive]');
  } finally {
    await disconnectDB();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    logger.error({ error: error instanceof Error ? error.message : error }, '❌ Seeding failed');
    process.exit(1);
  });
