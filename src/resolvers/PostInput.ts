import { Field, InputType } from "type-graphql";

@InputType()
export class PostInput {
  @Field()
  title!: string;

  @Field()
  text!: string;
}
