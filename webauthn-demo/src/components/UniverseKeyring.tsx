import { Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useCeramic } from "../context/ceramic";
import { composeClient } from "../lib/composeDB";
import { Avatar } from "./Avatar";

type Node = {
  node: {
    rawId: string;
    publicKey: string;
  }
}

type AccountIndex = {
  edges?: Node[]
}

export const UniverseKeyring = ({ myPublicKey }: { myPublicKey: string }) => {
  const [isLoading, setLoading] = useState(false);
  const [keyring, setKeyring] = useState<Node[]>([]);
  const { session } = useCeramic();

  const loadKeyring = async () => {
    setLoading(true)
    if (session !== undefined) {
      // @TODO: Type the response.
      const response = await composeClient.executeQuery(`
        query {
          accountIndex(first: 5) {
            edges {
              node {
                rawId
                publicKey
              }
            }
          }
        }
      `);
      const accountIndex: AccountIndex = response?.data?.accountIndex;
      const keyring = accountIndex?.edges;
      setKeyring(keyring);
      console.log('🔑💍 Keyring', keyring);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadKeyring();
    return () => setKeyring([])
  }, [])


  return (
    <>
      {isLoading ? <>Loading...</> : keyring.map(({ node: { publicKey } }) =>
        <Flex
          key={publicKey}
          bg={myPublicKey == publicKey ? "green.900" : "gray.600"} // @TODO: Make bg dynamic based on theme.
          borderRadius="50%"
          p="2"
        >
          <Avatar address={publicKey} />
        </Flex>
      )}
    </>
  );

}