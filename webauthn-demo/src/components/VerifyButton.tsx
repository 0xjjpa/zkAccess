import { Text, Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, Flex } from "@chakra-ui/react";
import { keyToInt, SignatureProofList, SystemParametersList, writeJson } from "@cloudflare/zkp-ecdsa";
import { useEffect, useState } from "react";
import { useCeramic } from "../context/ceramic";
import { useClub } from "../context/club";
import { buf2hex, hex2buf } from "../helpers/buffers";
import { loadKeysFromCLub } from "../lib/sdk";
import { createZkAttestProofAndVerify, generateZkAttestProof, importPublicKey, ZkAttestation } from "../lib/zkecdsa";
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
  const [hasRegisteredStreamID, setHasRegisteredStreamID] = useState<boolean>();
  const [zkAttestationUrl, setZkAttestationUrl] = useState<string>();
  const [memberIsInClub, setMemberIsInClub] = useState<string[]>([]);

  const { session } = useCeramic();
  const { streamId } = useClub();

  const verifySignatureHandler = async (scannedSignature) => {
    console.log("🖊️ Trying to verify signature key.", scannedSignature)
  }

  useEffect(() => {
    if (publicKey) {
      const publicKeyAsHex = buf2hex(publicKey)
      setPublicKeyAsHex(publicKeyAsHex);
    }
  }, [publicKey])

  useEffect(() => {
    console.log('(🖊️,ℹ️) - Signature useEffect has been triggered', StreamIDAsQRCodedHex);
    const validateStreamID = async () => {
      console.log('(🖊️,ℹ️) - Signature has value, ready to try and import it');
      const keysResponse = await loadKeysFromCLub(StreamIDAsQRCodedHex)
      console.log('(🔑,ℹ️) - Keys from loadKeysFromClub Response');
      const keys = keysResponse?.node?.keys || []
      console.log('(🔑,🫂) - Keys from club obtained');
      setMemberIsInClub(keys);
    }
    StreamIDAsQRCodedHex && StreamIDAsQRCodedHex.length > 1 && validateStreamID();
  }, [StreamIDAsQRCodedHex])

  const createProofHandler = async () => {
    const msgHash = new Uint8Array(await crypto.subtle.digest('SHA-256', dataPayload));
    const key = await importPublicKey(publicKey);
    const listKeys = await Promise.all(memberIsInClub.map( async (membersAsPublicKeysInHexFormat) => {
      const publicKey = hex2buf(membersAsPublicKeysInHexFormat);
      const key = await importPublicKey(publicKey);
      const keyAsInt = await keyToInt(key);
      return keyAsInt
    }));
    console.log("📋 List of Keys", listKeys);
    const attestation = await generateZkAttestProof(msgHash, key, signature, listKeys);
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
                !!StreamIDAsQRCodedHex ?
                  !!zkAttestationUrl ?
                  <>
                    <Text fontSize="sm">✅ You have created a valid membership proof</Text>
                    <Box m="2">
                      <Text>Here is the zero knowledge proof you need to show up.</Text>
                      <Flex my="2" direction="column"><Text fontWeight="bold" textAlign="center">Proof</Text><QrCode payload={zkAttestationUrl} /></Flex>
                      <Box mt="5">
                        <Text fontSize="sm">Displaying this proof will show you belong to the club you generated the proof for, without disclosing
                        who you are within the club. If you do not belong into the club, the proof will be rejected.
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
                        <Text >Now you can create a zero-knowledge proof that you are part of that club (or not)
                          without disclosing it’s you the one requesting access.
                        </Text>
                      </Box>
                    </Box>
                  </> :
                  <BarcodeScanner setBarcodeValue={setStreamIDAsQRCodedHex} /> :
                <>
                  <Text fontSize="sm">To verify whether a user is in your club, you need to first show your
                    club ID to your friend that's trying to prove membership to your club. Once they have scanned
                    your Club ID, then they will generate a zero-knowledge proof you can then use to show access</Text>
                  {
                    streamId &&
                      <Flex my="2" direction="column"><Text fontWeight="bold" textAlign="center">Club ID</Text><QrCode payload={streamId} /></Flex>
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
              isOpen && !!StreamIDAsQRCodedHex ? zkAttestationUrl ? <></> : <Button onClick={() => createProofHandler()} colorScheme="green">Create Proof 🧾</Button> :
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