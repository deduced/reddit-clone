import React from "react";
import { Box } from "@chakra-ui/core";

export type WrapperVariant = "small" | "regular";
interface WrapperProps {
  variant?: WrapperVariant;
}

const Wrapper: React.FC<WrapperProps> = ({ children, variant = "regular" }) => {
  return (
    <Box
      maxW={variant === "regular" ? "800px" : "400px"}
      mt={8}
      mx="auto"
      w="100%"
    >
      {children}
    </Box>
  );
};

export default Wrapper;
