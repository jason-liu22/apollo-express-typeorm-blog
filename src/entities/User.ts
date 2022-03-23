import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import Post from "./Post";

@ObjectType()
@Entity()
export default class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  username!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Field()
  @Column("text", { default: "" })
  avatarUrl: string;

  @Column({ type: "text" })
  password!: string;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @Field(() => Number)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Number)
  @UpdateDateColumn()
  updatedAt: Date;
}
