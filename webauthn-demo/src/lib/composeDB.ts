import { ComposeClient } from '@composedb/client';
import runtimeComposite from '../__generated__/runtime-composite.json';

export const composeClient = new ComposeClient({
  ceramic: process.env.NEXT_PUBLIC_CERAMIC_API_URL!,
  definition: runtimeComposite as any,
});