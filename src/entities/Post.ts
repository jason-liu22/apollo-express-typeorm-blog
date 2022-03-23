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

  @Field()
  @Column()
  description: string;

  @Field()
  @Column()
  cover: string;

  @Field()
  @Column({ type: "text" })
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

  @Field(() => Number)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Number)
  @UpdateDateColumn()
  updatedAt: Date;
}
