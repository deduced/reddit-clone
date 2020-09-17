import { Request, Response } from "express";
import { Redis } from 'ioredis'

export type MyContext = {
  req: Request & { session: Express.Session }; //set session type join as req will always be set
  redis: Redis,
  res: Response;
};
