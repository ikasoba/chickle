
export const escapeRegexp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export function decodeBase64(b64: string) {
  try {
    return new Uint8Array(atob(b64).split("").map(x => x.charCodeAt(0)));
  } catch (err) {
    return null;
  }
}

export function encodeBase64(buf: Uint8Array) {
  try {
    return btoa([...buf].map(x => String.fromCharCode(x)).join(""));
  } catch {
    return null;
  }
}
