import {
  Link as ChakraLink,
  Text,
  Code,
  Button,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react";
import { useAccount, useProvider } from 'wagmi'
import { Hero } from "../components/Hero";
import { Container } from "../components/Container";
import { Main } from "../components/Main";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import { Footer } from "../components/Footer";
import { useEffect, useState } from "react";
import { verifyPublicKeyAndSignature } from "../lib/verification";
import { createZkAttestProofAndVerify, importPublicKey } from "../lib/zkecdsa";
import { keyToInt } from "@cloudflare/zkp-ecdsa";
import Jazzicon from "react-jazzicon";
import Image from "next/image";
import { ConnectButton } from "../components/ConnectButton";
import { DIDSession } from 'did-session'
import { EthereumWebAuth, getAccountId } from '@didtools/pkh-ethereum'
import { Avatar } from "../components/Avatar";
import { credentialCreationOptions, credentialRequestOptions, credentialRequestWithAllowedCredentialsInPublicKey, generateIdList, overloadOptions, USER } from "../lib/webauthn";



const Index = () => {
  enum Stage {
    STAGE_0 = "Register to create keys, and then create proofs with them.",
    STAGE_1 = "Created keypair using secure navigator API. You can create a zkECDSA proof now to showcase access.",
    STAGE_2 = "Loading the credential from the browser...",
    STAGE_SUCCESS_ASSERTATION = "The zkECDSA proof created via Passkey was valid. Try removing your key (click on your Key) and do “Proof” again.",
    STAGE_FAILED_ASSERTATION = "The zkECDSA proof created via Passkey is now invalid since your public key is gone from the keyring. If you add it again, it should work.",
  }
  const STAGES = {
    [Stage.STAGE_1]: "CREDENTIAL_CREATION",
    [Stage.STAGE_2]: "CREDENTIAL_RETRIEVAL",
  };

  const LOADING_MESSAGE = "Loading...";
  const ONE_SECOND_IN_MS = 1000;
  const THREE_SECONDS_IN_MS = ONE_SECOND_IN_MS * 3;
  const MINIMAL_CALLBACK_TIME = THREE_SECONDS_IN_MS;

  const [isLoadingProcess, setLoadingProcess] = useState(false);
  const [isLoadingStage, setLoadingStage] = useState(false);
  const [credential, setCredential] = useState<PublicKeyCredential>();
  const [key, setKey] = useState<bigint>();
  const [isAssertationValid, setAssertation] = useState<boolean>();
  const [currentStage, setStage] = useState<Stage>(Stage.STAGE_0);

  const [session, setSession] = useState<DIDSession | null>(null);
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

  const EMPTY_KEYS = [BigInt(4), BigInt(5), BigInt(6), BigInt(7), BigInt(8)];
  const [keyring, setKeys] = useState<bigint[]>(EMPTY_KEYS);

  const waitPromise = (stage = "Default stage") => {
    console.log(`⏳ Starting stage ${stage}, waiting ${MINIMAL_CALLBACK_TIME}`);
    return new Promise<void>((res) =>
      setTimeout(() => {
        console.log(`⏳ Completed stage: ${stage}`);
        res();
      }, MINIMAL_CALLBACK_TIME)
    );
  };

  const delay = (cb: () => void) =>
    setTimeout(() => cb(), MINIMAL_CALLBACK_TIME);

  const createNavigatorCredentials = async (
    email: string,
    name: string
  ): Promise<PublicKeyCredential> => {
    console.log("🪪 Starting credential processs...");
    console.log("🪪 Domain details", credentialCreationOptions.publicKey.rp.id);
    const credential = (await navigator.credentials.create(
      overloadOptions(name, email, credentialCreationOptions)
    )) as PublicKeyCredential;
    console.log("🪪 Finished credential processs...", credential);
    return credential;
  };

  const loadNavigatorCredentials = async (credential: PublicKeyCredential) => {
    console.log("📤 Loading existing credential processs...");
    const enhancedCredentialRequestOptions =
      credentialRequestWithAllowedCredentialsInPublicKey(
        credentialRequestOptions,
        generateIdList(credential.rawId)
      );
    const assertation = (await navigator.credentials.get(
      enhancedCredentialRequestOptions
    )) as PublicKeyCredential;
    console.log("📤 Finished loading credential processs...", assertation);
    const verification = await verifyPublicKeyAndSignature(
      credential,
      assertation
    );
    console.log("🔑 Verified?", verification.isValid);
    const listKeys = keyring;
    const isAssertationValid = await createZkAttestProofAndVerify(
      listKeys,
      credential,
      verification.data,
      verification.signature
    );
    console.log("⚫️ Verified?", isAssertationValid);
    return isAssertationValid;
  };

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
      loadNavigatorCredentials(credential),
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
        <Text color="text">
          <Code>Webauthn</Code> stands for “Web Authentication”, a new standard
          to create public key-based credentials for web applications.
          <Code>zkECDSA</Code> is a TypeScript implementation of ZKAttest
          zero-knowledge proofs of an ECDSA-P256 signature.
        </Text>
        <Text color="text">
          Using both, you can register a public key to a web service. When
          prompted for any sort of access, you can generate a zkAttest
          showcasing your key is registered, allowing you to be granted access
          to services or other offline workflows (e.g. tickets for events).
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
              {`Proof ${
                isAssertationValid == undefined
                  ? "🧾"
                  : isAssertationValid
                  ? "✅"
                  : "❌"
              }`}
            </Button>
          </SimpleGrid>
          <Flex justifyContent="space-between" alignItems="center">
            <Code>Keys:</Code>
            {keyring.map((keyAsInt) => (
              <Flex
                key={Number(keyAsInt)}
                bg={key == keyAsInt ? "green.900" : "red.900"}
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
          <Flex justifyContent="center">
            <Text>Built with ❤️ by </Text>
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
