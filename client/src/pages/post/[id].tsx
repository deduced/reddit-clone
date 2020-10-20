import { Heading } from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import { Layout } from "../../components/Layout";
import { usePostQuery } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";

const Post: React.FC<{}> = ({}) => {
  const router = useRouter();

  const postId =
    typeof router.query.id === "string" ? parseInt(router.query.id) : -1;

  const [{ data, fetching: isFetching }] = usePostQuery({
    pause: postId === -1,
    variables: {
      id: postId,
    },
  });

  if (isFetching) {
    return (
      <Layout>
        <div>loading...</div>
      </Layout>
    );
  }

  return <Layout>{data?.post?.text}</Layout>;
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
