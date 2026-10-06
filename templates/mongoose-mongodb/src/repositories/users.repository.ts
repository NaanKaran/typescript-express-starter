import { isValidObjectId, type Types } from 'mongoose';
import { UserModel } from '@models/user.model';
import type {
  CreateUserData,
  UpdateUserData,
  UserResponse,
  UserWithPassword,
} from '@interfaces/user.interface';

export interface SimpleQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface SimplePaginatedResult {
  users: UserResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IUsersRepository {
  findAll(): Promise<UserResponse[]>;
  findAllPaginated(options: SimpleQuery): Promise<SimplePaginatedResult>;
  findById(id: string): Promise<UserResponse | null>;
  findByEmail(email: string): Promise<UserResponse | null>;
  findByEmailWithPassword(email: string): Promise<UserWithPassword | null>;
  save(user: CreateUserData): Promise<UserResponse>;
  update(id: string, update: UpdateUserData): Promise<UserResponse | null>;
  delete(id: string): Promise<boolean>;
  reset(): Promise<void>; // 테스트용 메소드
}

/** lean() 조회 결과 형태 */
interface UserLean {
  _id: Types.ObjectId;
  email: string;
  password?: string;
  firstName?: string | null;
  lastName?: string | null;
  isActive?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

const toUserResponse = (doc: UserLean): UserResponse => ({
  id: doc._id.toString(),
  email: doc.email,
  firstName: doc.firstName ?? null,
  lastName: doc.lastName ?? null,
  isActive: doc.isActive ?? true,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

/** 정규식 특수문자 이스케이프 (검색어 인젝션 방지) */
const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class UsersRepository implements IUsersRepository {
  async findAll(): Promise<UserResponse[]> {
    const docs = await UserModel.find().sort({ createdAt: -1 }).lean<UserLean[]>();
    return docs.map(toUserResponse);
  }

  async findAllPaginated(options: SimpleQuery): Promise<SimplePaginatedResult> {
    const { page = 1, limit = 10, search } = options;

    const filter = search
      ? {
          $or: ['email', 'firstName', 'lastName'].map((field) => ({
            [field]: { $regex: escapeRegex(search), $options: 'i' },
          })),
        }
      : {};

    const [docs, total] = await Promise.all([
      UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<UserLean[]>(),
      UserModel.countDocuments(filter),
    ]);

    return {
      users: docs.map(toUserResponse),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<UserResponse | null> {
    if (!isValidObjectId(id)) return null;

    const doc = await UserModel.findById(id).lean<UserLean>();
    return doc ? toUserResponse(doc) : null;
  }

  async findByEmail(email: string): Promise<UserResponse | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean<UserLean>();
    return doc ? toUserResponse(doc) : null;
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() })
      .select('+password')
      .lean<UserLean>();
    if (!doc || !doc.password) return null;

    return { user: toUserResponse(doc), password: doc.password };
  }

  async save(user: CreateUserData): Promise<UserResponse> {
    const created = await UserModel.create({
      email: user.email,
      password: user.password,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      isActive: user.isActive ?? true,
    });

    return toUserResponse(created.toObject<UserLean>());
  }

  async update(id: string, update: UpdateUserData): Promise<UserResponse | null> {
    if (!isValidObjectId(id)) return null;

    // undefined 필드는 제외하여 부분 업데이트
    const $set = Object.fromEntries(
      Object.entries(update).filter(([, value]) => value !== undefined),
    );

    const doc = await UserModel.findByIdAndUpdate(
      id,
      { $set },
      { returnDocument: 'after', runValidators: true },
    ).lean<UserLean>();

    return doc ? toUserResponse(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;

    const result = await UserModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async reset(): Promise<void> {
    // 테스트용 메소드: 모든 사용자 데이터 삭제
    await UserModel.deleteMany({});
  }
}
