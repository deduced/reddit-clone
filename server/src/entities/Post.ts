import { ObjectType, Field } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Upvote } from "./Upvote";
import { User } from "./User";

@ObjectType() //convert class into graphql type with this decorator and Field decorator for individual fields
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column({ type: "int", default: 0 })
  points!: number;

  @Field()
  @Column()
  creatorId: number;

  @Field()
  @ManyToOne(() => User, (user) => user.posts)
  creator: User;

  @OneToMany(() => Upvote, (upvote) => upvote.post)
  upvotes: Upvote[];

  @Field(() => String) //Type needed as it cannot be inferred by default for date. if not available, NoExplicitTypeError will occur
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String) //Type needed as it cannot be inferred by default for date
  @UpdateDateColumn()
  updatedAt: Date;
}
