import { Box, Button, Link } from "@chakra-ui/core";
import { Formik, Form } from "formik";
import { withUrqlClient } from "next-urql";
import React, { useState } from "react";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { useForgotPasswordMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";

const forgotPassword: React.FC<{}> = ({}) => {
  const [isComplete, setComplete] = useState(false);
  const [, forgotPassword] = useForgotPasswordMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: "" }}
        onSubmit={async (values) => {
          await forgotPassword(values);
          setComplete(true);
        }}
      >
        {({ isSubmitting }) =>
          isComplete ? (
            <>
              <Box mb={4}>
                If an account with that email exists, we sent you a reset
                password email.
              </Box>
              <NextLink href="/">
                <Link>Take me back Home</Link>
              </NextLink>
            </>
          ) : (
            <Form>
              <InputField
                label="Email"
                name="email"
                placeholder="email"
                type="email"
              />
              <Button
                mt={2}
                isLoading={isSubmitting}
                variantColor="teal"
                type="submit"
              >
                Forgot password
              </Button>
            </Form>
          )
        }
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(forgotPassword);
