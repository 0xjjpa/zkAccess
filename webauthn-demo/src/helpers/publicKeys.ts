export const importPublicKey = async (publicKey: ArrayBuffer): Promise<CryptoKey | null> => {
  try {
    // import key
    const key = await crypto.subtle.importKey(
      // The getPublicKey() operation thus returns the credential public key as a SubjectPublicKeyInfo. See:
      // 
      // https://w3c.github.io/webauthn/#sctn-public-key-easy
      //
      // crypto.subtle can import the spki format:
      // 
      // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey
      "spki", // "spki" Simple Public Key Infrastructure rfc2692

      publicKey,
      {
        // these are the algorithm options
        // await cred.response.getPublicKeyAlgorithm() // returns -7
        // -7 is ES256 with P-256 // search -7 in https://w3c.github.io/webauthn
        // the W3C webcrypto docs:
        //
        // https://www.w3.org/TR/WebCryptoAPI/#informative-references (scroll down a bit)
        //
        // ES256 corrisponds with the following AlgorithmIdentifier:
        name: "ECDSA",
        namedCurve: "P-256",
        hash: { name: "SHA-256" }
      },
      false, //whether the key is extractable (i.e. can be used in exportKey)
      ["verify"] //"verify" for public key import, "sign" for private key imports
    );
    return key;
  } catch (e) {
    console.log('(🔑, ❌) Unable to load key, the provided ArrayBuffer isn’t a valid key.');
    return null;
  }
}