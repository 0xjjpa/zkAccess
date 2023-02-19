import { Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { STAGES, Stage } from "../constants/stages";
import { USER } from "../constants/webauthn";
import { useCeramic } from "../context/ceramic";
import { useClub } from "../context/club";
import { buf2hex, hex2buf } from "../helpers/buffers";
import { waitPromise, delay } from "../helpers/promises";
import { createAccount, loadAccount } from "../lib/sdk";
import { createNavigatorCredentials, credentialRequestOptions, credentialRequestWithAllowedCredentialsInPublicKey, generateIdList, loadNavigatorCredentials } from "../lib/webauthn";

export const SelfRegisterButton = () => {
  const [isLoading, setLoading] = useState(false);
  const [credential, setCredential] = useState<PublicKeyCredential>();
  const [publicKeyAsHex, setPublicKeyAsHex] = useState<string>();

  const { keys: existingKeys } = useClub();
  const { session } = useCeramic();

  // @TODO: Properly test this... perhaps does make sense to do on useEffect
  const setupCredential = async() => {
    const accountResponse = await loadAccount(session);
    if (accountResponse?.node?.account?.rawId) {
      const rawId = hex2buf(accountResponse?.node?.account?.rawId);
      const enhancedCredentialRequestOptions =
        credentialRequestWithAllowedCredentialsInPublicKey(
          credentialRequestOptions,
          generateIdList(rawId)
        );
      const assertation = (await navigator.credentials.get(
          enhancedCredentialRequestOptions
      )) as PublicKeyCredential;
    }
  }

  const credentialsHandler = async (email: string, name: string) => {
    console.log('🪪 Creating account for', session.did.parent);
    setLoading(true);
    const [credential] = await Promise.all([
      createNavigatorCredentials(email, name),
      waitPromise(STAGES[Stage.STAGE_1]),
    ]);
    const publicKey = (credential.response as AuthenticatorAttestationResponse).getPublicKey();
    const publicKeyAsHex = buf2hex(publicKey);

    const createAccountResponse = await createAccount(buf2hex(credential.rawId));
    console.log('🪪 Account Created', createAccountResponse);
    
    setLoading(false);
    
    delay(async () => {
      // @TODO: Identify if this is still needed.
      // const key = await importPublicKey(credential);
      // setKey(await keyToInt(key));
      setPublicKeyAsHex(publicKeyAsHex)
      setCredential(credential);
    });
  };

  
  return (
    <Button
      size="sm"
      disabled={!credential ? false : existingKeys[0] == publicKeyAsHex ? true : false}
      isLoading={isLoading}
      onClick={() => {
        !credential
          ? credentialsHandler(USER.email, USER.name) // Create new account, and add it.
          : setupCredential() // @TODO: Remove from array (not really possible so...)
      }}
    >
      {!credential ? "Load Account 👤" : "Create Account 👤"}
    </Button>
  )
}