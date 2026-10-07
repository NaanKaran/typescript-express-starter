const { pathsToModuleNameMapper } = require('ts-jest');
const { readFileSync } = require('fs');

const tsconfig = JSON.parse(readFileSync('./tsconfig.json', 'utf8'));

// Unit 테스트 전용 설정 (MongoDB 불필요)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/src/test/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: false }],
  },
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions?.paths || {}, {
    prefix: '<rootDir>/src/',
  }),
  testMatch: ['<rootDir>/src/test/unit/**/*.spec.ts'],
  forceExit: true,
  watchman: false,
};
