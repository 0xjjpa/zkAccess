import { Tabs, TabList, Tab, TabPanels, TabPanel, Text } from "@chakra-ui/react"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { Stage } from "../constants/stages"
import { useCeramic } from "../context/ceramic"
import ClubProvider from "../context/club"
import SetupProvider from "../context/setup"
import { Club, loadClubs } from "../lib/sdk"

export const ClubsContainer = ({ setStage, setup, manage }: { setStage: Dispatch<SetStateAction<Stage>>, setup: JSX.Element, manage: JSX.Element }) => {
  const { session } = useCeramic();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [tabIndex, setTabIndex] = useState(0)

  const setupClubs = async () => {
    if (clubs.length == 0) {
      const clubs = await loadClubs(session);
      setClubs(clubs);
    }
    console.log('🫂 Clubs loaded', clubs);
  }

  useEffect(() => {
    session && setupClubs();
  }, [session])

  useEffect(() => {
    tabIndex != 0 ? setStage(Stage.STAGE_2) : setStage(Stage.STAGE_1)
  }, [tabIndex]);

  return (
    <Tabs onChange={(index) => setTabIndex(index)} >
      <TabList>
        <Tab>Add +</Tab>
        {
          clubs.map(club => (
            <Tab key={club.node.id}><Text fontFamily="mono" fontSize="xs">{club.node.title}</Text></Tab>
          ))
        }
      </TabList>

      <TabPanels>
        <TabPanel>
          <SetupProvider clubs={clubs} setClubs={setClubs}>
            {setup}
          </SetupProvider>
        </TabPanel>
        <TabPanel>
          <ClubProvider club={clubs[tabIndex - 1]}>
            {manage}
          </ClubProvider>
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}