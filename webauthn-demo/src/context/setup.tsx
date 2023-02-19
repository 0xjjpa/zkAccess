import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { Club } from "../lib/sdk";

interface SetupContextType {
  addClub: (Club) => void;
  counter: number;
}

const SetupContext = createContext<SetupContextType>(
  {} as SetupContextType
);

const SetupProvider = ({ children, setClubs, clubs }: { children: React.ReactNode, setClubs: Dispatch<SetStateAction<Club[]>>, clubs: Club[] }) => {
  const [providerClubs, setProviderClubs] = useState<Club[]>(clubs);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    setProviderClubs(clubs)
    setCounter(clubs.length);
    console.log(`⚙️ Setup has loaded ${clubs.length} clubs:`, clubs)
  }, [clubs])

  const addClub = (club: Club) => setClubs(providerClubs.concat(club));
  
  return (
    <SetupContext.Provider value={{ addClub, counter }}>
      {children}
    </SetupContext.Provider>
  );
};

export function useSetup() {
  return useContext(SetupContext);
}

export default SetupProvider;