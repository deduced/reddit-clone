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
import { VotePanel } from "../components/VotePanel";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as string | null,
  });

  const [{ data, fetching: isLoading }] = usePostsQuery({
    variables,
  });

  if (!isLoading && !data) {
    return (
      <Text color="#eb0000">Something went wrong! Reload and try again</Text>
    );
  }

  return (
    <Layout>
      <Flex justifyContent="space-between" alignItems="baseline">
        <Heading mb={4}>Reddit-Clone</Heading>
        <NextLink href="create-post">
          <Link>create post</Link>
        </NextLink>
      </Flex>
      {isLoading && !data && <div>loading...</div>}

      {!isLoading && data && (
        <Stack spacing={8}>
          {data.posts.posts.map((post) => (
            <Flex
              key={post.id}
              p={5}
              shadow="md"
              borderWidth="1px"
              alignItems="center"
            >
              <VotePanel post={post} />
              <Box>
                <Heading fontSize="xl">{post.title}</Heading>
                <Text>posted by {post.creator.username}</Text>
                <Text mt={4}>{post.textSnippet}</Text>
              </Box>
            </Flex>
          ))}
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
