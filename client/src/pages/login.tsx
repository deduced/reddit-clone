import React from "react";
import { Formik, Form } from "formik";
import { Box, Button, Flex, Link } from "@chakra-ui/core";
import Wrapper from "../components/Wrapper";
import InputField from "../components/InputField";
import { useLoginMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";

const Login: React.FC<{}> = ({}) => {
  const router = useRouter();
  const [, login] = useLoginMutation();

  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ usernameOrEmail: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          const response = await login(values);

          if (response.data?.login.errors) {
            setErrors(toErrorMap(response.data.login.errors));
          } else if (response.data?.login.user) {
            //redirect is query param set in hooks/useIsAuth
            router.query.redirect
              ? router.push(String(router.query?.redirect))
              : router.push("/");
          } else {
            console.error(response);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              label="Username or Email"
              name="usernameOrEmail"
              placeholder="username or email"
            />
            <Box mt={4}>
              <InputField
                label="Password"
                name="password"
                placeholder="password"
                type="password"
              />
            </Box>
            <Flex mt={4} alignItems="center" justifyContent="space-between">
              <Button
                isLoading={isSubmitting}
                variantColor="teal"
                type="submit"
              >
                Login
              </Button>
              <NextLink href="forgot-password">
                <Link>Forgot password?</Link>
              </NextLink>
            </Flex>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Login);
