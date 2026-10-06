// Jest 테스트 환경 변수 설정 (모듈 로드 전에 실행됨)
// dotenv는 이미 설정된 값을 덮어쓰지 않으므로 여기서 지정한 값이 우선합니다.
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'error';
process.env.MONGODB_URL = process.env.MONGODB_URL ?? 'mongodb://127.0.0.1:27017/test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.SECRET_KEY = process.env.SECRET_KEY ?? 'test-secret-key';
