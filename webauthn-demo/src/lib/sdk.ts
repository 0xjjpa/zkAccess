import { DIDSession } from "did-session";
import { composeClient } from "../lib/composeDB";

export type ClubProperties = {
  id: string;
    owner: {
      id: string;
    }
    keys: string[];
    title: string;
}

export type Club = {
  node: ClubProperties;
}

export type ClubResponse = {
  node: {
    keyringList: {
      edges: Club[]
    }
  }
}

export type AccountResponse = {
  node: {
    account: {
      rawId: string
    }
  }
}

export type CreateClubResponse = {
  createKeyring: {
    document: ClubProperties
  }
}

export type UpdateClubResponse = {
  updateKeyring: {
    document: {
      keys: string[]
    }
  }
}

export type CreateAccountRespons = {
  createAccount: {
    document: {
      rawId: string;
    }
  }
}

export const loadAccount = async(session: DIDSession) => {
  try {
    const did = session.did
    const query = `
      query {
        node(id: "${did.parent}") {
          ...on CeramicAccount {
            account {
              rawId
            }
          }
        }
      }
    `
    console.log("🔑 Loading account with following DID", did.parent);
    const { data, errors } = await composeClient.executeQuery<AccountResponse>(query);
    console.log("DATA", data);
    if (errors) {
      console.error('[ SDK - loadAccount ] Error while loading account', errors);
    }
    return data;
  } catch (e) {
    console.error('[ SDK - loadAccount ] Error while loading account', e);
  }
}

export const createAccount = async (rawId: string) => {
  try {
    const query = `
      mutation {
        createAccount(input: {
          content: {
            rawId: "${rawId}"
          }
        }) 
        {
          document {
            rawId
          }
        }
      }
    `
    console.log("🔑 Creating account with following data", rawId);
    const { data, errors } = await composeClient.executeQuery<CreateAccountRespons>(query);
    if (errors) {
      console.error('[ SDK - createAccount ] Error while creating account', errors);
    }
    return data;
  } catch (e) {
    console.log('[ SDK - createAccount ] Error while creating account', e);
  }
}

export const updateClubs = async (streamId: string, keys: string[], key: string) => {
  try {
    const query = `
    mutation {
      updateKeyring(input: {
        id: "${streamId}",
        content: {
          keys: ${JSON.stringify(keys.concat(key))}
        }
      }) {
        document {
          keys
        }
      }
    }
    `
    console.log("📄 Querying for document with streamId", streamId);
    const { data, errors } = await composeClient.executeQuery<UpdateClubResponse>(query);
    if (errors) {
      console.error('[ SDK - updateClubs ] Error while updating clubs', errors);
    }
    return data;
  } catch (e) {
    console.error('[ SDK - updateClubs ] Errors while updating clubs', e);
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
                id
                owner {
                  id
                }
                keys
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
    const { data, errors } = await composeClient.executeQuery<CreateClubResponse>(
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
              owner {
                id
              }
              title
              keys
              id
            }
          }
        }
      `
    );
    console.log("🫂 Creating club with title", title, data);
    if (errors) {
      console.error('[ SDK - createClub ] Error while creating club', errors);
    }
    return data;
  } catch (e) {
    console.error('[ SDK - createClub ] Error while creating club', e);
  }
}