import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import User from "./User";

@ObjectType()
@Entity()
export default class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  title!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field()
  @Column({ nullable: true })
  cover: string;

  @Field()
  @Column({ type: "text", default: "" })
  body: string;

  @Field()
  @Column({ type: "int", default: 0 })
  points!: number;

  @Field()
  @Column()
  authorId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts)
  author: User;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
