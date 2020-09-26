import { ObjectType, Field } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Entity } from "typeorm/decorator/entity/Entity";
import { Post } from "./Post";

@ObjectType() //convert class into graphql type with this decorator and Field decorator for individual fields
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  username!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @OneToMany(() => Post, (post) => post.creator)
  posts: Post[];

  @Field(() => String) //Type needed as it cannot be inferred by default for date. if not available, NoExplicitTypeError will occur
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String) //Type needed as it cannot be inferred by default for date
  @UpdateDateColumn()
  updatedAt: Date;
}
