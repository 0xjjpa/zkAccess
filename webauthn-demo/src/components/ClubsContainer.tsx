import { Tabs, TabList, Tab, TabPanels, TabPanel, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { useCeramic } from "../context/ceramic"
import { Club, loadClubs } from "../lib/sdk"

export const ClubsContainer = ({ setup, manage }: { setup: JSX.Element, manage: JSX.Element }) => {
  const { session } = useCeramic();
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    const setupClubs = async () => {
      if (clubs.length == 0) {
        const clubs = await loadClubs(session);
        setClubs(clubs);
      }
    }
    session && setupClubs();
  }, [session])

  return (
    <Tabs>
      <TabList>
        <Tab>Add +</Tab>
        {
          clubs.map(club => (
            <Tab><Text fontFamily="mono" fontSize="xs">{club.node.title}</Text></Tab>
          ))
        }
      </TabList>

      <TabPanels>
        <TabPanel>
          {setup}
        </TabPanel>
        <TabPanel>
          {manage}
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}