import 'reflect-metadata';
import { container } from 'tsyringe';

// Repository
import { UsersRepository } from '@repositories/users.repository';

// Service
import { AuthService } from '@services/auth.service';
import { UsersService } from '@services/users.service';

// Controller
import { AuthController } from '@controllers/auth.controller';
import { UsersController } from '@controllers/users.controller';

// Route
import { AuthRoute } from '@routes/auth.route';
import { UsersRoute } from '@routes/users.route';

let isContainerInitialized = false;

export function setupContainer() {
  if (isContainerInitialized) return;

  // 📊 Infrastructure Layer - 명시적 관리 (안정성 우선)
  const usersRepository = new UsersRepository();
  container.registerInstance(UsersRepository, usersRepository);

  // 📈 Business Layer - 명시적 관리 (의존성 복잡도 고려)
  container.registerInstance(AuthService, new AuthService(usersRepository));
  container.registerInstance(UsersService, new UsersService(usersRepository));

  // 🎨 Presentation Layer - 자동 주입 (편의성 우선)
  container.registerSingleton(AuthController);
  container.registerSingleton(UsersController);
  container.registerSingleton(AuthRoute);
  container.registerSingleton(UsersRoute);

  isContainerInitialized = true;
}
