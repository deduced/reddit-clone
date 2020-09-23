import { Box, Button, Flex } from "@chakra-ui/core";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import InputField from "../components/InputField";
import { Layout } from "../components/Layout";
import { useCreatePostMutation } from "../generated/graphql";
import useIsAuth from "../hooks/useIsAuth";
import { createUrqlClient } from "../utils/createUrqlClient";

const CreatePost: React.FC<{}> = ({}) => {
  const router = useRouter();
  useIsAuth(); //redirect user to login if not authenticated

  const [, createPost] = useCreatePostMutation();
  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values) => {
          const { error } = await createPost({ input: values });
          console.error("error: ", error);

          //errors are handled globally via ErrorExchange in createUrqlClient.ts
          if (!error) {
            router.push("/");
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
                Create Post
              </Button>
            </Flex>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(CreatePost);
