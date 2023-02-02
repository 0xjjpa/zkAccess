export const overloadOptions = (
  name: string,
  email: string,
  options: CredentialCreationOptions
) => {
  options.publicKey.user.name = email;
  options.publicKey.user.displayName = name;
  return options;
};

export const USER = {
  email: "user@demo.com",
  name: "Demo User",
};

const DOMAIN_ID = `${process.env.NEXT_PUBLIC_VERCEL_PRODUCTION_URL ? process.env.NEXT_PUBLIC_VERCEL_PRODUCTION_URL : process.env.NEXT_PUBLIC_VERCEL_URL ? process.env.NEXT_PUBLIC_VERCEL_URL : "http://localhost:3000"}`

const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
  rp: {
    name: "Webauthn Demo",
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

export const credentialCreationOptions: CredentialCreationOptions = {
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
      transports: ["usb", "nfc", "ble"],
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