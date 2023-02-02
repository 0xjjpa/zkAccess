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
import { useEffect, useState } from "react";
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


const Index = () => {
  const [isLoadingProcess, setLoadingProcess] = useState(false);
  const [isLoadingStage, setLoadingStage] = useState(false);
  const [credential, setCredential] = useState<PublicKeyCredential>();
  const [key, setKey] = useState<bigint>();
  const [isAssertationValid, setAssertation] = useState<boolean>();
  const [currentStage, setStage] = useState<Stage>(Stage.STAGE_0);
  const [session, setSession] = useState<DIDSession | null>(null);
  const [keyring, setKeys] = useState<bigint[]>(EMPTY_KEYS);

  const { address, connector } = useAccount();

  const getStorageKey = (address: string) => `did-session:${address}`;

  useEffect(() => {
    const loadAccountId = async () => {
      console.log("👤 Loading account Id...")
      if (!address) return;
      const sessionString = localStorage.getItem(getStorageKey(address));
      if (sessionString) {
        console.log("👤 Session found, loading from string...", sessionString);
        const session = await DIDSession.fromSession(sessionString);
        if (session && session.hasSession && !session.isExpired) {
          setSession(session);
          return;
        }
      }
      console.log("👤 Session not found, connecting...");
      await connect();
    };
    const connect = async () => {
      if (!address || !connector) return;
      const ethProvider = await connector.getProvider();

      const accountId = await getAccountId(ethProvider, address);
      const authMethod = await EthereumWebAuth.getAuthMethod(
        ethProvider,
        accountId
      );
      console.log("👤 Connecting...", accountId);
      const session = await DIDSession.authorize(authMethod, {
        resources: [`ceramic://*`],
        // 30 days sessions
        expiresInSecs: 60 * 60 * 24 * 30,
      });

      // Store the session in local storage
      const sessionString = session.serialize();
      console.log("👤 Session obtained, serializing", sessionString);
      localStorage.setItem(getStorageKey(address), sessionString);

      setSession(session);
    };
    false && connector && address && loadAccountId(); // @TODO: Added to avoid retrigger...
  }, [connector, address])

  useEffect(() => {
    console.log("🪪 Ceramic DID Session ready", session);
  }, [session])

  const credentialsHandler = async (email: string, name: string) => {
    setLoadingProcess(true);
    setLoadingStage(true);
    const [credential] = await Promise.all([
      createNavigatorCredentials(email, name),
      waitPromise(STAGES[Stage.STAGE_1]),
    ]);
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

  return (
    <Container height="100vh">
      <Hero />
      <Main>
        <ConnectButton />
        <Text color="text" fontFamily="mono">
          A zero-knowledge app to verify membership without
          disclosing who is requesting access.
        </Text>
        <SimpleGrid spacing={2} columns={[1, 1, 2, 2]}>
          <SimpleGrid spacing={2} columns={2}>
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
              {!credential ? "Register 🔑" : "Re-add key 🔑"}
            </Button>
            <Button
              size="sm"
              isLoading={isLoadingStage}
              disabled={!credential}
              onClick={() => loadCredentialsHandler(credential)}
            >
              {`Proof ${isAssertationValid == undefined
                ? "🧾"
                : isAssertationValid
                  ? "✅"
                  : "❌"
                }`}
            </Button>
          </SimpleGrid>
          <Flex justifyContent="center" mt="5">
            <Text color="text" fontFamily="mono">
              Universe
            </Text>
          </Flex>

          <Flex justifyContent="space-between" alignItems="center" my="2">
            {keyring.map((keyAsInt) => (
              <Flex
                key={Number(keyAsInt)}
                bg={key == keyAsInt ? "green.900" : "gray.600"} // @TODO: Make bg dynamic based on theme.
                borderRadius="50%"
                p="2"
                onClick={() => {
                  if (key == keyAsInt) {
                    setKeys(keyring.filter((key) => key != keyAsInt));
                  }
                }}
              >
                <Avatar address={`${Number(keyAsInt)}`} />
              </Flex>
            ))}
          </Flex>
        </SimpleGrid>
        <Text color="text">
          {isLoadingStage ? LOADING_MESSAGE : currentStage}
        </Text>
      </Main>

      <DarkModeSwitch />
      <Footer>
        <Flex direction="column">
          <Flex justifyContent="center" fontFamily="mono">
            <Text>Built with 🔒 by </Text>
            <ChakraLink href="https://twitter.com/0xjjpa" isExternal>
              0xjjpa
            </ChakraLink>
            .
          </Flex>
          <Flex justifyContent="center">
            <Text>Part of </Text>
            <ChakraLink href="https://ceramic.network/" isExternal>
              <Flex direction="row" mx="2">
                <Image
                  alt="Ceramic"
                  width={24}
                  height={18}
                  src="/ceramic.png"
                />
                <Text fontWeight="900" ml="1">
                  Ceramic
                </Text>
              </Flex>
            </ChakraLink>{" "}
            <Text>Origin cohort.</Text>
          </Flex>
        </Flex>
      </Footer>
    </Container>
  );
};

export default Index;
