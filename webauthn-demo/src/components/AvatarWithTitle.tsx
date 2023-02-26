import { Flex, Text, Box } from "@chakra-ui/react"
import { Avatar } from "./Avatar"

export const AvatarWithTitle = ({ publicKeyAsHex, title = "(You)" }: { publicKeyAsHex: string, title: string }) => {
  return (
    <Flex justifyContent="center" mt="5" direction="column">
      <Box m="auto">
        <Avatar address={publicKeyAsHex} />
      </Box>
      <Text fontSize="xs" mt="1" fontFamily="mono">{title}</Text>
    </Flex>
  )
}