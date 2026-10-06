import { decode, sign, type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { JWT_EXPIRES_IN, JWT_SECRET, NODE_ENV } from '@config/env';
import type { LoginRequest, SignupRequest } from '@dtos/auth.dto';
import { HttpException } from '@exceptions/http.exception';
import type { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import type { UserResponse } from '@interfaces/user.interface';
import type { IUsersRepository } from '@repositories/users.repository';
import { Hash } from '@utils/hash';
import { logger } from '@utils/logger';

export class AuthService {
  constructor(private usersRepository: IUsersRepository) {}

  private createToken(user: UserResponse): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const expiresIn = JWT_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>;
    const token = sign(dataStoredInToken, JWT_SECRET, { expiresIn });

    // 쿠키 Max-Age(초)는 실제 토큰 exp 기준으로 계산 (JWT_EXPIRES_IN: '1h', '7d', 3600 ...)
    const { exp = 0, iat = 0 } = decode(token) as JwtPayload;
    return { expiresIn: exp - iat, token };
  }

  private createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${
      tokenData.expiresIn
    }; Path=/; SameSite=Lax;${NODE_ENV === 'production' ? ' Secure;' : ''}`;
  }

  async signup(userData: SignupRequest): Promise<UserResponse> {
    const existingUser = await this.usersRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new HttpException(409, 'Email already exists');
    }

    const hashedPassword = await Hash.hashPassword(userData.password);
    return this.usersRepository.save({ ...userData, password: hashedPassword });
  }

  async login(userData: LoginRequest): Promise<{ cookie: string; user: UserResponse }> {
    const found = await this.usersRepository.findByEmailWithPassword(userData.email);
    if (!found || !found.user.isActive) {
      throw new HttpException(401, 'Invalid credentials');
    }

    const isPasswordValid = await Hash.comparePassword(userData.password, found.password);
    if (!isPasswordValid) {
      throw new HttpException(401, 'Invalid credentials');
    }

    const tokenData = this.createToken(found.user);
    const cookie = this.createCookie(tokenData);

    return { cookie, user: found.user };
  }

  async logout(user: UserResponse): Promise<void> {
    logger.info(`User with email ${user.email} logged out.`);
  }
}
