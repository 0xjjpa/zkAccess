import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { Club } from "../lib/sdk";

interface ClubContextType {
  streamId: string;
  keys: string[];
  setKeys: Dispatch<SetStateAction<string[]>>;
}

const ClubContext = createContext<ClubContextType>(
  {} as ClubContextType
);

const ClubProvider = ({ children, club }: { children: React.ReactNode, club: Club }) => {
  const [streamId, setStreamId] = useState<string>();
  const [keys, setKeys] = useState<string[]>([]);


  useEffect(() => {
    const streamId = club?.node?.id;
    const existingKeys = club?.node.keys;
    setStreamId(streamId);
    setKeys(existingKeys);
  }, [club])

  useEffect(() => {
    console.log('🔑🫂 New Keys Added to Club', streamId, keys);
  }, [keys])

  return (
    <ClubContext.Provider value={{ streamId, keys, setKeys }}>
      {children}
    </ClubContext.Provider>
  );
};

export function useClub() {
  return useContext(ClubContext);
}

export default ClubProvider;