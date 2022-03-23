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
import { FileUpload, GraphQLUpload } from "graphql-upload";
import path from "path";
import { createWriteStream } from "fs";
import { finished } from "stream/promises";
import User from "../entities/User";
import Post from "../entities/Post";
import { MyContext } from "../types";
import { PostInput } from "./PostInput";
import { isAuth } from "../middlewares/isAuth";
import { PostResponse } from "./PostResponse";
import { PaginatedPosts } from "./PaginatedPosts";
import { createRandomFilename } from "../utils/createRandomFilename";
import { validateCreatePost } from "../utils/validateCreatePost";

@Resolver(Post)
export class PostResolver {
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => Number, { nullable: true }) cursor: number | null,
    @Ctx() {}: MyContext
  ): Promise<PaginatedPosts> {
    const postsLimit = Math.min(20, limit);
    const qb = getConnection()
      .getRepository(Post)
      .createQueryBuilder("post")
      // .innerJoinAndSelect("post.author", "user", "user.id = post.authorId")
      .orderBy("post.createdAt", "DESC")
      .take(postsLimit + 1);
    if (cursor) {
      qb.where("post.createdAt < :cursor", {
        cursor: new Date(cursor),
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

  @FieldResolver(() => String)
  cover(@Root() post: Post) {
    if (post.cover) {
      return `http://localhost:4000/images/post/cover/${post.cover}`;
    }
    return "";
  }

  @FieldResolver(() => User)
  author(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.authorId);
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => PostResponse)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Arg("cover", () => GraphQLUpload)
    { createReadStream, filename }: FileUpload,
    @Ctx() { req }: MyContext
  ): Promise<PostResponse> {
    const errors = validateCreatePost(input);
    if (errors) {
      return { errors };
    }

    const stream = createReadStream();
    const { ext } = path.parse(filename);
    const randomFilename = createRandomFilename() + ext;
    const out = createWriteStream(
      path.join(__dirname, "../../images/post/cover", randomFilename)
    );
    await stream.pipe(out);
    await finished(out);

    const post = await Post.create({
      ...input,
      cover: randomFilename,
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
