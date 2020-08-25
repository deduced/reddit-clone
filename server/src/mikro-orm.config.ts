import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { Post } from "./entities/Post";
import { User } from "./entities/User";

export default {
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/, // regex pattern for the migration files
  },
  dbName: "reddit_clone",
  debug: process.env.NODE_ENV !== "production",
  entities: [Post, User],
  type: "postgresql",
  user: "charlieastrada",
} as Parameters<typeof MikroORM.init>[0];
