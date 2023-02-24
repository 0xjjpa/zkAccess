import { Text, useDisclosure, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Box, Code, Flex } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { useClub } from "../context/club"
import { hex2buf } from "../helpers/buffers"
import { importPublicKey } from "../helpers/publicKeys"
import { truncate } from "../helpers/strings"
import { updateClubs } from "../lib/sdk"
import { Avatar } from "./Avatar"
import { AvatarWithTitle } from "./AvatarWithTitle"
import { BarcodeScanner } from "./BarcodeScanner"
import { RegisterButtonModalIntro } from "./RegisterButtonModalIntro"
import { RegisterButtonModalSuccess } from "./RegisterButtonModalSuccess"

export const RegisterButton = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { streamId, keys: existingKeys, setKeys } = useClub();
  const [enableBarcodeScanner, setEnableBarcodeScanner] = useState(false);
  const [publicKeyAsQRCodedHex, setpublicKeyAsQRCodedHex] = useState<string>("");
  const [hasValidPublicKey, setHasValidPublicKey] = useState<boolean>();

  const registerKeyHandler = async (scannedPublicKey) => {
    console.log("🔑 Trying to register key.", streamId, existingKeys)
    if (!streamId) {
      console.log('🫂 No club loaded, can’t update keys');
      return;
    }
    const updateClubsResponse = await updateClubs(streamId, existingKeys, scannedPublicKey);
    setKeys(updateClubsResponse?.updateKeyring?.document?.keys);
    console.log("🔑 A key might had been added, who knows.")
  }

  useEffect(() => {
    console.log('(🔑,ℹ️) - PublicKey useEffect has been triggered');
    const validatePublicKey = async () => {
      console.log('(🔑,ℹ️) - PublicKey has value, ready to try and import it');
      const key = await importPublicKey(hex2buf(publicKeyAsQRCodedHex));
      if (key) {
        console.log('(🔑,ℹ️) - PublicKey is valid, ready to update the value');
        setHasValidPublicKey(true);
      } else {
        console.log('(🔑,❌) - PublicKey read from QRCode was not a valid public key');
      }
    }
    publicKeyAsQRCodedHex && publicKeyAsQRCodedHex.length > 1 && validatePublicKey();
    return (() => {
      setHasValidPublicKey(undefined);
    })
  }, [publicKeyAsQRCodedHex])

  const clearComponent = () => {
    setEnableBarcodeScanner(false);
    setHasValidPublicKey(undefined);
    setpublicKeyAsQRCodedHex("");
    onClose();
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => onOpen()}
      >
        Register zKey 🔑
      </Button>
      <Modal isOpen={isOpen} onClose={clearComponent}>
        <ModalOverlay />
        <ModalContent mx="5">
          <ModalHeader>Register zKey 🔑</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {
              enableBarcodeScanner ?
                hasValidPublicKey ?
                  <RegisterButtonModalSuccess publicKeyAsQRCodedHex={publicKeyAsQRCodedHex} /> :
                  <BarcodeScanner setBarcodeValue={setpublicKeyAsQRCodedHex} /> :
                  <RegisterButtonModalIntro />
            }
          </ModalBody>
          <ModalFooter>
            {hasValidPublicKey ?
              <Button colorScheme="green" onClick={async () => {
                await registerKeyHandler(publicKeyAsQRCodedHex)
                onClose()
              }}>Add to circle 🪪</Button> :
              <Button colorScheme='blue' mr={3} onClick={() => setEnableBarcodeScanner(!enableBarcodeScanner)}>
                {enableBarcodeScanner ? 'Close Camera 📷' : 'Register zKey 📸'}
              </Button>}
            <Button variant='ghost' onClick={clearComponent}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>)
}