import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMeQuery } from "../generated/graphql";

const useIsAuth = () => {
  const [{ data, fetching: isLoading }] = useMeQuery();

  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !data?.me) {
      router.replace("/login");
    }
  }, [data, router, isLoading]);
};

export default useIsAuth;
