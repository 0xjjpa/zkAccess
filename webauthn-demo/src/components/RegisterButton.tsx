import { Text, useDisclosure, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter } from "@chakra-ui/react"
import { useState } from "react"
import { useClub } from "../context/club"
import { updateClubs } from "../lib/sdk"
import { BarcodeScanner } from "./BarcodeScanner"

export const RegisterButton = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { streamId, keys: existingKeys, setKeys } = useClub();
  const [enableBarcodeScanner, setEnableBarcodeScanner] = useState(false);

  const registerKeyHandler = async () => {
    console.log("🔑 Trying to register key.", streamId, existingKeys)
    if (!streamId) {
      console.log('🫂 No club loaded, can’t update keys');
      return;
    }
    const updateClubsResponse = await updateClubs(streamId, existingKeys, 'Demo Key (pt5)');
    setKeys(updateClubsResponse?.updateKeyring?.document?.keys);
    console.log("🔑 A key might had been added, who knows.")
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => onOpen()}
      >
        Register 🔑
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent mx="5">
          <ModalHeader>Register Key 🔑</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {
              enableBarcodeScanner ?
                <BarcodeScanner /> :
                <>
                  <Text fontSize="sm">You'll be prompted for camera access. We’ll use your device
                    camera to scan QR codes with your friend’s public keys.</Text>
                  <Text fontSize="sm" mt="2">To register a user into your club, you need to scan their
                    QR code with their public key. Ask them to click the “Show QR Code” button and
                    scan the QR code shown.</Text>
                </>
            }
          </ModalBody>
          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={() => setEnableBarcodeScanner(!enableBarcodeScanner)}>
              { enableBarcodeScanner ? 'Close Camera 📷' : 'Open Camera 📸' }
            </Button>
            <Button variant='ghost' onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>)
}