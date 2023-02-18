import { Stack, StackProps } from '@chakra-ui/react'

export const Main = (props: StackProps) => (
  <Stack
    spacing="1.5rem"
    width="100%"
    maxWidth="48rem"
    mt="-10vh"
    pt="4rem"
    px="1rem"
    {...props}
  />
)
