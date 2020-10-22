import { isAuth } from "../middleware/isAuth";

import {
  Resolver,
  Query,
  Arg,
  Mutation,
  InputType,
  Field,
  Ctx,
  UseMiddleware,
  Int,
  FieldResolver,
  Root,
  ObjectType
} from "type-graphql";
import { Post } from "../entities/Post";
import { MyContext } from "../types";
import { getConnection } from "typeorm";
import { Upvote } from "../entities/Upvote";
import { User } from "../entities/User";

@InputType()
class PostInput {
  @Field()
  title: string;

  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];

  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  //generate textSnippet from a Post and make available to client
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return `${root.text.slice(0, 100)}...`;
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { req, upvoteLoader }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }
    const upvote = await upvoteLoader.load({
      postId: post.id,
      userId: req.session.userId
    });

    return upvote ? upvote.value : null;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpvote = value > 0;
    const realValue = isUpvote ? 1 : -1;
    const { userId } = req.session;

    const upvote = await Upvote.findOne({ where: { postId, userId } });

    try {
      //the user voted  on post already
      //and is changing vote
      if (upvote && upvote.value !== realValue) {
        await getConnection().transaction(async (tm) => {
          await tm
            .createQueryBuilder()
            .update(Upvote)
            .set({ value: realValue })
            .where('upvote."postId" = :postId and upvote."userId" = :userId', {
              postId,
              userId
            })
            .execute();

          await tm
            .createQueryBuilder()
            .update(Post)
            .set({ points: () => `points + ${realValue * 2}` }) //points needs to move 2x when changing vote
            .where("post.id = :postId", { postId })
            .execute();
        });
      } else if (!upvote) {
        // has not voted on post yet
        await getConnection().transaction(async (tm) => {
          await tm.insert(Upvote, {
            userId,
            postId,
            value: realValue
          });

          await tm
            .createQueryBuilder()
            .update(Post)
            .set({ points: () => `points + ${realValue}` })
            .where("post.id = :postId", { postId })
            .execute();
        });
      }

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null //null is allowed as no cursor on first run
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    //used to check  if there are more posts available after loadMore button pressed
    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    const posts = await getConnection().query(
      `
    
    select p.*
    from post p
    ${cursor ? `where p."createdAt" < $2` : ""}
    order by p."createdAt" DESC
    limit $1

    `,
      replacements
    );

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne //if not equal, there are no more posts available
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({
      ...input,
      creatorId: req.session.userId
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    try {
      const result = await Post.delete({ id, creatorId: req.session.userId });

      if (result.affected === 0) {
        //post not deleted but not due to error (e.g. id not found)
        return false;
      }
      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  }
}
