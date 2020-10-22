import { useRouter } from "next/router";
import { UseQueryResponse } from "urql";
import { PostQuery, usePostQuery } from "../generated/graphql";

interface PostWithRouterData {
  postIdFromRouter: number;
  response: UseQueryResponse<PostQuery>;
}

export const useGetPostFromUrl = () => {
  const router = useRouter();

  const postId =
    typeof router.query.id === "string" ? parseInt(router.query.id) : -1;

  const response: UseQueryResponse<PostQuery> = usePostQuery({
    pause: postId === -1,
    variables: {
      id: postId,
    },
  });

  const postWithRouterData: PostWithRouterData = {
    postIdFromRouter: postId,
    response,
  };
  console.log("postWithRouterData", postWithRouterData);

  return postWithRouterData;
};
