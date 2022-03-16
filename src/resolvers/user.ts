import {
  Arg,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import argon2 from "argon2";
import { v4 as uuidV4 } from "uuid";
import { createWriteStream } from "fs";
import path from "path";
import { finished } from "stream/promises";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import User from "../entities/User";
import { MyContext } from "../types";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { UserResponse } from "./UserResponse";
import { RegisterInput } from "./RegisterInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { createRandomFilename } from "../utils/createRandomFilename";

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.id) {
      return user.email;
    }
    return "";
  }

  @FieldResolver(() => String)
  avatarUrl(@Root() user: User) {
    if (user.avatarUrl) {
      return `http://localhost:4000/images/user/${user.avatarUrl}`;
    }
    return "";
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options", () => RegisterInput) options: RegisterInput,
    @Arg("avatar", () => GraphQLUpload)
    { createReadStream, filename }: FileUpload,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const stream = createReadStream();
    const { ext } = path.parse(filename);
    const randomFilename = createRandomFilename() + ext;
    const out = createWriteStream(
      path.join(__dirname, "../../images/user", randomFilename)
    );
    await stream.pipe(out);
    await finished(out);

    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
      user = await User.create({
        username: options.username,
        email: options.email,
        password: hashedPassword,
        avatarUrl: randomFilename,
      }).save();
      req.session!.userId = user.id;
    } catch (err) {
      if (err.code === "23505" || err.detail.includes("already exists")) {
        return {
          errors: [
            {
              field: "username",
              message: "username or email already exists.",
            },
          ],
        };
      }
    }
    return {
      user,
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne({
      where: usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail },
    });
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "User does not exist.",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "Password is not valid.",
          },
        ],
      };
    }
    req.session.userId = user.id;
    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
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

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    const user = await User.findOne({ where: { id: req.session.userId } });
    return user;
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return false;
    }

    const token = uuidV4();
    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60
    );

    await sendEmail(
      email,
      "Forgot Password?",
      `<a href='http://localhost:3000/change-password/${token}'>Reset Password</a>`
    );

    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("newPassword") newPassword: string,
    @Arg("token") token: string,
    @Ctx() { req, redis }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 5) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "Password must be at least 6 characters.",
          },
        ],
      };
    }

    const userId = await redis.get(FORGOT_PASSWORD_PREFIX + token);
    if (!userId) {
      return {
        errors: [{ field: "token", message: "Token expired." }],
      };
    }
    const user = await User.findOne({ where: { id: parseInt(userId) } });
    if (!user) {
      return {
        errors: [{ field: "token", message: "TUser exists no longer." }],
      };
    }
    User.update(
      { id: parseInt(userId) },
      { password: await argon2.hash(newPassword) }
    );
    await redis.del(FORGOT_PASSWORD_PREFIX + token);
    req.session.userId = user.id;

    return {
      user,
    };
  }
}
