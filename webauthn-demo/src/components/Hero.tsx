import { Flex, Heading } from '@chakra-ui/react'

export const Hero = ({ title }: { title: string }) => (
  <Flex
    justifyContent="center"
    alignItems="center"
    height="30vh"
    bgGradient="linear(to-l, heroGradientStart, heroGradientEnd)"
    bgClip="text"
    mt="5"
  >
    <Heading fontSize="6vw">{title}</Heading>
  </Flex>
)

Hero.defaultProps = {
  title: 'zkAccess',
}
