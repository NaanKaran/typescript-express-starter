import type { Request, Response, RequestHandler } from 'express';
import { injectable, container } from 'tsyringe';
import type { CreateUserDto, UpdateUserDto } from '@dtos/users.dto';
import { usersQuerySchema } from '@dtos/users.dto';
import { UsersService } from '@services/users.service';
import { asyncHandler } from '@utils/asyncHandler';

const getIdParam = (req: Request): string => {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
};

@injectable()
export class UsersController {
  private readonly userService: UsersService;

  constructor() {
    this.userService = container.resolve(UsersService);
  }

  getUsers: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const query = usersQuerySchema.parse(req.query);

    if (query.page || query.limit || query.search) {
      const result = await this.userService.getAllUsersPaginated(query);

      res.json({
        data: result.users,
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        message: 'findAll',
      });
      return;
    }

    const users = await this.userService.getAllUsers();

    res.json({ data: users, message: 'findAll' });
  });

  getUserById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.getUserById(getIdParam(req));

    res.json({ data: user, message: 'findById' });
  });

  createUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const userData: CreateUserDto = req.body;
    const user = await this.userService.createUser(userData);

    res.status(201).json({ data: user, message: 'create' });
  });

  updateUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const userData: UpdateUserDto = req.body;
    const user = await this.userService.updateUser(getIdParam(req), userData);

    res.json({ data: user, message: 'update' });
  });

  deleteUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    await this.userService.deleteUser(getIdParam(req));

    res.status(204).send();
  });
}
