import { Flex } from "@chakra-ui/react"
import { useEffect, useState } from "react";
import { useClub } from "../context/club";
import { Avatar } from "./Avatar"

export const ClubMembers = () => {
  const [isLoading, setLoading] = useState(false);
  const [keys, setKeys] = useState([]);

  const { keys: existingKeys } = useClub();

  useEffect(() => {
    existingKeys && existingKeys.length > 0 && setKeys(existingKeys);
  }, [existingKeys])

  return (
    <>
      {isLoading ? <>Loading...</> : keys.map(publicKey =>
        <Flex
          key={publicKey}
          bg={"My Public Key" == publicKey ? "green.900" : "gray.600"} // @TODO: Make bg dynamic based on theme.
          borderRadius="50%"
          p="2"
        >
          <Avatar address={publicKey} />
        </Flex>
      )}
    </>
  )
}