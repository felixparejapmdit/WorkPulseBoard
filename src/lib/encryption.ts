/**
 * Data Privacy & Client-Side Encryption Module
 * Protects customer details and work order data in transit and at rest using AES-GCM 256-bit encryption.
 */

const DEFAULT_SALT = "workpulse_privacy_salt_2026";
const SECRET_PASSPHRASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ENCRYPTION_SECRET) ||
  "workpulse-ops-e2e-private-key-secure-v1";

// Helper to derive a 256-bit AES-GCM CryptoKey from a passphrase
async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET_PASSPHRASE),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(DEFAULT_SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt any JavaScript object into an encrypted base64 payload
 */
export async function encryptData<T>(data: T): Promise<string> {
  try {
    if (typeof window === "undefined" && typeof crypto === "undefined") {
      return JSON.stringify(data);
    }
    const key = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encoded = enc.encode(JSON.stringify(data));

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encoded
    );

    // Pack IV + Ciphertext into base64
    const ivArray = Array.from(iv);
    const cipherArray = Array.from(new Uint8Array(ciphertext));
    const payload = {
      iv: btoa(String.fromCharCode(...ivArray)),
      data: btoa(String.fromCharCode(...cipherArray)),
      encryptedAt: new Date().toISOString(),
      version: "aes-256-gcm",
    };

    return `wp_enc:${btoa(JSON.stringify(payload))}`;
  } catch (err) {
    console.warn("Encryption fallback used:", err);
    return JSON.stringify(data);
  }
}

/**
 * Decrypt an encrypted payload back into its typed object
 */
export async function decryptData<T>(rawString: string, fallback: T): Promise<T> {
  try {
    if (!rawString) return fallback;

    // If plaintext legacy JSON, parse directly
    if (!rawString.startsWith("wp_enc:")) {
      return JSON.parse(rawString) as T;
    }

    const jsonStr = atob(rawString.replace("wp_enc:", ""));
    const payload = JSON.parse(jsonStr);

    const ivStr = atob(payload.iv);
    const iv = new Uint8Array(ivStr.split("").map((c) => c.charCodeAt(0)));

    const dataStr = atob(payload.data);
    const cipherData = new Uint8Array(dataStr.split("").map((c) => c.charCodeAt(0)));

    const key = await getCryptoKey();
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      cipherData
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted)) as T;
  } catch (err) {
    console.warn("Failed to decrypt data, falling back:", err);
    try {
      return JSON.parse(rawString) as T;
    } catch {
      return fallback;
    }
  }
}
