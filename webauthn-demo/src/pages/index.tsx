import {
  Link as ChakraLink,
  Text,
  Code,
  List,
  ListIcon,
  ListItem,
  Button,
  Stack,
  SimpleGrid,
  Flex,
  Box,
} from "@chakra-ui/react";

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

const overloadOptions = (
  name: string,
  email: string,
  options: CredentialCreationOptions
) => {
  options.publicKey.user.name = email;
  options.publicKey.user.displayName = name;
  return options;
};

const USER = {
  email: "user@demo.com",
  name: "Demo User",
};

const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
  rp: {
    name: "Webauthn Demo",
    id: process.env.NEXT_PUBLIC_VERCEL_URL ? process.env.NEXT_PUBLIC_VERCEL_URL : "3000-0xjjpa-zkaccess-raqbqlm92kg.ws-us81.gitpod.io",
  },
  user: {
    id: new Uint8Array(16),
    name: "template@webauthn.demo",
    displayName: "Template",
  },
  challenge: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
  pubKeyCredParams: [{ type: "public-key", alg: -7 }],
  timeout: 60000,
  attestation: "direct",
};

const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
  timeout: 60000,
  // allowCredentials: [newCredential] // see below
  challenge: new Uint8Array([
    // must be a cryptographically random number sent from a server
    0x79, 0x50, 0x68, 0x71, 0xda, 0xee, 0xee, 0xb9, 0x94, 0xc3, 0xc2, 0x15,
    0x67, 0x65, 0x26, 0x22, 0xe3, 0xf3, 0xab, 0x3b, 0x78, 0x2e, 0xd5, 0x6f,
    0x81, 0x26, 0xe2, 0xa6, 0x01, 0x7d, 0x74, 0x50,
  ]).buffer,
};

const credentialCreationOptions: CredentialCreationOptions = {
  publicKey: publicKeyCredentialCreationOptions,
};

const credentialRequestOptions: CredentialRequestOptions = {
  publicKey: publicKeyCredentialRequestOptions,
};

const generateIdList = (
  rawId: BufferSource
): PublicKeyCredentialDescriptor[] => [
  {
    id: rawId,
    transports: ["usb", "nfc", "ble"],
    type: "public-key",
  },
];

const credentialRequestWithAllowedCredentialsInPublicKey = (
  credentialRequestOptions: CredentialRequestOptions,
  idList: PublicKeyCredentialDescriptor[]
) => {
  credentialRequestOptions.publicKey.allowCredentials = idList;
  return credentialRequestOptions;
};

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
                <Jazzicon diameter={20} seed={Number(keyAsInt)} />
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
