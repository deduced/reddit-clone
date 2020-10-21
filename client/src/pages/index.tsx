import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Link,
  Stack,
  Text,
} from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { Layout } from "../components/Layout";
import VotePanel from "../components/VotePanel";
import {
  useDeletePostMutation,
  useMeQuery,
  usePostsQuery,
} from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { isServer } from "../utils/isServer";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as string | null,
  });

  const [{ data, fetching: isLoading }] = usePostsQuery({
    variables,
  });

  const [{ data: userData }] = useMeQuery();
  const userId = userData?.me?.id;

  const [, deletePost] = useDeletePostMutation();

  if (!isLoading && !data) {
    return (
      <Text color="#eb0000">Something went wrong! Reload and try again</Text>
    );
  }

  return (
    <Layout>
      {isLoading && !data && <div>loading...</div>}

      {!isLoading && data && (
        <Stack spacing={8}>
          {data.posts.posts.map((post) =>
            //when invalidating cache after a post deletion, a post may be null
            //so check for null and show nothing.
            !post ? null : (
              <Flex
                alignItems="center"
                borderWidth="1px"
                key={post.id}
                p={5}
                shadow="md"
              >
                <VotePanel post={post} />
                <Box>
                  <NextLink href="/post/[id]" as={`/post/${post.id}`}>
                    <Link>
                      <Heading fontSize="xl">{post.title}</Heading>
                    </Link>
                  </NextLink>
                  <Text>posted by {post.creator.username}</Text>
                  <Text mt={4}>{post.textSnippet}</Text>
                </Box>

                <IconButton
                  aria-label="delete post"
                  icon="delete"
                  isDisabled={post.creator.id !== userId}
                  marginLeft="auto"
                  variantColor="red"
                  onClick={() => {
                    deletePost({ id: post.id });
                  }}
                />
              </Flex>
            )
          )}
        </Stack>
      )}

      {data && data.posts.hasMore && (
        <Flex justifyContent="center">
          <Button
            onClick={() =>
              setVariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              })
            }
            isLoading={isLoading}
            my={8}
          >
            load more
          </Button>
        </Flex>
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
