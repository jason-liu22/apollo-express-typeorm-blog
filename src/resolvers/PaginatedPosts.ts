import { Field, ObjectType } from "type-graphql";
import Post from "../entities/Post";

@ObjectType()
export class PaginatedPosts {
  @Field(() => [Post])
  posts?: Post[];

  @Field()
  hasMore: boolean;
}
