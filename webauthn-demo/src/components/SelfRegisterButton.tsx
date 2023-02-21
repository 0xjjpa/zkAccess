import { Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { STAGES, Stage } from "../constants/stages";
import { USER } from "../constants/webauthn";
import { useCeramic } from "../context/ceramic";
import { useClub } from "../context/club";
import { buf2hex, hex2buf } from "../helpers/buffers";
import { waitPromise, delay } from "../helpers/promises";
import { createAccount, loadAccount, updateClubs } from "../lib/sdk";
import { verifyPublicKeyAndSignature } from "../lib/verification";
import { createNavigatorCredentials, credentialRequestOptions, credentialRequestWithAllowedCredentialsInPublicKey, generateIdList, loadNavigatorCredentials } from "../lib/webauthn";

export const SelfRegisterButton = () => {
  const [isLoading, setLoading] = useState(false);
  const [rawId, setRawId] = useState<ArrayBuffer>();
  const [publicKey, setPublicKey] = useState<ArrayBuffer>();
  const [signature, setSignature] = useState<ArrayBuffer>();
  const [hasAccount, setHasAccount] = useState<boolean>();
  const [hasValidSignature, setHasValidSignature] = useState<boolean>();
  const [hasVerifiedAccount, setHasVerifiedAccount] = useState<boolean>();
  const [hasKeyAlreadyIn, setHasKeyAlreadyIn] = useState<boolean>();

  const { keys: existingKeys, setKeys, streamId } = useClub();
  const { session } = useCeramic();


  const loadRawId = async () => {
    console.log('🪪 Loading credentials from user...', session.did.parent)
    const accountResponse = await loadAccount(session);
    if (accountResponse?.node?.account?.rawId) {
      const rawId = hex2buf(accountResponse?.node?.account?.rawId);
      const publicKey = hex2buf(accountResponse?.node?.account?.publicKey);
      console.log('🪪 Credential found!', rawId)
      setRawId(rawId);
      setPublicKey(publicKey);
    }
  }

  const loadCredentialsHandler = async() => {   
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
    const { isValid, signature } = await verifyPublicKeyAndSignature(publicKey, assertation);
    console.log("(🪪,👁️) Assertation response data", isValid);
    setSignature(signature);
    setHasValidSignature(isValid);
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
    session && loadRawId();
  }, [session])

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
      // @TODO: Identify if this is still needed.
      // const key = await importPublicKey(credential);
      // setKey(await keyToInt(key));
      setPublicKey(publicKey)
      setRawId(credential.rawId);
    });
  };

  const addCredentialsHelper = async() => {
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

  
  return (
    <Button
      size="sm"
      isLoading={isLoading}
      disabled={!!rawId && !!signature && (!hasVerifiedAccount || hasKeyAlreadyIn)}
      onClick={() => {
        !rawId
          ? createCredentialsHandler(USER.email, USER.name) // Create new account.
          : !signature ? 
            loadCredentialsHandler() // @TODO: Remove from array (not really possible so...)
          : addCredentialsHelper()  
      }}
    >
      {!rawId ? "Create ID 👤" : !signature ? "Load ID 🪪" : !hasVerifiedAccount ? "Wrong device ❌" : hasKeyAlreadyIn ? "ID Added ✅" : "Add ID 🪪"}
    </Button>
  )
}