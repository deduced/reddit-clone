import { Flex, IconButton } from "@chakra-ui/core";
import React from "react";
import { PostsQuery } from "../generated/graphql";

interface VotePanelProps {
  post: PostsQuery["posts"]["posts"][0];
}

export const VotePanel: React.FC<VotePanelProps> = ({ post }) => {
  return (
    <Flex alignItems="center" direction="column" mr={4}>
      <IconButton aria-label="upvote" icon="chevron-up" />
      {post.points}
      <IconButton aria-label="downvote" icon="chevron-down" />
    </Flex>
  );
};
