import { Box, Flex, SimpleGrid } from "@chakra-ui/react"
import { useEffect, useState } from "react";
import { useClub } from "../context/club";
import { truncate } from "../helpers/strings";
import { AvatarWithTitle } from "./AvatarWithTitle";

export const ClubMembers = ({ publicKeyAsHex, keysAsParameter = undefined }: { publicKeyAsHex: string, keysAsParameter?: string[] }) => {
  const [isLoading, setLoading] = useState(false);
  const [keys, setKeys] = useState([]);

  const { keys: existingKeys } = useClub();

  useEffect(() => {
    existingKeys && existingKeys.length > 0 && setKeys(existingKeys);
    if (keysAsParameter) setKeys(keysAsParameter);
  }, [existingKeys])

  return (
    <SimpleGrid columns={[5,5,8,10]} justifyContent="space-around" width="100%">
      {isLoading ? <>Loading...</> : keys.map(publicKey => {
        const isSelfKey = publicKeyAsHex === publicKey;
        console.log(`(đ, âšī¸) SelfKey: ${truncate(publicKeyAsHex)}, Current Key: ${truncate(publicKey)}`);
        return (
          <Flex
            position="relative"
            key={publicKey}
            // bg={isSelfKey ? "green.900" : "gray.600"} // @TODO: Make bg dynamic based on theme.
            p="1"
          >
            {isSelfKey && <Box top="2.5" right="20%" width="10px" height="10px" background="green.900" pos="absolute" borderRadius="50%">{' '}</Box>}
            <AvatarWithTitle publicKeyAsHex={publicKey} title={isSelfKey ? '(You)' : `${truncate(publicKey)}`} />
          </Flex>
        )
      }
      )}
    </SimpleGrid>
  )
}