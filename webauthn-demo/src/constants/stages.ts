export enum Stage {
  STAGE_0 = "Connect your web3 wallets to add your identity to any circle or create one yourself.",
  STAGE_1 = "Create a new circle or load an existing one to start registering people to it.",
  STAGE_2 = "Register your own key, or register someone else’s. You can share proofs or verify other’s.",
  STAGE_SUCCESS_ASSERTATION = "The zkECDSA proof created via Passkey was valid. Try removing your key (click on your Key) and do “Proof” again.",
  STAGE_FAILED_ASSERTATION = "The zkECDSA proof created via Passkey is now invalid since your public key is gone from the keyring. If you add it again, it should work.",
}
export const STAGES = {
  [Stage.STAGE_1]: "CREDENTIAL_CREATION",
  [Stage.STAGE_2]: "CREDENTIAL_RETRIEVAL",
};

export const LOADING_MESSAGE = "Loading...";

const ONE_SECOND_IN_MS = 1000;
export const MINIMAL_CALLBACK_TIME = ONE_SECOND_IN_MS;