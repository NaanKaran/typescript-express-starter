import { defineConfig } from 'vitest/config';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@controllers': path.resolve(__dirname, 'src/controllers'),
      '@dtos': path.resolve(__dirname, 'src/dtos'),
      '@exceptions': path.resolve(__dirname, 'src/exceptions'),
      '@interfaces': path.resolve(__dirname, 'src/interfaces'),
      '@middlewares': path.resolve(__dirname, 'src/middlewares'),
      '@models': path.resolve(__dirname, 'src/models'),
      '@repositories': path.resolve(__dirname, 'src/repositories'),
      '@routes': path.resolve(__dirname, 'src/routes'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules', 'dist', 'coverage', 'logs', 'src/test/unit_disabled/**/*'],
    // 테스트 파일마다 in-memory MongoDB를 띄우므로 파일 단위 병렬 실행 비활성화
    fileParallelism: false,
    testTimeout: 30000, // 최초 실행 시 mongodb-memory-server 바이너리 다운로드 고려
    hookTimeout: 120000,

    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/test/**',
        'src/server.ts',
        'src/config/seed.ts',
        'src/config/reset.ts',
        'src/config/sync-indexes.ts',
      ],
    },

    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      MONGODB_URL: 'mongodb://127.0.0.1:27017/test', // 실제 연결은 src/test/setup.ts에서 결정
      JWT_SECRET: 'test-jwt-secret',
      SECRET_KEY: 'test-secret-key',
    },
  },

  esbuild: {
    target: 'node20',
    keepNames: true,
  },
});
