import { Button } from "@chakra-ui/react"

export const RegisterButton = () => {
  const registerKeyHandler = async () => {
    console.log("🔑 Trying to register key.")
  }

  return (
    <Button
      size="sm"
      onClick={() => registerKeyHandler()}
    >
      Register (2.0) 🔑
    </Button>)
}