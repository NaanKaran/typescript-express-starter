/**
 * 도메인 User 타입 (DB 구현과 분리된 순수 TypeScript 타입)
 * - Repository가 Mongoose 문서를 이 타입으로 변환해 서비스 계층에 전달합니다.
 */
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** API 응답용 (비밀번호 제외) */
export type UserResponse = Omit<User, 'password'>;

/** 로그인 검증용 (응답 데이터와 해시된 비밀번호 분리) */
export interface UserWithPassword {
  user: UserResponse;
  password: string;
}

/** 생성 데이터 */
export type CreateUserData = Pick<User, 'email' | 'password'> &
  Partial<Pick<User, 'firstName' | 'lastName' | 'isActive'>>;

/** 수정 데이터 */
export type UpdateUserData = Partial<CreateUserData>;
