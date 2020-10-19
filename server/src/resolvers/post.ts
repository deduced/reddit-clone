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
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null, //null is allowed as no cursor on first run
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    //used to check  if there are more posts available after loadMore button pressed
    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];

    if (req.session.userId) {
      replacements.push(req.session.userId);
    }

    let cursorIndex = 3;
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
      cursorIndex = replacements.length;
    }

    const posts = await getConnection().query(
      `
    
    select p.*, 
    json_build_object(
      'id', u.id,
      'username', u.username,
      'email', u.email,
      'createdAt', u."createdAt",
      'updatedAt', u."updatedAt"
      
      ) creator,
      ${
        req.session.userId
          ? '(select value from upvote where "userId" = $2 and "postId" = p.id) "voteStatus"'
          : 'null as "voteStatus"'
      }
    from post p
    inner join public.user u on u.id = p."creatorId"
    ${cursor ? `where p."createdAt" < $${cursorIndex}` : ""}
    order by p."createdAt" DESC
    limit $1

    `,
      replacements
    );

    // const qb = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("p") //alias
    //   .innerJoinAndSelect("p.creator", "u", 'u.id = p."creatorId"')
    //   .orderBy('p."createdAt"', "DESC")
    //   .take(realLimitPlusOne); //recommended rather than limit for pagination https://typeorm.io/#select-query-builder/adding-limit-expression

    // if (cursor) {
    //   qb.where(`p."createdAt" < :cursor`, {
    //     cursor: new Date(parseInt(cursor))
    //   });
    // }

    // const posts = await qb.getMany();

    // console.log("Posts: ", posts);

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne //if not equal, there are no more posts available
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id") id: number): Promise<Post | undefined> {
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
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(id);

    if (!post) {
      return null;
    }

    if (typeof title != undefined) {
      await Post.update({ id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id") id: number): Promise<boolean> {
    try {
      await Post.delete(id);
    } catch (error) {
      console.error(error.message);
      return false;
    }

    return true;
  }
}
