import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../../../shared/types';

const userService = new UserService();

export async function listUsersHandler(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user;
  const users = await userService.listUsers(req.query as Record<string, unknown>, user);
  const serialized = await Promise.all(users.map((u) => userService.serializeUser(u)));
  res.json({ count: serialized.length, results: serialized });
}

export async function getUserHandler(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  const user = await userService.getUser(id);
  const serialized = await userService.serializeUser(user);
  res.json(serialized);
}

export async function createUserHandler(req: Request, res: Response): Promise<void> {
  const requestingUser = (req as AuthenticatedRequest).user;
  const user = await userService.createUser(req.body, requestingUser);
  const serialized = await userService.serializeUser(user);
  res.status(201).json(serialized);
}

export async function updateUserHandler(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  const user = await userService.updateUser(id, req.body);
  const serialized = await userService.serializeUser(user);
  res.json(serialized);
}
