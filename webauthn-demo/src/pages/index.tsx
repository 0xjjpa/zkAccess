import {
  Link as ChakraLink,
  Text,
  Button,
  Code,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react";
import { useAccount } from 'wagmi'
import Image from "next/image";
import { useEffect, useState } from "react";

import { Hero } from "../components/Hero";
import { Container } from "../components/Container";
import { Main } from "../components/Main";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import { Footer } from "../components/Footer";
import { ConnectButton } from "../components/ConnectButton";
import { LOADING_MESSAGE, Stage } from "../constants/stages";
import { useCeramic } from "../context/ceramic";
import { ClubButton } from "../components/ClubButton";
import { ClubsContainer } from "../components/ClubsContainer";
import { RegisterButton } from "../components/RegisterButton";
import { SelfRegisterButton } from "../components/SelfRegisterButton";
import { ClubMembers } from "../components/ClubMembers";
import { DisplayButton } from "../components/DisplayButton";
import { loadAccount } from "../lib/sdk";
import { hex2buf } from "../helpers/buffers";
import { VerifyButton } from "../components/VerifyButton";


const Index = () => {
  // @TODO: Identify if this is still needed.
  // const [isLoadingProcess, setLoadingProcess] = useState(false);
  // const [isAssertationValid, setAssertation] = useState<boolean>();
  const [isLoadingStage, setLoadingStage] = useState(false);
  const [isCeramicNodeOffline, setIsCeramicNodeOffline] = useState(false);
  const [currentStage, setStage] = useState<Stage>(Stage.STAGE_0);
  const [rawId, setRawId] = useState<ArrayBuffer>();
  const [publicKey, setPublicKey] = useState<ArrayBuffer>();
  const [publicKeyAsHex, setPublicKeyAsHex] = useState<string>();

  const { isConnected } = useAccount();
  const { session } = useCeramic();

  const hasWalletConnected = isConnected;

  // @TODO: Identify whether this is still needed.
  // useEffect(() => {
  //   isAssertationValid != undefined &&
  //     setStage(
  //       isAssertationValid
  //         ? Stage.STAGE_SUCCESS_ASSERTATION
  //         : Stage.STAGE_FAILED_ASSERTATION
  //     );
  //   setLoadingProcess(false);
  // }, [isAssertationValid]);

  const loadRawId = async () => {
    console.log('🪪 Loading credentials from user...', session.did.parent)
    const accountResponse = await loadAccount(session, setIsCeramicNodeOffline);
    if (accountResponse?.node?.account?.rawId) {
      const rawId = hex2buf(accountResponse?.node?.account?.rawId);
      const publicKeyAsHex = accountResponse?.node?.account?.publicKey
      const publicKey = hex2buf(publicKeyAsHex);
      console.log('🪪 Credential found!', rawId)
      setPublicKeyAsHex(publicKeyAsHex);
      setRawId(rawId);
      setPublicKey(publicKey);
    }
  }

  useEffect(() => {
    hasWalletConnected && setStage(Stage.STAGE_1);
  }, [hasWalletConnected])

  useEffect(() => {
    session && loadRawId();
  }, [session])

  return (
    <Container height="100vh">
      <Hero />
      <Main>
        <ConnectButton />
        <Text color="text" fontFamily="mono" textAlign="center">
          Create clubs and add people by scanning their <Code>zKeys</Code>.
          Verify membership via zero-knowledge proofs.
        </Text>
        {isCeramicNodeOffline && <Code p="2">❗️ Ceramic endpoint offline. Try later or reach @0xjjpa on Twitter.</Code>}
        {!isCeramicNodeOffline && hasWalletConnected &&
          <>
            <ClubsContainer
              setStage={setStage}
              setup={
                <SimpleGrid spacing={2} columns={1}>
                  <ClubButton />
                  <Button size="sm" disabled>Load Club 📀 (WIP)</Button>
                </SimpleGrid>
              }
              manage={
                <SimpleGrid spacing={2} columns={[1, 1, 1, 1]}>
                  {hasWalletConnected &&
                    <>
                      <SimpleGrid spacing={2} columns={2}>
                        <SelfRegisterButton setRawId={setRawId} setPublicKey={setPublicKey} rawId={rawId} publicKey={publicKey} />
                        <DisplayButton publicKey={publicKey} />
                        <RegisterButton />
                        <VerifyButton />
                      </SimpleGrid>
                      <SimpleGrid spacing={2} columns={[1, 1, 1, 1]}>
                        <Flex justifyContent="center" mt="5" flexDirection="column">
                          <Text color="text" fontFamily="mono" textAlign="center">
                            Members
                          </Text>
                          <Flex justifyContent="space-between" alignItems="center" my="2">
                            <ClubMembers publicKeyAsHex={publicKeyAsHex} />
                          </Flex>
                        </Flex>
                      </SimpleGrid>
                    </>
                  }
                </SimpleGrid>
              } />
            <Text color="text" fontSize="sm">
              {isLoadingStage ? LOADING_MESSAGE : currentStage}
            </Text>
          </>
        }


      </Main>

      <DarkModeSwitch />
      <Footer mt="10">
        <Flex direction="column">
          <Flex justifyContent="center" fontFamily="mono" fontSize="xs">
            <Text mr="2">
              <ChakraLink href="https://github.com/0xjjpa/zkAccess" isExternal>
                Open source
              </ChakraLink>. Built with <ChakraLink href="https://github.com/cloudflare/zkp-ecdsa" isExternal>
                zkp-ecdsa
              </ChakraLink>
              .
            </Text>
          </Flex>
          <Flex justifyContent="center" fontFamily="mono" fontSize="xs">
            <Text mr="2">
              Crafted by{' '}
              <ChakraLink href="https://twitter.com/0xjjpa" isExternal>
                0xjjpa
              </ChakraLink>
              .
            </Text>
          </Flex>
          <Flex justifyContent="center" mt="2">
            <Text>Part of </Text>
            <Flex direction="row" mx="2">
              <Image
                alt="Ceramic"
                width={24}
                height={18}
                src="/ceramic.png"
              />
              <Text fontWeight="900" ml="1">
                <ChakraLink href="https://ceramic.network" isExternal>
                  Ceramic
                </ChakraLink>
              </Text>
              ’s
            </Flex>
            {" "}
            <Text>
              <ChakraLink href="https://blog.ceramic.network/introducing-ceramic-grants-origins-cohort/" isExternal>
                origin cohort
              </ChakraLink>.
            </Text>
          </Flex>
        </Flex>
      </Footer>
    </Container>
  );
};

export default Index;
