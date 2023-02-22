import { Text, Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useCeramic } from "../context/ceramic";
import { useClub } from "../context/club";
import { buf2hex, hex2buf } from "../helpers/buffers";
import { importPublicKey } from "../helpers/publicKeys";
import { loadKeysFromCLub } from "../lib/sdk";
import { Avatar } from "./Avatar";
import { BarcodeScanner } from "./BarcodeScanner";
import { ClubMembers } from "./ClubMembers";
import { QrCode } from "./QRCode";

export const VerifyButton = ({ publicKey }: { publicKey: ArrayBuffer }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setLoading] = useState(false);
  const [enableBarcodeScanner, setEnableBarcodeScanner] = useState(false);
  const [publicKeyAsHex, setPublicKeyAsHex] = useState<string>();
  const [StreamIDAsQRCodedHex, setStreamIDAsQRCodedHex] = useState<string>("");
  const [hasRegisteredStreamID, setHasRegisteredStreamID] = useState<boolean>();
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
      const keys = keysResponse?.node?.keys || []
      setMemberIsInClub(keys);
    }
    StreamIDAsQRCodedHex && StreamIDAsQRCodedHex.length > 1 && validateStreamID();
  }, [StreamIDAsQRCodedHex])

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
                hasRegisteredStreamID ?
                  <>
                    <Text fontSize="sm">✅ We have a StreamID</Text>
                    <Box m="2">
                      <Text>We'll know proceed to load the StreamID's group</Text>
                      <ClubMembers publicKeyAsHex={publicKeyAsHex} keysAsParameter={memberIsInClub}/>
                    </Box>
                  </> :
                  <BarcodeScanner setBarcodeValue={setStreamIDAsQRCodedHex} /> :
                <>
                  <Text fontSize="sm">To verify whether a user is in your club, you need to first show your
                    club StreamID to your friend that's trying to prove membership to your club. Once they have scanned
                    your StreamID, then they will generate a zero-knowledge proof you can then use to show access</Text>
                  {
                    streamId ?
                      <Flex my="2" direction="column"><Text fontWeight="bold" textAlign="center">Stream ID</Text><QrCode payload={streamId} /></Flex> :
                      <Text fontWeight="bold">Please make sure to have loaded your DID. Exit this dialog and select
                        the “Load Signature 🖊️” option.</Text>
                  }

                  <Text fontSize="xs" mt="4">You'll be prompted for camera access. We’ll use your device
                    camera to scan QR codes from friends.</Text>
                </>
            }
          </ModalBody>
          <ModalFooter>
            {hasRegisteredStreamID ?
              <Button colorScheme="blue" onClick={async () => {
                await verifySignatureHandler(StreamIDAsQRCodedHex)
              }}>Verify Signature 🪪</Button> :
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