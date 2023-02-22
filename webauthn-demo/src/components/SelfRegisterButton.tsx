import { Button, Code, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { STAGES, Stage } from "../constants/stages";
import { USER } from "../constants/webauthn";
import { useCeramic } from "../context/ceramic";
import { useClub } from "../context/club";
import { buf2hex } from "../helpers/buffers";
import { waitPromise, delay } from "../helpers/promises";
import { createAccount, updateClubs } from "../lib/sdk";
import { verifyPublicKeyAndSignature } from "../lib/verification";
import { createNavigatorCredentials, credentialRequestOptions, credentialRequestWithAllowedCredentialsInPublicKey, generateIdList, loadNavigatorCredentials } from "../lib/webauthn";
import { QrCode } from "./QRCode";

export const SelfRegisterButton = ({ rawId, publicKey, setRawId, setPublicKey }: { rawId: ArrayBuffer, publicKey: ArrayBuffer, setRawId: (ArrayBuffer) => void, setPublicKey: (ArrayBuffer) => void }) => {
  const [isLoading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [dataPayload, setDataPayload] = useState<Uint8Array>();
  const [signature, setSignature] = useState<ArrayBuffer>();
  const [hasAccount, setHasAccount] = useState<boolean>();
  const [hasValidSignature, setHasValidSignature] = useState<boolean>();
  const [hasVerifiedAccount, setHasVerifiedAccount] = useState<boolean>();
  const [hasKeyAlreadyIn, setHasKeyAlreadyIn] = useState<boolean>();
  const [DIDQRPayload, setDIDQRPayload] = useState<string>();

  const { keys: existingKeys, setKeys, streamId } = useClub();
  const { session } = useCeramic();


  const loadCredentialsHandler = async () => {
    const enhancedCredentialRequestOptions =
      credentialRequestWithAllowedCredentialsInPublicKey(
        credentialRequestOptions,
        generateIdList(rawId)
      );
    const assertation = (await navigator.credentials.get(
      enhancedCredentialRequestOptions
    )) as PublicKeyCredential;
    if (!publicKey) {
      console.log('(🔑,❌) No public key loaded to verify user');
      return;
    }
    const { isValid, signature, data } = await verifyPublicKeyAndSignature(publicKey, assertation);
    console.log("(🪪,👁️) Assertation response data", isValid);
    setSignature(signature);
    setHasValidSignature(isValid);
    setDataPayload(data);
  }

  useEffect(() => {
    console.log('(ℹ️,ℹ️) hasRawId, hasPublicKey', !!rawId, !!publicKey);
    setHasAccount(!!rawId && !!publicKey);
  }, [rawId, publicKey])

  useEffect(() => {
    console.log('(ℹ️,ℹ️) signature, hasValidSignature', !!signature, !!hasValidSignature);
    setHasVerifiedAccount(!!signature && !!hasValidSignature);
  }, [signature, hasValidSignature])

  useEffect(() => {
    console.log(`(ℹ️,ℹ️) current user verified state: First time - ${!!rawId}, Loaded Account - ${!!hasAccount}, Verified Signature ${!!hasVerifiedAccount}`);
  }, [rawId, hasAccount, hasVerifiedAccount])


  useEffect(() => {
    const publicKeyAsHex = buf2hex(publicKey);
    existingKeys && setHasKeyAlreadyIn(existingKeys.some(key => key == publicKeyAsHex));
  }, [existingKeys, publicKey])

  const createCredentialsHandler = async (email: string, name: string) => {
    console.log('🪪 Creating account for', session.did.parent);
    setLoading(true);
    const [credential] = await Promise.all([
      createNavigatorCredentials(email, name),
      waitPromise(STAGES[Stage.STAGE_1]),
    ]);
    const publicKey = (credential.response as AuthenticatorAttestationResponse).getPublicKey();
    const publicKeyAsHex = buf2hex(publicKey);

    const createAccountResponse = await createAccount(buf2hex(credential.rawId), publicKeyAsHex);
    console.log('🪪 Account Created', createAccountResponse);

    setLoading(false);

    delay(async () => {
      setPublicKey(publicKey)
      setRawId(credential.rawId);
    });
  };

  const addCredentialsHelper = async () => {
    if (!hasAccount) {
      console.log('(🪪,❌) No Credential found, can’t add, exiting.');
      return;
    }
    console.log("(🪪,ℹ️) Credential’s id", rawId);
    const publicKeyAsHex = buf2hex(publicKey);
    console.log("(🔑,ℹ️) Credential’s publickey, is it already in?", publicKeyAsHex, hasKeyAlreadyIn);
    console.log("(🔑,🫂) Existing Credentials", existingKeys);
    const updateClubsResponse = await updateClubs(streamId, existingKeys, publicKeyAsHex);
    setKeys(updateClubsResponse?.updateKeyring?.document?.keys);
  }

  const displayDID = async () => {
    setLoading(true);
    // @TODO: We'll not share this, but the DID for users to fetch.
    // const signatureAsHex = buf2hex(signature);
    // const dataAsHex = buf2hex(dataPayload);
    const qrPayload = session?.did?.parent;
    setDIDQRPayload(qrPayload);
    console.log("(👤,👀) DID displayed", qrPayload);
    delay(async () => {
      onOpen()
      setLoading(false);
    });
  }


  return (
    <>
      <Button
        size="sm"
        isLoading={isLoading}
        onClick={() => {
          !rawId
            ? createCredentialsHandler(USER.email, USER.name) // Create new account.
            : !signature ?
              loadCredentialsHandler() // @TODO: Remove from array (not really possible so...)
              : hasKeyAlreadyIn ? displayDID() : addCredentialsHelper()
        }}
      >
        {!rawId ? "Create DID 👤" : !signature ? "Load Signature 🖊️" : !hasVerifiedAccount ? "Wrong device ❌" : hasKeyAlreadyIn ? "Show DID 👤" : "Add ID 🪪"}
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent mx="5">
          <ModalHeader>Displaying DID 👤</ModalHeader>
          <ModalCloseButton />
          <ModalBody textAlign="center">
            <QrCode payload={DIDQRPayload} />
          </ModalBody>
          <ModalFooter>
            <Button variant='ghost' onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}