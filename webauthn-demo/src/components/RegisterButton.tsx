import { Button } from "@chakra-ui/react"
import { useClub } from "../context/club"
import { updateClubs } from "../lib/sdk"

export const RegisterButton = () => {
  const { streamId, keys: existingKeys, setKeys } = useClub();

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
    <Button
      size="sm"
      onClick={() => registerKeyHandler()}
    >
      Register 🔑
    </Button>)
}