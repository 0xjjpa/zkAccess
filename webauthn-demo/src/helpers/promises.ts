import { MINIMAL_CALLBACK_TIME } from "../constants/stages";

export const waitPromise = (stage = "Default stage") => {
  console.log(`⏳ Starting stage ${stage}, waiting ${MINIMAL_CALLBACK_TIME}`);
  return new Promise<void>((res) =>
    setTimeout(() => {
      console.log(`⏳ Completed stage: ${stage}`);
      res();
    }, MINIMAL_CALLBACK_TIME)
  );
};

export const delay = (cb: () => void) => setTimeout(() => cb(), MINIMAL_CALLBACK_TIME);