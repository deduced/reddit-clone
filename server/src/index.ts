import "reflect-metadata";
import { createConnection } from "typeorm";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import cors from "cors";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";

import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { COOKIE_NAME } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from "path";

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    database: "reddit_clone_dev",
    username: "charlieastrada",
    logging: true,
    synchronize: true,
    entities: [Post, User],
    migrations: [path.join(__dirname, "./migrations/*")],
  });

  await conn.runMigrations();

  const port = 4000; //TODO set as env variable
  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  //apply cors globally (all routes)
  //set to work with client cookies
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTTL: true, //TODO: check if this is needed
        disableTouch: true, //Session has no TTL so disable touch to avoid unnecessary requests
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
        httpOnly: true, //security - ensures frontend code cannot access cookie
        sameSite: "lax", //csrf protection
        secure: process.env.NODE_ENV === "production", //cookie only works in https
      },
      saveUninitialized: false, //do not store empty session
      secret: "asldkjflwrwerbasdfhasdf", //TODO: put this in an env variable
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res, redis }),
  });

  //create graphql endpoint on express
  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(port, () => {
    console.log(`Server started on port: ${port}`);
  });
};

main().catch((err) => console.error(err));
