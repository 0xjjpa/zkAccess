import { Button } from "@chakra-ui/react"
import { createClub } from "../lib/sdk";

export const ClubButton = () => {
  const createClubHandler = async () => {
    console.log("🫂 Trying to create club.")
    // @TODO: Identify { errors } response to notify user.
    await createClub('Default Title');
    console.log("🫂 Club created.")
  }

  return (
    <Button
      size="sm"
      onClick={() => createClubHandler()}
    >
      Create 🫂
    </Button>)
}