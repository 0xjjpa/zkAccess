# zkAccess

An application to showcase zero-knowledge membership access using Ceramic's CompositeDB as a backend
to store user's public keys (`zkeys`) to derive the attestations from.


# To Do:

- [ ] Invalid account create "Permission not allowed" error stops the UI from doing anything.
- [ ] When ID added for the first time to Club, the "(You)" label isn’t shown right away.
- [ ] 🔴 After registering someone, we don’t clean the state and can’t add other people.
- [ ] After scanning a Circle ID, you don’t see right away the club members.
- [ ] Creating a proof takes time, but shows no loading spinner or immediate feedback to the user.
- [ ] 🔴 Once the proof was created, we are again stuck in that workflow and can't restart it.
- [ ] Sometimes you get the “Ceramic endpoint offline” error, although endpoint isn't broken.
- [ ] Yubikey's generated webauthn FIDO2 credentials might be more than 64 bytes long, breaking our schema
- [ ] After the proofs have been posted to IPFS, it takes a few minutes before they can be fetched.