import type { Request, Response } from "express";
import * as usersService from "./users.service.js";

export async function listUsersHandler(req: Request, res: Response) {
  const { users, meta } = await usersService.listUsersInMySchool(req.query);
  res.json({ data: users, meta });
}

export async function getUserHandler(req: Request, res: Response) {
  const user = await usersService.getUserInMySchool(req.params.userId!);
  res.json({ data: user });
}
