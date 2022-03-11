import "reflect-metadata";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginDrainHttpServer,
  // ApolloServerPluginLandingPageGraphQLPlayground,
} from "apollo-server-core";
import express from "express";
import http from "http";
import { buildSchema } from "type-graphql";
import session from "express-session";
import Redis from "ioredis";
import { createConnection } from "typeorm";
import { COOKIE_NAME, __prod__ } from "./constants";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
// import Post from "./entities/Post";

const main = async () => {
  await createConnection();

  const app = express();
  const httpServer = http.createServer(app);

  const RedisStore = require("connect-redis")(session);
  const redis = new Redis();

  app.set("trust proxy", !__prod__);

  app.use(
    cors({
      origin: ["https://studio.apollographql.com", "http://localhost:3000"],
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
        disableTTL: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        sameSite: "none",
        secure: true,
      },
      secret: "random secret key",
      saveUninitialized: false,
      resave: false,
    })
  );

  const apolloSever = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // If you want to work with the GraphQL landing page instead of Apollo Studio, please comment out the following line.
      // ApolloServerPluginLandingPageGraphQLPlayground(),
    ],
    context: ({ req, res }) => ({ req, res, redis }),
  });

  await apolloSever.start();

  apolloSever.applyMiddleware({
    app,
    cors: false,
  });

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );
  console.log(
    `🚀 Server ready at http://localhost:4000${apolloSever.graphqlPath}`
  );
};

main().catch((err) => {
  console.error(err);
});
