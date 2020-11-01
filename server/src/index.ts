import "reflect-metadata";
import "dotenv-safe/config";
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
import { Upvote } from "./entities/Upvote";
import createUserLoader from "./utils/createUserLoader";
import createUpvoteLoader from "./utils/createUpvoteLoader";

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    logging: true,
    synchronize: process.env.NODE_ENV !== "production",
    entities: [Post, User, Upvote],
    migrations: [path.join(__dirname, "./migrations/*")]
  });

  await conn.runMigrations();

  const port = parseInt(process.env.PORT);
  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);

  //NGINX in dokku
  app.set("trust proxy", 1);

  //apply cors globally (all routes)
  //set to work with client cookies
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTTL: true, //TODO: check if this is needed
        disableTouch: true //Session has no TTL so disable touch to avoid unnecessary requests
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
        httpOnly: true, //security - ensures frontend code cannot access cookie
        sameSite: "lax", //csrf protection
        secure: process.env.NODE_ENV === "production", //cookie only works in https
        domain: process.env.NODE_ENV === "production" ? ".xagax.net" : undefined
      },
      saveUninitialized: false, //do not store empty session
      secret: process.env.SESSION_SECRET,
      resave: false
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      upvoteLoader: createUpvoteLoader()
    })
  });

  //create graphql endpoint on express
  apolloServer.applyMiddleware({
    app,
    cors: false
  });

  app.listen(port, () => {
    console.log(`Server started on port: ${port}`);
  });
};

main().catch((err) => console.error(err));
