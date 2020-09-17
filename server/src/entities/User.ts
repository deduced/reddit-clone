import { ObjectType, Field, Int } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Entity } from "typeorm/decorator/entity/Entity";

@ObjectType() //convert class into graphql type with this decorator and Field decorator for individual fields
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String) //Type needed as it cannot be inferred by default for date. if not available, NoExplicitTypeError will occur
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String) //Type needed as it cannot be inferred by default for date
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column({ unique: true })
  username!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;
}
