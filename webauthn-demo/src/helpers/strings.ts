export const truncate = (word: string) => word && word.substr(word.length - 6, word.length)

export const isUrl = (maybeUrl: string) => {
  let url;
  try {
    url = new URL(maybeUrl);
  } catch (_) {
    console.log('(❌,ℹ️) - Not a URL', maybeUrl);
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}