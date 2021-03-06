import React from "react";
import { Box, Link, Flex, Button, Heading } from "@chakra-ui/core";
import NextLink from "next/link";
import { useMeQuery, useLogoutMutation } from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { useRouter } from "next/router";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const router = useRouter();
  const [{ fetching: isFetchingLogout }, logout] = useLogoutMutation();
  const [{ data, fetching: isFetching }] = useMeQuery({
    pause: isServer(), //do not run query if on server (during SSR)
  });

  let body = null;
  //Data loading
  if (isFetching) {
    //User is not logged in
    body = "...loading";
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="login">
          <Link mr={2}>Login</Link>
        </NextLink>
        <NextLink href="register">
          <Link>Register</Link>
        </NextLink>
      </>
    );
    //User is logged in
  } else {
    body = (
      <Flex alignItems="center">
        <Button as={Link} mr={2}>
          <NextLink href="/create-post">
            <Link>create post</Link>
          </NextLink>
        </Button>
        <Box mr={2}>{data.me.username}</Box>
        <Button
          isLoading={isFetchingLogout}
          onClick={async () => {
            await logout();
            router.reload();
          }}
          variant="link"
        >
          Logout
        </Button>
      </Flex>
    );
  }

  return (
    <Flex
      justifyContent="center"
      position="sticky"
      top={0}
      bg="tan"
      p={4}
      zIndex={1}
    >
      <Flex flex={1} maxWidth={800}>
        <NextLink href="/">
          <Link>
            <Heading>Reddit-Clone</Heading>
          </Link>
        </NextLink>
        <Box ml={"auto"}>{body}</Box>
      </Flex>
    </Flex>
  );
};
