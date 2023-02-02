import { styled } from "@chakra-ui/react";
import { addressAvatar } from "../lib/addressAvatar";

const ImageAvatarContainer = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
  overflow: 'hidden',
  width: 36,
  height: 36,
  cursor: 'pointer',
});

export const Avatar = ({ address }: { address: string }) => (
  <ImageAvatarContainer>
    <img src={addressAvatar(address, 36)} alt="user avatar" />
  </ImageAvatarContainer>
)
