import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core";

export default {
  dbName: "reddit_clone",
  debug: process.env.NODE_ENV !== "production",
  entities: [Post],
  type: "postgresql",
} as Parameters<typeof MikroORM.init>[0];
