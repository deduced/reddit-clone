import {
  Resolver,
  Mutation,
  Field,
  Arg,
  Ctx,
  ObjectType,
  Query,, FieldResolver, Root
} from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";
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

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() {req}: MyContext ){
    console.log("user: ", user)
    console.log("currentUser: ", req.session.userId)
    //current user logged in and ok to show email
    if (req.session.userId === user.id) {
     return user.email       
    }
    //current user wants to see another user's email and we do not allow it
    return ""

  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { req, redis }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "length must be greater than 2"
          }
        ]
      };
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const userIdStr = await redis.get(key);

    if (!userIdStr) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired"
          }
        ]
      };
    }

    const userId = parseInt(userIdStr);
    const user = await User.findOne(userId);

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists"
          }
        ]
      };
    }

    await User.update(
      { id: userId },
      { password: await argon2.hash(newPassword) }
    );

    await redis.del(key); //delete key after successful change password.

    //log in user after change password
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      //no user with email in db
      return true; //for security reasons, return true to avoid serialized probing of emails via forgot password
    }

    const token = genUUID();
    const key = FORGET_PASSWORD_PREFIX + token; //redis key
    await redis.set(key, user.id, "ex", 1000 * 60 * 60 * 24 * 3); //3 day expiration

    await sendEmail(
      email,
      "Password Reset",
      `<a href="http://localhost:3000/change-password/${token}">Reset Password</a>`
    );

    return true;
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    //user not logged in
    if (!req.session.userId) {
      return null;
    }

    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);

    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);

    let user;

    try {
      user = await User.create({
        email: options.email,
        password: hashedPassword,
        username: options.username
      }).save();
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
              message: "username already taken."
            }
          ]
        };
      }
    }

    //If user is undefined for some reason
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "Problem creating user. Try again."
          }
        ]
      };
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
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail.toLowerCase() } }
        : { where: { username: usernameOrEmail.toLowerCase() } }
    );

    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "username does not exist"
          }
        ]
      };
    }
    const isValidEmail = await argon2.verify(user.password, password);

    if (!isValidEmail) {
      return {
        errors: [
          {
            field: "password",
            message: "invalid login"
          }
        ]
      };
    }

    req.session.userId = user.id; //store current user ID in session object

    return {
      user
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
