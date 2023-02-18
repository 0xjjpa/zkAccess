import { DIDSession } from "did-session";
import { composeClient } from "../lib/composeDB";

export type Club = {
  node: {
    owner: {
      id: string
    }
    title: string;
  }
}

type ClubResponse = {
  node: {
    keyringList: {
      edges: Club[]
    }
  }
}

export const loadClubs = async (session: DIDSession): Promise<Club[]> => {
  try {
    const did = session.did
    const query = `
    query {
      node(id: "${did.parent}") {
        ...on CeramicAccount {
          keyringList(first: 5) {
            edges {
              node {
                owner {
                  id
                }
                title
              }
            } 
          }
        }
      }
    }
    `
    console.log("👤 Querying for DID...", did.parent);
    const { data, errors } = await composeClient.executeQuery<ClubResponse>(query);
    if (errors) {
      console.error('[ SDK - loadClubs ] Error while loading clubs', errors);
    }
    return data?.node?.keyringList?.edges
  } catch (e) {
    console.error('[ SDK - loadClubs ] Errors while loading clubs', e);
  }
}

export const createClub = async (title: string) => {
  try {
    const { errors } = await composeClient.executeQuery(
      `
        mutation {
          createKeyring(input: {
            content: {
              title: "${title}"
              keys: []
            }
          }) 
          {
            document {
              title
              keys
            }
          }
        }
      `
    );
    if (errors) {
      console.error('[ SDK - createClub ] Error while creating club', errors);
    }
  } catch (e) {
    console.error('[ SDK - createClub ] Error while creating club', e);
  }
}