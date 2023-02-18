export enum Stage {
  STAGE_0 = "Connect your web3 wallets to add your identity to any club or create one yourself.",
  STAGE_1 = "Created keypair using secure navigator API. You can create a zkECDSA proof now to showcase access.",
  STAGE_2 = "Loading the credential from the browser...",
  STAGE_SUCCESS_ASSERTATION = "The zkECDSA proof created via Passkey was valid. Try removing your key (click on your Key) and do “Proof” again.",
  STAGE_FAILED_ASSERTATION = "The zkECDSA proof created via Passkey is now invalid since your public key is gone from the keyring. If you add it again, it should work.",
}
export const STAGES = {
  [Stage.STAGE_1]: "CREDENTIAL_CREATION",
  [Stage.STAGE_2]: "CREDENTIAL_RETRIEVAL",
};

export const LOADING_MESSAGE = "Loading...";

const ONE_SECOND_IN_MS = 1000;
const THREE_SECONDS_IN_MS = ONE_SECOND_IN_MS * 3;
export const MINIMAL_CALLBACK_TIME = THREE_SECONDS_IN_MS;