// Utilities to convert Float32Array <-> base64 for transport in JSON
export function float32ToBase64(f32) {
  if (!f32) return null;
  const u8 = new Uint8Array(f32.buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode.apply(null, u8.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToFloat32(b64) {
  if (!b64) return null;
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}
