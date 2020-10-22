import { Box, Heading } from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import React from "react";
import { Layout } from "../../components/Layout";
import PostActionButtons from "../../components/PostActionButtons";
import { useMeQuery } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { useGetPostFromUrl } from "../../utils/useGetPostFromUrl";

const Post: React.FC<{}> = ({}) => {
  const [{ data: currentUserData }] = useMeQuery();

  const { response } = useGetPostFromUrl();
  const [{ data, fetching: isFetching }] = response;

  if (isFetching) {
    return (
      <Layout>
        <div>loading...</div>
      </Layout>
    );
  }

  if (!data?.post) {
    return (
      <Layout>
        <Box>Could not find Post!</Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box mb={4}>
        <Heading mb={4}>{data.post.title}</Heading>
        {data.post.text}
      </Box>
      {currentUserData?.me?.id === data.post.creator.id && (
        <PostActionButtons id={data.post.id} />
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
