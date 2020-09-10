import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { ObjectType, Field, Int } from "type-graphql";

@ObjectType() //convert class into graphql type with this decorator and Field decorator for individual fields
@Entity()
export class User {
  @Field(() => Int) //type will be inferred but we can specifiy anyways.
  @PrimaryKey()
  id!: number;

  @Field(() => String) //Type needed as it cannot be inferred by default for date. if not available, NoExplicitTypeError will occur
  @Property({ type: "date" })
  createdAt = new Date();

  @Field(() => String) //Type needed as it cannot be inferred by default for date
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  @Field() // no specific type needed as it can be inferred
  @Property({ type: "text", unique: true })
  username!: string;

  @Field() // no specific type needed as it can be inferred
  @Property({ type: "text", unique: true })
  email!: string;

  @Property({ type: "text" })
  password!: string;
}
