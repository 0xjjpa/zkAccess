import { keyToInt, generateParamsList, proveSignatureList, SignatureProofList, verifySignatureList, SystemParametersList, writeJson, Newable, readJson } from '@cloudflare/zkp-ecdsa'

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
  const listKeys = keys;
  console.log("📋 List of Keys", listKeys);
  const attestation = await generateZkAttestProof(msgHash, key, signature, listKeys);
  //@TODO: Remove in production.
  console.log("⏳ Roundtrip for testing parsing/exporting");
  const jsonProof = writeJson(SignatureProofList, attestation.proof);
  const jsonParams = writeJson(SystemParametersList, attestation.params);
  const parsedProof = readJson(SignatureProofList, jsonProof);
  const parsedParams = readJson(SystemParametersList, jsonParams);
  const isValid = await verifyZkAttestProof(msgHash, listKeys, { params: parsedParams, proof: parsedProof });
  console.log("Is ZkProof Valid?", isValid);
  return isValid;
}