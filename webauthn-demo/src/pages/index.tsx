import {
  Link as ChakraLink,
  Text,
  Code,
  List,
  ListIcon,
  ListItem,
  Button,
} from "@chakra-ui/react";

import { Hero } from "../components/Hero";
import { Container } from "../components/Container";
import { Main } from "../components/Main";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import { Footer } from "../components/Footer";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { verifyPublicKeyAndSignature } from "../lib/verification";

const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
  rp: {
    name: "Webauthn Demo",
    id: "3000-0xjjpa-zkaccess-raqbqlm92kg.ws-us80.gitpod.io",
  },
  user: {
    id: new Uint8Array(16),
    name: "user@webauthn.demo",
    displayName: "Demo User",
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
    STAGE_0 = "Press the button to kickstart the public keys creation.",
    STAGE_1 = "Created keypair using secure navigator API, loading credential now...",
    STAGE_2 = "Loaded the credential from the browser.",
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
  const [assertation, setAssertation] = useState<PublicKeyCredential>();
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

  const createNavigatorCredentials = async (): Promise<PublicKeyCredential> => {
    console.log("🪪 Starting credential processs...");
    const credential = (await navigator.credentials.create(
      credentialCreationOptions
    )) as PublicKeyCredential;
    console.log("🪪 Finished credential processs...", credential);
    return credential;
  };

  const loadNavigatorCredentials = async () => {
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
    console.log("Verified?", verifyPublicKeyAndSignature(credential, assertation));
    return assertation;
  };

  const credentialsHandler = async () => {
    setLoadingProcess(true);
    setLoadingStage(true);
    const [credential] = await Promise.all([
      createNavigatorCredentials(),
      waitPromise(STAGES[Stage.STAGE_1]),
    ]);
    setLoadingStage(false);
    setStage(Stage.STAGE_1);
    delay(() => setCredential(credential));
  };

  useEffect(() => {
    const loadCredentials = async () => {
      setLoadingStage(true);
      const [assertation] = await Promise.all([
        loadNavigatorCredentials(),
        waitPromise(STAGES[Stage.STAGE_2]),
      ]);
      setLoadingStage(false);
      setStage(Stage.STAGE_2);
      delay(() => setAssertation(assertation));
    };
    credential && loadCredentials();
    return () => setCredential(undefined);
  }, [credential]);

  return (
    <Container height="100vh">
      <Hero />
      <Main>
        <Button isLoading={isLoadingProcess} onClick={credentialsHandler}>
          Start process.
        </Button>
        <Text color="text">
          {isLoadingStage ? LOADING_MESSAGE : currentStage}
        </Text>
      </Main>

      <DarkModeSwitch />
      <Footer>
        <Text>Built with ❤️ by 0xjjpa</Text>
      </Footer>
    </Container>
  );
};

export default Index;
