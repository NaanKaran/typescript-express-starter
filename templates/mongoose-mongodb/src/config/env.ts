import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod';

/**
 * 1) dotenv 로드 순서
 *    - .env.{NODE_ENV}.local (환경별 override, 우선 적용)
 *    - .env (공통)
 *    이미 설정된 process.env 값은 덮어쓰지 않습니다.
 */
const nodeEnv = process.env.NODE_ENV || 'development';
const layerPath = resolve(process.cwd(), `.env.${nodeEnv}.local`);
if (existsSync(layerPath)) {
  config({ path: layerPath, quiet: true });
}
config({ quiet: true }); // .env

/**
 * 2) Zod 스키마 정의
 */
const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().nonnegative().optional(), // 기본값은 app.ts에서 3000 처리

    MONGODB_URL: z
      .string()
      .min(1)
      .regex(/^mongodb(\+srv)?:\/\//, 'MONGODB_URL must start with mongodb:// or mongodb+srv://'),
    MONGODB_DB_NAME: z.string().min(1).optional(),
    MONGODB_MAX_POOL_SIZE: z.coerce.number().int().positive().default(10),

    SECRET_KEY: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default('1h'),

    LOG_FORMAT: z.string().min(1).optional(), // 기본값은 app.ts에서 'dev'
    LOG_DIR: z.string().min(1).default('logs'),
    LOG_LEVEL: z.string().min(1).default('info'),

    ORIGIN: z.string().min(1).default('http://localhost:3000'),
    CREDENTIALS: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'), // 'true'/'false' 문자열 → boolean
    CORS_ORIGINS: z.string().optional(), // "http://a.com,http://b.com"

    API_SERVER_URL: z.url().optional(),
  })
  .strip();

/**
 * 3) 검증(모듈 import 시점에 실행)
 */
const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('\n❌ Invalid environment variables:\n');
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}
const env = parsed.data;

export { env };

/**
 * 4) 타입 안전한 상수 export
 *    - 다른 파일에서는 process.env 직접 쓰지 말고 여기서만 가져가세요.
 */
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;

export const MONGODB_URL = env.MONGODB_URL;
export const MONGODB_DB_NAME = env.MONGODB_DB_NAME;
export const MONGODB_MAX_POOL_SIZE = env.MONGODB_MAX_POOL_SIZE;

export const SECRET_KEY = env.SECRET_KEY;
export const JWT_SECRET = env.JWT_SECRET;
export const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;

export const LOG_FORMAT = env.LOG_FORMAT;
export const LOG_DIR = env.LOG_DIR;
export const LOG_LEVEL = env.LOG_LEVEL;

export const ORIGIN = env.ORIGIN;
export const CREDENTIALS = env.CREDENTIALS;
export const API_SERVER_URL = env.API_SERVER_URL;

// CORS Origins 배열 (CORS_ORIGINS가 없으면 ORIGIN 사용)
export const CORS_ORIGIN_LIST = (env.CORS_ORIGINS ?? env.ORIGIN)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
