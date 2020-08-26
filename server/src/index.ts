import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";

const main = async () => {
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up();

  const port = 3000; //TODO set as env variable
  const app = express();

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
        disableTTL: true, //TODO: check if this is needed
        disableTouch: true, //Session has no TTL so disable touch to avoid unnecessary requests
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
        httpOnly: true, //security - ensures frontend code cannot access cookie
        sameSite: "lax", //csrf protection
        secure: process.env.NODE_ENV === "production", //cookie only works in https
      },
      secret: "asldkjflwrwerbasdfhasdf", //TODO: put this in an env variable
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
  });

  //create graphql endpoint on express
  apolloServer.applyMiddleware({ app });

  app.listen(port, () => {
    console.log(`Server started on port: ${port}`);
  });
};

main().catch((err) => console.error(err));
