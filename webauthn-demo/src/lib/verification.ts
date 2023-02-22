import { importPublicKey } from "../helpers/publicKeys";

export type Verification = {
  isValid: boolean,
  signature: Uint8Array,
  data: Uint8Array
}

export const verifyPublicKeyAndSignature = async (publicKey: ArrayBuffer, assertation: PublicKeyCredential): Promise<Verification> => {
  // verify signature on server
  const response = await assertation.response as AuthenticatorAssertionResponse;
  const signature = response.signature;
  console.log("SIGNATURE", signature)

  var clientDataJSON = await assertation.response.clientDataJSON;
  console.log("clientDataJSON", clientDataJSON)

  var authenticatorData = new Uint8Array(response.authenticatorData);
  console.log("authenticatorData", authenticatorData)

  var clientDataHash = new Uint8Array(await crypto.subtle.digest("SHA-256", clientDataJSON));
  console.log("clientDataHash", clientDataHash)

  // concat authenticatorData and clientDataHash
  var signedData = new Uint8Array(authenticatorData.length + clientDataHash.length);
  signedData.set(authenticatorData);
  signedData.set(clientDataHash, authenticatorData.length);
  console.log("signedData", signedData);

  // import key
  var key = await importPublicKey(publicKey);

  // Convert signature from ASN.1 sequence to "raw" format
  var usignature = new Uint8Array(signature);
  var rStart = usignature[4] === 0 ? 5 : 4;
  var rEnd = rStart + 32;
  var sStart = usignature[rEnd + 2] === 0 ? rEnd + 3 : rEnd + 2;
  var r = usignature.slice(rStart, rEnd);
  var s = usignature.slice(sStart);
  var rawSignature = new Uint8Array([...r, ...s]);

  // check signature with public key and signed data 
  var verified = await crypto.subtle.verify(
    <EcdsaParams>{ name: "ECDSA", namedCurve: "P-256", hash: { name: "SHA-256" } },
    key,
    rawSignature,
    signedData.buffer
  );
  // verified is now true!
  console.log('verified', verified)

  return { isValid: verified, signature: rawSignature, data: signedData };
}