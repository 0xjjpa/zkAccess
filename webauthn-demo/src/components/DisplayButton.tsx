import { Text, useDisclosure, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Flex, Box } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { buf2hex } from "../helpers/buffers";
import { Avatar } from "./Avatar";
import { QrCode } from "./QRCode";

export const DisplayButton = ({ publicKey }: { publicKey: ArrayBuffer }) => {
  const [publicKeyAsHex, setPublicKeyAsHex] = useState<string>();
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    if (publicKey) {
      const publicKeyAsHex = buf2hex(publicKey)
      setPublicKeyAsHex(publicKeyAsHex);
    }
  }, [publicKey])

  return (
    <>
      <Button
        disabled={!publicKeyAsHex}
        size="sm"
        onClick={() => onOpen()}
      >
        Show zKey 🔑
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent mx="5">
          <ModalHeader>Displaying zKey 🔑</ModalHeader>
          <ModalCloseButton />
          <ModalBody textAlign="center">
            <QrCode payload={publicKeyAsHex} />
            <Flex justifyContent="center" mt="5" direction="column">
              <Box m="auto">
                <Avatar address={publicKeyAsHex} />
              </Box>
              <Text fontSize="xs">(You)</Text>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button variant='ghost' onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>)
}