/**
 * UsersService 단위 테스트
 * @desc DB 없이 in-memory Repository로 비즈니스 로직만 검증
 */
import { HttpException } from '@exceptions/http.exception';
import type {
  CreateUserData,
  UpdateUserData,
  User,
  UserResponse,
} from '@interfaces/user.interface';
import type {
  IUsersRepository,
  SimplePaginatedResult,
  SimpleQuery,
} from '@repositories/users.repository';
import { UsersService } from '@services/users.service';

class InMemoryUsersRepository implements IUsersRepository {
  private users: User[] = [];
  private seq = 0;

  private strip(user: User): UserResponse {
    const response: Partial<User> = { ...user };
    delete response.password;
    return response as UserResponse;
  }

  async findAll() {
    return this.users.map((u) => this.strip(u));
  }
  async findAllPaginated({ page = 1, limit = 10 }: SimpleQuery): Promise<SimplePaginatedResult> {
    const users = this.users.slice((page - 1) * limit, page * limit).map((u) => this.strip(u));
    const total = this.users.length;
    return { users, page, limit, total, totalPages: Math.ceil(total / limit) };
  }
  async findById(id: string) {
    const user = this.users.find((u) => u.id === id);
    return user ? this.strip(user) : null;
  }
  async findByEmail(email: string) {
    const user = this.users.find((u) => u.email === email);
    return user ? this.strip(user) : null;
  }
  async findByEmailWithPassword(email: string) {
    const user = this.users.find((u) => u.email === email);
    return user ? { user: this.strip(user), password: user.password } : null;
  }
  async save(data: CreateUserData) {
    this.seq += 1;
    const now = new Date();
    const user: User = {
      id: this.seq.toString(16).padStart(24, '0'),
      email: data.email,
      password: data.password,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return this.strip(user);
  }
  async update(id: string, update: UpdateUserData) {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    for (const [key, value] of Object.entries(update)) {
      if (value !== undefined) Object.assign(user, { [key]: value });
    }
    return this.strip(user);
  }
  async delete(id: string) {
    const before = this.users.length;
    this.users = this.users.filter((u) => u.id !== id);
    return this.users.length < before;
  }
  async reset() {
    this.users = [];
  }
  passwordOf(email: string) {
    return this.users.find((u) => u.email === email)?.password;
  }
}

describe('UsersService', () => {
  let repo: InMemoryUsersRepository;
  let service: UsersService;

  beforeEach(() => {
    repo = new InMemoryUsersRepository();
    service = new UsersService(repo);
  });

  it('creates a user with a hashed password and no password in the response', async () => {
    const user = await service.createUser({ email: 'a@example.com', password: 'password123' });

    expect(user.email).toBe('a@example.com');
    expect(user).not.toHaveProperty('password');
    expect(repo.passwordOf('a@example.com')).not.toBe('password123');
  });

  it('rejects duplicate emails with 409', async () => {
    await service.createUser({ email: 'a@example.com', password: 'password123' });

    await expect(
      service.createUser({ email: 'a@example.com', password: 'password123' }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('throws 404 for unknown users', async () => {
    await expect(service.getUserById('missing')).rejects.toBeInstanceOf(HttpException);
    await expect(service.deleteUser('missing')).rejects.toMatchObject({ status: 404 });
  });

  it('re-hashes the password on update', async () => {
    const user = await service.createUser({ email: 'a@example.com', password: 'password123' });
    const before = repo.passwordOf('a@example.com');

    await service.updateUser(user.id, { password: 'newpassword123' });

    const after = repo.passwordOf('a@example.com');
    expect(after).not.toBe(before);
    expect(after).not.toBe('newpassword123');
  });
});
