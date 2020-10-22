import { Request, Response } from "express";
import { Redis } from "ioredis";
import createUpvoteLoader from "./utils/createUpvoteLoader";
import createUserLoader from "./utils/createUserLoader";

export type MyContext = {
  req: Request & { session: Express.Session }; //set session type join as req will always be set
  redis: Redis;
  res: Response;
  userLoader: ReturnType<typeof createUserLoader>;
  upvoteLoader: ReturnType<typeof createUpvoteLoader>;
};
