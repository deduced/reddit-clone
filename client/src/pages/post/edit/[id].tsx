import { Box, Button, Flex } from "@chakra-ui/core";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import InputField from "../../../components/InputField";
import { Layout } from "../../../components/Layout";
import { useUpdatePostMutation } from "../../../generated/graphql";
import { createUrqlClient } from "../../../utils/createUrqlClient";
import { useGetPostFromUrl } from "../../../utils/useGetPostFromUrl";

interface EditPost {}

const EditPost: React.FC<EditPost> = ({}) => {
  const router = useRouter();

  const { postIdFromRouter, response } = useGetPostFromUrl();
  const [{ data, fetching: isFetching }] = response;

  const [, updatePost] = useUpdatePostMutation();

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
        <Box>Could not find post</Box>
      </Layout>
    );
  }

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: data.post.title, text: data.post.text }}
        onSubmit={async (values) => {
          const { error } = await updatePost({
            id: postIdFromRouter,
            title: values.title,
            text: values.text,
          });

          if (error) console.error("error: ", error);

          //errors are handled globally via ErrorExchange in createUrqlClient.ts
          if (!error) {
            router.back();
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField label="Title" name="title" placeholder="post title" />
            <Box mt={4}>
              <InputField
                label="Body"
                name="text"
                placeholder="post body..."
                textarea
              />
            </Box>
            <Flex mt={4} alignItems="center" justifyContent="space-between">
              <Button
                isLoading={isSubmitting}
                variantColor="teal"
                type="submit"
              >
                Update Post
              </Button>
            </Flex>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(EditPost);
