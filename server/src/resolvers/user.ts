import {
  Resolver,
  Mutation,
  Field,
  Arg,
  Ctx,
  ObjectType,
  Query,
} from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";
import { EntityManager } from "@mikro-orm/postgresql";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 as genUUID } from "uuid";

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { em, req, redis }: MyContext

  ): Promise<UserResponse> {

    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "length must be greater than 2",
          },
        ]
      }
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key)

    if (!userId) {
      return {
        errors: [{
          field: "token",
          message: "token expired"
        }]
      }
    }

    const user = await em.findOne(User, { id: parseInt(userId) })

    if (!user) {
      return {
        errors: [{
          field: "token",
          message: "user no longer exists"
        }]
      }
    }



    user.password = await argon2.hash(newPassword);
    await em.persistAndFlush(user);

    await redis.del(key); //delete key after successful change password. 

    //log in user after change password
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(@Arg("email") email: string, @Ctx() { em, redis }: MyContext) {
    const user = await em.findOne(User, { email })

    if (!user) {
      //no user with email in db
      return true; //for security reasons, return true to avoid serialized probing of emails via forgot password
    }

    const token = genUUID();
    const key = FORGET_PASSWORD_PREFIX + token; //redis key
    await redis.set(key, user.id, 'ex', 1000 * 60 * 60 * 24 * 3); //3 day expiration

    await sendEmail(email, "Password Reset", `<a href="http://localhost:3000/change-password/${token}">Reset Password</a>`)


    return true;
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext) {
    //user not logged in
    if (!req.session.userId) {
      return null;
    }

    const user = await em.findOne(User, { id: req.session.userId });

    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {

    const errors = validateRegister(options)

    if (errors) {
      return { errors }
    }

    const hashedPassword = await argon2.hash(options.password);

    let user;

    try {
      //Refactor mikro-orm persist and flush to query builder
      const qb = (em as EntityManager).createQueryBuilder(User);
      qb.insert({
        email: options.email,
        password: hashedPassword,
        username: options.username,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await qb.execute("get", true);
      const userRecord = await em.findOneOrFail(User, result);
      user = userRecord;
    } catch (error) {
      if (
        error.code === "23505"
        // || error.detail.includes("already exists")
      ) {
        //duplicate username error
        return {
          errors: [
            {
              field: "username",
              message: "username already taken.",
            },
          ],
        };
      }
    }

    // Store user id in session object
    // sets cookie for user to keep logged in
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, usernameOrEmail.includes("@") ? {
      email: usernameOrEmail.toLowerCase(),
    } : { username: usernameOrEmail.toLowerCase() });

    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "username does not exist",
          },
        ],
      };
    }
    const isValidEmail = await argon2.verify(user.password, password);

    if (!isValidEmail) {
      return {
        errors: [
          {
            field: "password",
            message: "invalid login",
          },
        ],
      };
    }

    req.session.userId = user.id; //store current user ID in session object

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      //Clear session from server
      req.session.destroy((err) => {
        //clear local cookie
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
