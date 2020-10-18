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
          if (post.voteStatus === 1) {
            return;
          }
          await vote({
            postId: post.id,
            value: 1,
          });
        }}
        variantColor={post.voteStatus == 1 ? "green" : undefined}
      />
      {post.points}
      <IconButton
        aria-label="downvote"
        icon="chevron-down"
        isLoading={fetching}
        onClick={async () => {
          if (post.voteStatus === -1) {
            return;
          }
          await vote({
            postId: post.id,
            value: -1,
          });
        }}
        variantColor={post.voteStatus == -1 ? "red" : undefined}
      />
    </Flex>
  );
};

export default VotePanel;
