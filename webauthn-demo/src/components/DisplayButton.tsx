import { Text, useDisclosure, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter } from "@chakra-ui/react"

export const DisplayButton = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Button
        size="sm"
        onClick={() => onOpen()}
      >
        Show ID 🪪
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent mx="5">
          <ModalHeader>Displaying ID 🪪</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Your ID goes here.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant='ghost' onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>)
}