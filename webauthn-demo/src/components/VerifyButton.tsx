import { Button } from "@chakra-ui/react";
import { useState } from "react";
import { STAGES, Stage } from "../constants/stages";
import { waitPromise, delay } from "../helpers/promises";
import { loadNavigatorCredentials } from "../lib/webauthn";

export const VerifyButton = () => {
  const [isLoading, setLoading] = useState(false);
  
  return (
    <Button
      size="sm"
      isLoading={isLoading}
      onClick={() => {}}
    >
      {`Verify 🧾`}
    </Button>
  )
}