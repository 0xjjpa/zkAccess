import { buf2hex, hex2buf } from "../helpers/buffers";
import { verifyPublicKeyAndSignature } from "./verification";
import { createZkAttestProofAndVerify } from "./zkecdsa";

const overloadOptions = (
  name: string,
  email: string,
  options: CredentialCreationOptions
) => {
  options.publicKey.user.name = email;
  options.publicKey.user.displayName = name;
  return options;
};

const DOMAIN_ID = `${process.env.NEXT_PUBLIC_VERCEL_PRODUCTION_URL ? process.env.NEXT_PUBLIC_VERCEL_PRODUCTION_URL : process.env.NEXT_PUBLIC_VERCEL_URL ? process.env.NEXT_PUBLIC_VERCEL_URL : "localhost"}`

const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
  rp: {
    name: "zkAccess",
    // id: DOMAIN_ID
  },
  user: {
    id: new Uint8Array(16),
    name: "zkAccess@ethereum.email",
    displayName: "zkAccess",
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

export const credentialRequestOptions: CredentialRequestOptions = {
  publicKey: publicKeyCredentialRequestOptions,
};

export const generateIdList = (
  rawId: BufferSource
): PublicKeyCredentialDescriptor[] => [
    {
      id: rawId,
      type: "public-key",
    },
  ];

export const credentialRequestWithAllowedCredentialsInPublicKey = (
  credentialRequestOptions: CredentialRequestOptions,
  idList: PublicKeyCredentialDescriptor[]
) => {
  credentialRequestOptions.publicKey.allowCredentials = idList;
  return credentialRequestOptions;
};

export const createNavigatorCredentials = async (
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

export const loadNavigatorCredentials = async (rawId: ArrayBuffer, publicKey: ArrayBuffer, keyring: bigint[]) => {
  console.log("📤 Loading existing credential processs...");
  console.log('🔑 Keyring', keyring);
  console.log("🪪 Raw Credential ID", rawId);
  console.log("🪪 Raw Credential ID (Hex)", buf2hex(rawId));
  console.log("⏳ Roundtrip to verify hex2buf/buf2hex, remove on dev");

  const enhancedCredentialRequestOptions =
    credentialRequestWithAllowedCredentialsInPublicKey(
      credentialRequestOptions,
      generateIdList(rawId)
    );
  const assertation = (await navigator.credentials.get(
    enhancedCredentialRequestOptions
  )) as PublicKeyCredential;
  console.log("📤 Finished loading credential processs...", assertation);
  const verification = await verifyPublicKeyAndSignature(
    publicKey,
    assertation
  );
  console.log("🔑 Verified?", verification.isValid);
  const listKeys = keyring;
  const isAssertationValid = await createZkAttestProofAndVerify(
    listKeys,
    publicKey,
    verification.data,
    verification.signature
  );
  console.log("⚫️ Verified?", isAssertationValid);
  return isAssertationValid;
};