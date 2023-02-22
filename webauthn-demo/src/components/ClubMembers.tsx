import { Box, Flex } from "@chakra-ui/react"
import { useEffect, useState } from "react";
import { useClub } from "../context/club";
import { AvatarWithTitle } from "./AvatarWithTitle";

export const ClubMembers = ({ publicKeyAsHex }: { publicKeyAsHex: string }) => {
  const [isLoading, setLoading] = useState(false);
  const [keys, setKeys] = useState([]);

  const { keys: existingKeys } = useClub();

  useEffect(() => {
    existingKeys && existingKeys.length > 0 && setKeys(existingKeys);
  }, [existingKeys])

  return (
    <>
      {isLoading ? <>Loading...</> : keys.map(publicKey => {
        const isSelfKey = publicKeyAsHex === publicKey;
        return (
          <Flex
            position="relative"
            key={publicKey}
            // bg={isSelfKey ? "green.900" : "gray.600"} // @TODO: Make bg dynamic based on theme.
            p="1"
          >
            {isSelfKey && <Box top="2.5" right="0" width="10px" height="10px" background="green.900" pos="absolute" borderRadius="50%">{' '}</Box>}
            <AvatarWithTitle publicKeyAsHex={publicKey} title={isSelfKey ? '(You)' : `${publicKey.substr(0, 4)}...`} />
          </Flex>
        )
      }
      )}
    </>
  )
}