import { Text, Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, Flex } from "@chakra-ui/react";
import { keyToInt, readJson, SignatureProofList, SystemParametersList, writeJson } from "@cloudflare/zkp-ecdsa";
import { useEffect, useState } from "react";
import { useCeramic } from "../context/ceramic";
import { useClub } from "../context/club";
import { buf2hex, hex2buf } from "../helpers/buffers";
import { isUrl } from "../helpers/strings";
import { loadKeysFromCLub } from "../lib/sdk";
import { createZkAttestProofAndVerify, generateZkAttestProof, importPublicKey, verifyZkAttestProof, ZkAttestation } from "../lib/zkecdsa";
import { Avatar } from "./Avatar";
import { BarcodeScanner } from "./BarcodeScanner";
import { ClubMembers } from "./ClubMembers";
import { QrCode } from "./QRCode";

export const VerifyButton = ({ signature, dataPayload, publicKey }: { signature: Uint8Array, dataPayload: Uint8Array, publicKey: ArrayBuffer }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setLoading] = useState(false);
  const [enableBarcodeScanner, setEnableBarcodeScanner] = useState(false);
  const [publicKeyAsHex, setPublicKeyAsHex] = useState<string>();
  const [StreamIDAsQRCodedHex, setStreamIDAsQRCodedHex] = useState<string>("");
  const [isStreamID, setIsStreamID] = useState<boolean>();
  const [isZkProofValid, setIsZkProofValid] = useState<boolean>();
  const [hasRegisteredStreamID, setHasRegisteredStreamID] = useState<boolean>();
  const [zkAttestationUrl, setZkAttestationUrl] = useState<string>();
  const [memberIsInClub, setMemberIsInClub] = useState<string[]>([]);

  const { session } = useCeramic();
  const { streamId, keys } = useClub();

  const verifySignatureHandler = async (scannedSignature) => {
    console.log("🖊️ Trying to verify signature key.", scannedSignature)
  }

  useEffect(() => {
    if (publicKey) {
      const publicKeyAsHex = buf2hex(publicKey)
      setPublicKeyAsHex(publicKeyAsHex);
    }
    return (() => setPublicKeyAsHex(undefined))
  }, [publicKey])

  useEffect(() => {
    console.log('(🖊️,ℹ️) - Signature useEffect has been triggered', StreamIDAsQRCodedHex);
    const validateStreamID = async () => {
      // Here we check if we are only reading the stream, or already got a proof
      // and we are on the verifier's side.
      // NB: This can be heavily simplified by dividing the responsibilities between
      // the prover and the verifier. We should also rename the variables.

      const isAlreadyProof = isUrl(StreamIDAsQRCodedHex);
      console.log("Is Already Proof?", isAlreadyProof);
      if (isAlreadyProof) {
        console.log('( , ) - Someone is giving us zk Proof!', StreamIDAsQRCodedHex);
        // @TODO: Fetch proof from URL and parse it.
        const zkProofAsJSONInURL = StreamIDAsQRCodedHex
        const fetchOptions = {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
        const response = await (await fetch(zkProofAsJSONInURL, fetchOptions)).json()
        console.log('( , ) - Response from URL', response);
        const parsedProof = readJson(SignatureProofList, response.proof);
        const parsedParams = readJson(SystemParametersList, response.params);
        const msgHash = hex2buf(response.msgHash);
        const listKeys = await Promise.all(keys.map(async (membersAsPublicKeysInHexFormat) => {
          const publicKey = hex2buf(membersAsPublicKeysInHexFormat);
          const key = await importPublicKey(publicKey);
          const keyAsInt = await keyToInt(key);
          return keyAsInt
        }));
        console.log("📋 List of Keys, my Key", listKeys, await keyToInt(await importPublicKey(hex2buf(publicKeyAsHex))));
        const isValid = await verifyZkAttestProof(msgHash, listKeys, { params: parsedParams, proof: parsedProof });
        console.log('( , ) - IsValid response?', isValid);
        setIsZkProofValid(isValid);
      } else {
        console.log('(🖊️,ℹ️) - Signature has value, ready to try and import it');
        const keysResponse = await loadKeysFromCLub(StreamIDAsQRCodedHex)
        console.log('(🔑,ℹ️) - Keys from loadKeysFromClub Response');
        const keys = keysResponse?.node?.keys || []
        console.log('(🔑,🫂) - Keys from club obtained');
        setMemberIsInClub(keys);
        setIsStreamID(true);
      }
    }
    StreamIDAsQRCodedHex && StreamIDAsQRCodedHex.length > 1 && validateStreamID();
    return (() => {
      setIsZkProofValid(undefined);
      setMemberIsInClub([]);
      setIsStreamID(undefined);
    })
  }, [StreamIDAsQRCodedHex])

  const createProofHandler = async () => {
    const msgHash = new Uint8Array(await crypto.subtle.digest('SHA-256', dataPayload));
    const key = await importPublicKey(publicKey);
    let index = 0;
    let keepIncreasing = true;
    const listKeys = await Promise.all(memberIsInClub.map(async (membersAsPublicKeysInHexFormat) => {
      const publicKey = hex2buf(membersAsPublicKeysInHexFormat);
      if (membersAsPublicKeysInHexFormat != publicKeyAsHex) {
        index++;
      } else {
        keepIncreasing = false;
      }
      const key = await importPublicKey(publicKey);
      const keyAsInt = await keyToInt(key);
      return keyAsInt
    }));
    console.log("📋 List of Keys, my Key and Index", listKeys, await keyToInt(await importPublicKey(hex2buf(publicKeyAsHex))), index);
    const attestation = await generateZkAttestProof(msgHash, key, signature, listKeys, index != listKeys.length ? index : 0);
    //@TODO: Remove in production.
    console.log("⏳ Roundtrip for testing parsing/exporting");
    const jsonProof = writeJson(SignatureProofList, attestation.proof);
    const jsonParams = writeJson(SystemParametersList, attestation.params);
    const parsedProof = readJson(SignatureProofList, jsonProof);
    const parsedParams = readJson(SystemParametersList, jsonParams);
    const isValid = await verifyZkAttestProof(msgHash, listKeys, { params: parsedParams, proof: parsedProof });
    console.log("Is ZkProof Valid?", isValid);
    console.log("(🧾,ℹ️) Attestation created", attestation);
    const fetchOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json;charset=UTF-8",
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_API_KEY}`
      },
      body: JSON.stringify({
        params: writeJson(SystemParametersList, attestation.params),
        proof: writeJson(SignatureProofList, attestation.proof),
        msgHash: buf2hex(msgHash)
      }),
    }
    const response = await (await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', fetchOptions)).json()
    // @TODO: Ay lmao the proof is roughly 0.6mb
    console.log("(🧾,ℹ️) Attestation uploaded", response);
    setZkAttestationUrl(`https://gateway.pinata.cloud/ipfs/${response.IpfsHash}`);
  }

  return (
    <>
      <Button
        disabled={!signature || !dataPayload}
        size="sm"
        isLoading={isLoading}
        onClick={() => onOpen()}
      >
        {`Verify Access 🧾`}
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent mx="5">
          <ModalHeader>Verify Access 🧾</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {
              enableBarcodeScanner ?
                isStreamID ?
                  !!zkAttestationUrl ?
                    <>
                      <Text fontSize="sm">✅ You have created a valid membership proof</Text>
                      <Box m="2">
                        <Text>Here is the zero knowledge proof you need to show up.</Text>
                        <Flex my="2" direction="column"><Text fontWeight="bold" textAlign="center">Proof</Text><QrCode payload={zkAttestationUrl} /></Flex>
                        <Box mt="5">
                          <Text fontSize="sm">Displaying this proof will show you belong to the circle you generated the proof for, without disclosing
                            who you are within the circle. If you do not belong into the circle, the proof will be rejected.
                          </Text>
                        </Box>
                      </Box>
                    </> :
                    <>
                      <Text fontSize="sm">✅ You have scanned a valid Club ID</Text>
                      <Box m="2">
                        <Text>Here are the members from the Club ID you have scanned:</Text>
                        <Flex justifyContent="space-between" alignItems="center" my="2">
                          <ClubMembers publicKeyAsHex={publicKeyAsHex} keysAsParameter={memberIsInClub} />
                        </Flex>
                        <Box mt="5">
                          <Text >Now you can create a zero-knowledge proof that you are part of that circle (or not)
                            without disclosing it’s you the one requesting access.
                          </Text>
                        </Box>
                      </Box>
                    </> :
                  isZkProofValid != undefined ?
                  <>
                  <Text fontSize="sm">{isZkProofValid ? '✅ The shared proof is valid' : '❌ The shared proof is not valid'}</Text>
                      <Box m="2">
                        <Text>
                          {
                          isZkProofValid ?
                            'This means whoever showed you that code is a member of your circle. It’s up to you to figure out who that might be!' :
                            'This means whoever showed you that code is NOT a member of your circle. I guess they wanted to give it a try anyway.'
                          }
                          </Text>
                      </Box>
                  </> :
                  <BarcodeScanner setBarcodeValue={setStreamIDAsQRCodedHex} />
                  :
                <>
                  <Text fontSize="sm">To verify whether a user is in your circle, you need to first show your
                    circle ID to your friend that's trying to prove membership to your circle. Once they have scanned
                    your Club ID, then they will generate a zero-knowledge proof you can then use to show access</Text>
                  {
                    streamId &&
                    <Flex my="2" direction="column"><Text fontWeight="bold" textAlign="center">Circle ID</Text><QrCode payload={streamId} /></Flex>
                  }
                  {
                    (!dataPayload || !signature) &&
                    <Text fontWeight="bold">Please make sure to have loaded your DID. Exit this dialog and select
                      the “Load Signature 🖊️” option.</Text>
                  }

                  <Text fontSize="xs" mt="4">You'll be prompted for camera access. We’ll use your device
                    camera to scan QR codes from friends.</Text>
                </>
            }
          </ModalBody>
          <ModalFooter>
            {(dataPayload && signature) && hasRegisteredStreamID ?
              <Button colorScheme="blue" onClick={async () => {
                await verifySignatureHandler(StreamIDAsQRCodedHex)
              }}>Verify Signature 🪪</Button> :
              isOpen && !!StreamIDAsQRCodedHex ? zkAttestationUrl ? <></> : isZkProofValid == undefined && <Button onClick={() => createProofHandler()} colorScheme="green">Create Proof 🧾</Button> :
                <Button colorScheme='blue' mr={3} onClick={() => setEnableBarcodeScanner(!enableBarcodeScanner)}>
                  {enableBarcodeScanner ? 'Close Camera 📷' : 'Open Camera 📸'}
                </Button>}
            <Button variant='ghost' onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}