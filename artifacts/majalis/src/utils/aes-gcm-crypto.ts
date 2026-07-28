/**
 * Web Crypto AES-GCM helpers for personal note encryption.
 * Silent failures return null — never throw into UI paths.
 */

export type AesGcmEncryptedBlob = {
  v: 1;
  alg: "AES-GCM";
  /** base64 salt */
  salt: string;
  /** base64 iv */
  iv: string;
  /** base64 ciphertext */
  ct: string;
};

const TEXT_ENC = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
const TEXT_DEC = typeof TextDecoder !== "undefined" ? new TextDecoder() : null;

function b64encode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function isAesGcmAvailable(): boolean {
  try {
    return typeof crypto !== "undefined" && Boolean(crypto.subtle);
  } catch {
    return false;
  }
}

export function isEncryptedBlob(value: unknown): value is AesGcmEncryptedBlob {
  if (!value || typeof value !== "object") return false;
  const v = value as AesGcmEncryptedBlob;
  return v.v === 1 && v.alg === "AES-GCM" && Boolean(v.salt && v.iv && v.ct);
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    TEXT_ENC!.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: 100_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Encrypt plaintext with passphrase → portable JSON blob. */
export async function encryptAesGcm(
  plaintext: string,
  passphrase: string,
): Promise<AesGcmEncryptedBlob | null> {
  try {
    if (!isAesGcmAvailable() || !TEXT_ENC || !passphrase) return null;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const ct = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      TEXT_ENC.encode(plaintext),
    );
    return {
      v: 1,
      alg: "AES-GCM",
      salt: b64encode(salt),
      iv: b64encode(iv),
      ct: b64encode(ct),
    };
  } catch {
    return null;
  }
}

/** Decrypt AES-GCM blob; returns null on failure. */
export async function decryptAesGcm(
  blob: AesGcmEncryptedBlob,
  passphrase: string,
): Promise<string | null> {
  try {
    if (!isAesGcmAvailable() || !TEXT_DEC || !passphrase) return null;
    if (!isEncryptedBlob(blob)) return null;
    const salt = b64decode(blob.salt);
    const iv = b64decode(blob.iv);
    const ct = b64decode(blob.ct);
    const key = await deriveKey(passphrase, salt);
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
      key,
      ct.buffer as ArrayBuffer,
    );
    return TEXT_DEC.decode(pt);
  } catch {
    return null;
  }
}
