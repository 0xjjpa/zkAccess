import { keyToInt, generateParamsList, proveSignatureList, SignatureProofList, verifySignatureList, SystemParametersList } from '@cloudflare/zkp-ecdsa'

export type ZkAttestation = {
  params: SystemParametersList,
  proof: SignatureProofList
}

export const importPublicKey = async (credential: PublicKeyCredential): Promise<CryptoKey> => {
  const publicKey = (credential.response as AuthenticatorAttestationResponse).getPublicKey()
  const key = await crypto.subtle.importKey(
    "spki", // "spki" Simple Public Key Infrastructure rfc2692
    publicKey,
    {
      name: "ECDSA",
      namedCurve: "P-256",
      hash: { name: "SHA-256" }
    },
    true, //whether the key is extractable (i.e. can be used in exportKey)
    ["verify"] //"verify" for public key import, "sign" for private key imports
  );
  return key;
}

export const generateListOfKeys = async (listKeys: bigint[], publicKey: CryptoKey): Promise<bigint[]> => {
  listKeys.unshift(await keyToInt(publicKey));
  console.log("📋 List of Keys", listKeys);
  return listKeys;
}

export const generateZkAttestProof = async (msgHash: Uint8Array, publicKey: CryptoKey, signature: Uint8Array, listKeys: bigint[]): Promise<ZkAttestation> => {
  const params = generateParamsList();
  const zkAttestProof = await proveSignatureList(
    params,
    msgHash,
    signature,
    publicKey,
    0, // It’s always 0 because we first unshift the key we are validating.
    listKeys
  );
  console.log("🧾 ZKAttest Proof", zkAttestProof);
  return { proof: zkAttestProof, params };
}

export const verifyZkAttestProof = async(msgHash: Uint8Array, listKeys: bigint[], attestation: ZkAttestation): Promise<boolean> => {
  const valid = await verifySignatureList(attestation.params, msgHash, listKeys, attestation.proof);
  return valid;
}

export const createZkAttestProofAndVerify = async(keys: bigint[], credential: PublicKeyCredential, data: Uint8Array, signature: Uint8Array): Promise<boolean> => {
  const msgHash = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  const key = await importPublicKey(credential);
  const listKeys = await generateListOfKeys(keys, key);
  const attestation = await generateZkAttestProof(msgHash, key, signature, listKeys);
  const isValid = await verifyZkAttestProof(msgHash, listKeys, attestation);
  console.log("Is ZkProof Valid?", isValid);
  return isValid;
}