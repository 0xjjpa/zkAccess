import { Code, Text } from "@chakra-ui/react"

export const RegisterButtonModalIntro = () => {
  return (<>
    <Text fontSize="sm">To register a user into your circle, you need to scan their
      QR code with their public key. Ask them to select the button <Code px="2">Show zKey 🔑</Code> and
      scan the QR code shown.</Text>
    <Text fontSize="xs" mt="4">You'll be prompted for camera access. We’ll use your device
      camera to scan QR codes from your friends.</Text>
  </>)
}