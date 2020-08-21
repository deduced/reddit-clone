import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core";
import path from "path";

export default {
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/, // regex pattern for the migration files
  },
  dbName: "reddit_clone",
  debug: process.env.NODE_ENV !== "production",
  entities: [Post],
  type: "postgresql",
  user: "charlieastrada",
} as Parameters<typeof MikroORM.init>[0];
