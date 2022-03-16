import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
// import User from "../entities/User";
import Post from "../entities/Post";
import { MyContext } from "../types";
import { PostInput } from "./PostInput";
import { isAuth } from "../middlewares/isAuth";
import { PostResponse } from "./PostResponse";
import { PaginatedPosts } from "./PaginatedPosts";

@Resolver(Post)
export class PostResolver {
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() {}: MyContext
  ): Promise<PaginatedPosts> {
    const postsLimit = Math.min(20, limit);
    const qb = getConnection()
      .getRepository(Post)
      .createQueryBuilder("post")
      .innerJoinAndSelect("post.author", "user", "user.id = post.authorId")
      .orderBy("post.createdAt", "DESC")
      // .orderBy('post."createdAt"', "DESC")
      .take(postsLimit + 1);
    if (cursor) {
      qb.where("post.createdAt < :cursor", {
        cursor: new Date(parseInt(cursor)),
      });
    }
    const posts = await qb.getMany();
    return {
      posts: posts.slice(0, postsLimit),
      hasMore: posts.length > postsLimit,
    };
  }

  @FieldResolver(() => String)
  body(@Root() post: Post, @Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return "";
    }
    return post.body;
  }

  // @FieldResolver(() => User)
  // async author(@Root() post: Post) {
  //   // return userLoader.load(post.authorId);
  //   const user = await User.findOne({ id: post.authorId });
  //   return user;
  // }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne({ where: { id } });
  }

  @Mutation(() => PostResponse)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<PostResponse> {
    if (!input.title) {
      return {
        errors: [{ field: "title", message: "Title is required." }],
      };
    }
    if (!input.text) {
      return {
        errors: [{ field: "text", message: "Text is required." }],
      };
    }
    // const user = await User.findOne({ id: parseInt(req.session.userId) });
    const post = await Post.create({
      ...input,
      authorId: req.session.userId,
    }).save();
    return { post };
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne({ where: { id } });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      await Post.update({ id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id", () => Int) id: number): Promise<boolean> {
    await Post.delete({ id });
    return true;
  }
}
