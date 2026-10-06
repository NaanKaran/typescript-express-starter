import 'reflect-metadata';
import '@config/env';
import { container } from 'tsyringe';
import { setupContainer } from '@config/container';
import { connectDB, disconnectDB } from '@config/database';
import App from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { UsersRoute } from '@routes/users.route';
import { logger } from '@utils/logger';

async function bootstrap() {
  // 🍃 MongoDB 연결 (실패 시 서버를 띄우지 않음)
  await connectDB();

  // 🔧 하이브리드 DI 컨테이너 설정
  setupContainer();

  const routes = [container.resolve(AuthRoute), container.resolve(UsersRoute)];
  const appInstance = new App(routes);
  const server = appInstance.listen();

  // Graceful Shutdown: HTTP 서버 종료 → MongoDB 연결 해제
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`Received ${signal}, closing server...`);

    server.close(async () => {
      await disconnectDB();
      logger.info('HTTP server and MongoDB connection closed gracefully');
      process.exit(0);
    });

    // 10초 내 종료되지 않으면 강제 종료
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  ['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => shutdown(signal)));
}

bootstrap().catch((error: unknown) => {
  logger.error(
    { error: error instanceof Error ? error.message : error },
    '❌ Failed to start server',
  );
  process.exit(1);
});
