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
} from "@chakra-ui/react";

import { Hero } from "../components/Hero";
import { Container } from "../components/Container";
import { Main } from "../components/Main";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import { Footer } from "../components/Footer";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { verifyPublicKeyAndSignature } from "../lib/verification";
import { createZkAttestProofAndVerify, importPublicKey } from "../lib/zkecdsa";
import { keyToInt } from "@cloudflare/zkp-ecdsa";

const overloadOptions = (
  name: string,
  email: string,
  options: CredentialCreationOptions
) => {
  options.publicKey.user.name = email;
  options.publicKey.user.displayName = name;
  return options;
};

const USER_1 = {
  email: "user-1@demo.com",
  name: "Demo User 1",
};

const USER_2 = {
  email: "user-2@demo.com",
  name: "Demo User 2",
};

const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
  rp: {
    name: "Webauthn Demo",
    id: "3000-0xjjpa-zkaccess-raqbqlm92kg.ws-us81.gitpod.io",
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
    STAGE_1 = "Created keypair using secure navigator API. You can create a zkECDSA proof now.",
    STAGE_2 = "Loaded the credential from the browser.",
    STAGE_SUCCESS_ASSERTATION = "Successfully created a zkECDSA proof via Passkey.",
    STAGE_FAILED_ASSERTATION = "Unable to create a zkECDSA proof via Passkey.",
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
  const [credentials, setCredentials] = useState<
    Map<string, PublicKeyCredential>
  >(new Map());
  const [isAssertationValid, setAssertation] = useState<boolean>();
  const [currentStage, setStage] = useState<Stage>(Stage.STAGE_0);

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
    const listKeys = await Promise.all(Array.from(credentials.values()).map(async(credential) => {
      const key = await importPublicKey(credential);
      return await keyToInt(key)
    }));
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
    delay(() => setCredentials((map) => new Map(map.set(email, credential))));
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
    console.log("🪪 Credentials Stored", credentials);
    setLoadingProcess(false);
  }, [credentials]);

  useEffect(() => {
    isAssertationValid != undefined &&
      setStage(
        isAssertationValid
          ? Stage.STAGE_SUCCESS_ASSERTATION
          : Stage.STAGE_FAILED_ASSERTATION
      );
    setLoadingProcess(false);
    return () => setAssertation(undefined);
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
          Using both, anyone can register to a web service without disclosing
          personal information, while generation proofs-of-access that can be
          used to grant access to services or other offline workflows (e.g.
          tickets for events).
        </Text>
        <SimpleGrid spacing={2} columns={[2,2,4,4]}>
          <Button
            disabled={!!credentials.get(USER_1.email)}
            isLoading={isLoadingProcess}
            onClick={() => credentialsHandler(USER_1.email, USER_1.name)}
          >
            Register 🔑 (1)
          </Button>
          <Button
            disabled={!!credentials.get(USER_2.email)}
            isLoading={isLoadingProcess}
            onClick={() => credentialsHandler(USER_2.email, USER_2.name)}
          >
            Register 🔑 (2)
          </Button>
          <Button
            isLoading={isLoadingStage}
            disabled={!credentials.get(USER_1.email)}
            onClick={() => loadCredentialsHandler(credentials.get(USER_1.email))}
          >
            Proof 🧾 (1)
          </Button>
          <Button
            isLoading={isLoadingStage}
            disabled={!credentials.get(USER_2.email)}
            onClick={() => loadCredentialsHandler(credentials.get(USER_2.email))}
          >
            Proof 🧾 (2)
          </Button>
        </SimpleGrid>
        <Text color="text">
          {isLoadingStage ? LOADING_MESSAGE : currentStage}
        </Text>
      </Main>

      <DarkModeSwitch />
      <Footer>
        <Text>
          Built with ❤️ by 0xjjpa. Part of{" "}
          <ChakraLink href="https://ceramic.network/" isExternal>
            Ceramic Network
          </ChakraLink>{" "}
          Origin’s cohort.
        </Text>
      </Footer>
    </Container>
  );
};

export default Index;
