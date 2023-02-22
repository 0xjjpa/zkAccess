import { Text, Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { hex2buf } from "../helpers/buffers";
import { importPublicKey } from "../helpers/publicKeys";
import { Avatar } from "./Avatar";
import { BarcodeScanner } from "./BarcodeScanner";

export const VerifyButton = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setLoading] = useState(false);
  const [enableBarcodeScanner, setEnableBarcodeScanner] = useState(false);
  const [signatureAsQRCodedHex, setSignatureAsQRCodedHex] = useState<string>("");
  const [hasValidSignature, setHasValidSignature] = useState<boolean>();
  const [memberIsInClub, setMemberIsInClub] = useState<boolean>();

  const verifySignatureHandler = async (scannedSignature) => {
    console.log("🖊️ Trying to verify signature key.", scannedSignature)
  }

  useEffect(() => {
    console.log('(🖊️,ℹ️) - Signature useEffect has been triggered', signatureAsQRCodedHex);
    const validateSignature = async () => {
      console.log('(🖊️,ℹ️) - Signature has value, ready to try and import it');
      // const qrPayload = [signatureAsHex, dataAsHex].join();
      const [signatureAsHex, dataAsHex] = signatureAsQRCodedHex.split(',')
      const signature = hex2buf(signatureAsHex);
      const data = hex2buf(dataAsHex);
      // @TODO: This isn't a key
      // const key = await importPublicKey(hex2buf(signatureAsQRCodedHex));
      // if (key) {
      //   console.log('(🖊️,ℹ️) - Signature is valid, ready to update the value');
      //   setHasValidSignature(true);
      // } else {
      //   console.log('(🖊️,❌) - Signature read from QRCode was not a valid public key');
      // }
    }
    signatureAsQRCodedHex && signatureAsQRCodedHex.length > 1 && validateSignature();
  }, [signatureAsQRCodedHex])

  return (
    <>
      <Button
        size="sm"
        isLoading={isLoading}
        onClick={() => onOpen()}
      >
        {`Verify ID 👁️`}
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent mx="5">
          <ModalHeader>Verify ID 🖊️</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {
              enableBarcodeScanner ?
                hasValidSignature ?
                  <>
                    <Text fontSize="sm">✅ We have a signature</Text>
                    <Box m="2">
                      <Avatar address={signatureAsQRCodedHex} />
                    </Box>
                  </> :
                  <BarcodeScanner setBarcodeValue={setSignatureAsQRCodedHex} /> :
                <>
                  <Text fontSize="sm">You'll be prompted for camera access. We’ll use your device
                    camera to scan QR codes with your friend’s signature.</Text>
                  <Text fontSize="sm" mt="2">To verify whether a user is in your club, you need to scan their
                    QR code with their latest signature. Ask them to click the “Show Signature” button and
                    scan the QR code shown.</Text>
                </>
            }
          </ModalBody>
          <ModalFooter>
            {hasValidSignature ?
              <Button colorScheme="blue" onClick={async () => {
                await verifySignatureHandler(signatureAsQRCodedHex)
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