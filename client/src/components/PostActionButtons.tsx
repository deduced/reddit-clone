import { IconButton } from "@chakra-ui/core";
import React from "react";
import NextLink from "next/link";
import { useDeletePostMutation } from "../generated/graphql";

interface PostActionButtonsProps {
  id: number;
}

const PostActionButtons: React.FC<PostActionButtonsProps> = ({ id }) => {
  const [, deletePost] = useDeletePostMutation();
  return (
    <>
      <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
        <IconButton aria-label="edit post" icon="edit" mr={2} />
      </NextLink>
      <IconButton
        aria-label="delete post"
        icon="delete"
        onClick={() => {
          deletePost({ id });
        }}
      />
    </>
  );
};

export default PostActionButtons;
