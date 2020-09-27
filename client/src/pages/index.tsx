import { Box, Button, Flex, Heading, Link, Stack, Text } from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React from "react";
import { Layout } from "../components/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  const [{ data, fetching: isLoading }] = usePostsQuery({
    variables: {
      limit: 10,
    },
  });

  if (!isLoading && !data) {
    return (
      <Text color={"#ff000"}>Something went wrong! Reload and try again</Text>
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
          {data.posts.map((post) => (
            <Box key={post.id} p={5} shadow="md" borderWidth="1px">
              <Heading fontSize="xl">{post.title}</Heading>
              <Text mt={4}>{post.textSnippet}</Text>
            </Box>
          ))}
        </Stack>
      )}

      {data && (
        <Flex justifyContent="center">
          <Button isLoading={isLoading} my={8}>
            load more
          </Button>
        </Flex>
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
