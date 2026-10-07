import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';

// tsconfig.json 읽기
const tsconfig = JSON.parse(readFileSync('./tsconfig.json', 'utf8'));

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  maxWorkers: 1, // 테스트 파일마다 in-memory MongoDB를 띄우므로 단일 워커 사용
  roots: ['<rootDir>/src'],

  verbose: true,
  collectCoverage: false,
  detectOpenHandles: true,
  forceExit: true,
  passWithNoTests: true,
  testTimeout: 30000, // 최초 실행 시 mongodb-memory-server 바이너리 다운로드 고려

  // 모듈 로드 전 테스트 환경 변수 설정
  setupFiles: ['<rootDir>/src/test/jest.setup.ts'],

  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: false }],
  },
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions?.paths || {}, {
    prefix: '<rootDir>/src/',
  }),
  testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/src/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/logs/', '/unit_disabled/'],

  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/server.ts',
    '!src/config/seed.ts',
    '!src/config/reset.ts',
    '!src/config/sync-indexes.ts',
  ],

  watchman: false,
  slowTestThreshold: 5,
};

export default config;
