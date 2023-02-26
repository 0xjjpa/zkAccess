export const addressAvatar = (address: string, size: number = 120) => {
    if (address.startsWith('0x')) {
      address = address.replace('0x', '');
    }
    return `https://source.boringavatars.com/beam/${size}/${address}?circle&colors=1B676B,519548,88C425,BEF202,EAFDE6`;
  };