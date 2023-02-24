import { Flex, Text } from "@chakra-ui/react"
import { truncate } from "../helpers/strings"
import { AvatarWithTitle } from "./AvatarWithTitle"

export const RegisterButtonModalSuccess = ({ publicKeyAsQRCodedHex }: { publicKeyAsQRCodedHex: string }) => {
  return (<>
    <Text fontSize="sm">✅ We have found the following zKey</Text>
    <Flex
      justifyContent="center"
      position="relative"
      p="1"
    >
      <AvatarWithTitle title={truncate(publicKeyAsQRCodedHex)} publicKeyAsHex={publicKeyAsQRCodedHex} />
    </Flex>
  </>)
}