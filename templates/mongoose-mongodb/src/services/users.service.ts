import type { CreateUserDto, UpdateUserDto, UsersQueryDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/http.exception';
import type { UserResponse } from '@interfaces/user.interface';
import type { IUsersRepository, SimplePaginatedResult } from '@repositories/users.repository';
import { Hash } from '@utils/hash';

export class UsersService {
  constructor(private usersRepository: IUsersRepository) {}

  async getAllUsers(): Promise<UserResponse[]> {
    return this.usersRepository.findAll();
  }

  async getAllUsersPaginated(options: UsersQueryDto): Promise<SimplePaginatedResult> {
    return this.usersRepository.findAllPaginated(options);
  }

  async getUserById(id: string): Promise<UserResponse> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new HttpException(404, 'User not found');
    return user;
  }

  async createUser(user: CreateUserDto): Promise<UserResponse> {
    const exists = await this.usersRepository.findByEmail(user.email);
    if (exists) throw new HttpException(409, 'Email already exists');

    const hashedPassword = await Hash.hashPassword(user.password);
    return this.usersRepository.save({ ...user, password: hashedPassword });
  }

  async updateUser(id: string, update: UpdateUserDto): Promise<UserResponse> {
    const exists = await this.usersRepository.findById(id);
    if (!exists) throw new HttpException(404, 'User not found');

    if (update.email && update.email !== exists.email) {
      const duplicateUser = await this.usersRepository.findByEmail(update.email);
      if (duplicateUser && duplicateUser.id !== exists.id) {
        throw new HttpException(409, 'Email already exists');
      }
    }

    const password = update.password ? await Hash.hashPassword(update.password) : undefined;

    const updated = await this.usersRepository.update(id, { ...update, password });
    if (!updated) throw new HttpException(404, 'User not found');
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    const deleted = await this.usersRepository.delete(id);
    if (!deleted) throw new HttpException(404, 'User not found');
  }
}
