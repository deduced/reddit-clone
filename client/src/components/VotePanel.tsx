import { Flex, IconButton } from "@chakra-ui/core";
import React from "react";
import { PostFieldsFragment, useVoteMutation } from "../generated/graphql";

interface VotePanelProps {
  post: PostFieldsFragment;
}

const VotePanel: React.FC<VotePanelProps> = ({ post }) => {
  const [{ fetching }, vote] = useVoteMutation();

  return (
    <Flex alignItems="center" direction="column" mr={4}>
      <IconButton
        aria-label="upvote"
        icon="chevron-up"
        isLoading={fetching}
        onClick={async () => {
          await vote({
            postId: post.id,
            value: 1,
          });
        }}
      />
      {post.points}
      <IconButton
        aria-label="downvote"
        icon="chevron-down"
        isLoading={fetching}
        onClick={async () => {
          await vote({
            postId: post.id,
            value: -1,
          });
        }}
      />
    </Flex>
  );
};

export default VotePanel;
