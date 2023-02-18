import {
  Link as ChakraLink,
  Text,
  Code,
  Button,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react";
import { useAccount } from 'wagmi'
import { keyToInt } from "@cloudflare/zkp-ecdsa";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { DIDSession } from 'did-session'
import { EthereumWebAuth, getAccountId } from '@didtools/pkh-ethereum'

import { Hero } from "../components/Hero";
import { Container } from "../components/Container";
import { Main } from "../components/Main";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import { Footer } from "../components/Footer";
import { importPublicKey } from "../lib/zkecdsa";
import { ConnectButton } from "../components/ConnectButton";
import { Avatar } from "../components/Avatar";
import { createNavigatorCredentials, loadNavigatorCredentials } from "../lib/webauthn";
import { LOADING_MESSAGE, Stage, STAGES } from "../constants/stages";
import { waitPromise, delay } from "../helpers/promises";
import { EMPTY_KEYS } from "../constants/zkecdsa";
import { USER } from "../constants/webauthn";
import { composeClient } from "../lib/composeDB";
import { useCeramic } from "../context/ceramic";
import { buf2hex } from "../helpers/buffers";
import { UniverseKeyring } from "../components/UniverseKeyring";


const Index = () => {
  const [isLoadingProcess, setLoadingProcess] = useState(false);
  const [isLoadingStage, setLoadingStage] = useState(false);
  const [credential, setCredential] = useState<PublicKeyCredential>();
  const [key, setKey] = useState<bigint>();
  const [isAssertationValid, setAssertation] = useState<boolean>();
  const [currentStage, setStage] = useState<Stage>(Stage.STAGE_0);
  const [keyring, setKeys] = useState<bigint[]>(EMPTY_KEYS);

  const { session } = useCeramic();
  const { address } = useAccount();

  const hasWalletConnected = !!address;

  useEffect(() => {
    console.log('🔑 Public Key Data', key);
  }, [key]);

  const updateAccount = async (rawId: string, publicKey: string) => {
    if (session !== undefined) {
      const update = await composeClient.executeQuery(`
        mutation {
          createAccount(input: {
            content: {
              rawId: "${rawId}"
              publicKey: "${publicKey}"
            }
          }) 
          {
            document {
              rawId
              publicKey
            }
          }
        }
      `);
    }
  }

  const credentialsHandler = async (email: string, name: string) => {
    setLoadingProcess(true);
    setLoadingStage(true);
    const [credential] = await Promise.all([
      createNavigatorCredentials(email, name),
      waitPromise(STAGES[Stage.STAGE_1]),
    ]);
    const publicKey = (credential.response as AuthenticatorAttestationResponse).getPublicKey();
    await updateAccount(buf2hex(credential.rawId), buf2hex(publicKey));
    setLoadingStage(false);
    setStage(Stage.STAGE_1);
    delay(async () => {
      const key = await importPublicKey(credential);
      setKey(await keyToInt(key));
      setCredential(credential);
    });
  };

  const loadCredentialsHandler = async (credential: PublicKeyCredential) => {
    setLoadingStage(true);
    const [assertation] = await Promise.all([
      loadNavigatorCredentials(credential, keyring),
      waitPromise(STAGES[Stage.STAGE_2]),
    ]);
    setLoadingStage(false);
    setStage(Stage.STAGE_2);
    delay(() => setAssertation(assertation));
  };

  useEffect(() => {
    console.log("🪪 Credential Stored", credential);
    setLoadingProcess(false);
    credential && key && setKeys([key].concat(EMPTY_KEYS));
  }, [credential, key]);

  useEffect(() => {
    isAssertationValid != undefined &&
      setStage(
        isAssertationValid
          ? Stage.STAGE_SUCCESS_ASSERTATION
          : Stage.STAGE_FAILED_ASSERTATION
      );
    setLoadingProcess(false);
  }, [isAssertationValid]);

  useEffect(() => {
    hasWalletConnected && setStage(Stage.STAGE_1);
  }, [hasWalletConnected])

  return (
    <Container height="100vh">
      <Hero />
      <Main>
        {/* <ConnectButton /> */}
        <Text color="text" fontFamily="mono" textAlign="center">
          Create clubs and add people by scanning their IDs.
          Verify membership without disclosing your identity.
        </Text>
        {hasWalletConnected && <SimpleGrid spacing={2} columns={[1, 1, 1, 1]}>
          {hasWalletConnected &&
            <SimpleGrid spacing={2} columns={1}>
              <Button
                size="sm"
                disabled={!credential ? false : keyring[0] == key ? true : false}
                isLoading={isLoadingProcess}
                onClick={() => {
                  !credential
                    ? credentialsHandler(USER.email, USER.name)
                    : setKeys([key].concat(EMPTY_KEYS));
                }}
              >
                {!credential ? "Register 🔑" : "View key 🔑"}
              </Button>
              <Button
                size="sm"
                isLoading={isLoadingStage}
                disabled={!credential}
                onClick={() => loadCredentialsHandler(credential)}
              >
                {`Access ${isAssertationValid == undefined
                  ? "🧾"
                  : isAssertationValid
                    ? "✅"
                    : "❌"
                  }`}
              </Button>
            </SimpleGrid>
          }

          {/* <SimpleGrid spacing={2} columns={[1, 1, 1, 1]}>
            <Flex justifyContent="center" mt="5" flexDirection="column">
              <Text color="text" fontFamily="mono" textAlign="center">
                Current Club
              </Text>
              <Flex justifyContent="space-between" alignItems="center" my="2">
                <UniverseKeyring myPublicKey={"hello"} />
              </Flex>
            </Flex>
          </SimpleGrid> */}
        </SimpleGrid>
        }
        <Text color="text" fontSize="sm">
          {isLoadingStage ? LOADING_MESSAGE : currentStage}
        </Text>
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
          <Flex justifyContent="center" mt="5">
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
