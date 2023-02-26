import { Button } from "@chakra-ui/react"
import { useSetup } from "../context/setup";
import { Club, createClub } from "../lib/sdk";

export const ClubButton = () => {
  const { addClub, counter } = useSetup();

  const createClubHandler = async () => {
    console.log("🫂 Trying to create circle.")
    // @TODO: Identify { errors } response to notify user.
    const createClubsResponse = await createClub('ETH Denver');
    const club: Club = { node: createClubsResponse?.createKeyring?.document }
    addClub(club);
    console.log("🫂 Circle created.")
  }

  const hasAtLeastOneClub = counter > 0;

  return (
    <Button
      size="sm"
      disabled={hasAtLeastOneClub}
      onClick={() => createClubHandler()}
    >
      {hasAtLeastOneClub ? 'Create Circle ⭕️ (Locked)' : 'Create Circle ⭕️'}
    </Button>)
}