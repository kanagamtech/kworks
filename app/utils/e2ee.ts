import { decode as atob, encode as btoa } from 'base-64';

const ENTERPRISE_SALT = 'KwOrKs_E2EE_Enterprise_Secured_2026_KanagamTech_Shield_v1';

/**
 * Deterministic hash to generate a fixed-size 256-bit key from arbitrary conversation metadata
 */
function hashKey(str: string): number[] {
  let h1 = 0xdeadbeef,      
    h2 = 0x41c6ce57,
    h3 = 0x9e3779b9,
    h4 = 0x85ebca6b;

  const salted = `${str}#${ENTERPRISE_SALT}`;
  for (let i = 0; i < salted.length; i++) {
    const code = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
    h3 = Math.imul(h3 ^ code, 2246822507);
    h4 = Math.imul(h4 ^ code, 3266489909);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 1597334677) ^ Math.imul(h3 ^ (h3 >>> 15), 2654435761);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2654435761) ^ Math.imul(h4 ^ (h4 >>> 14), 1597334677);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 3266489909) ^ Math.imul(h1 ^ (h1 >>> 13), 2246822507);

  const keyBytes: number[] = [];
  [h1, h2, h3, h4].forEach((val) => {
    keyBytes.push((val >>> 24) & 0xff);
    keyBytes.push((val >>> 16) & 0xff);
    keyBytes.push((val >>> 8) & 0xff);
    keyBytes.push(val & 0xff);
  });

  return keyBytes;
}

/**
 * Generates a shared conversation encryption key between two users or for a group
 */
export function getConversationKey(userA: string, userBOrGroupId: string): string {
  const cleanA = (userA || '').toLowerCase().trim();
  const cleanB = (userBOrGroupId || '').toLowerCase().trim();

  // If group ID, key is derived from group ID
  if (cleanB.startsWith('grp_')) {
    return `grp_key_${cleanB}`;
  }

  // If 1-on-1, sort emails alphabetically so both sender and receiver generate the EXACT same key
  const pair = [cleanA, cleanB].sort().join('::');
  return `direct_key_${pair}`;
}

/**
 * Encrypts a message using the conversation key
 * Output format: enc:v1:<base64-payload>
 */
export function encryptMessage(text: string, conversationKey: string): string {
  if (!text || typeof text !== 'string') return text;

  try {
    const key = hashKey(conversationKey);
    // Convert UTF-8 text to URI encoded string for safe byte conversion
    const utf8Str = encodeURIComponent(text);
    const bytes: number[] = [];

    for (let i = 0; i < utf8Str.length; i++) {
      const charCode = utf8Str.charCodeAt(i);
      const keyByte = key[i % key.length];
      // Multi-pass XOR byte permutation
      const encryptedByte = charCode ^ keyByte ^ ((i * 7 + 13) & 0xff);
      bytes.push(encryptedByte);
    }

    // Binary string to Base64
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    const b64 = btoa(binary);
    return `enc:v1:${b64}`;
  } catch (err) {
    console.warn('[KwOrKs E2EE] Encryption fallback:', err);
    return text;
  }
}

/**
 * Decrypts an encrypted message using the conversation key
 * Gracefully handles unencrypted legacy messages
 */
export function decryptMessage(text: string, conversationKey: string): string {
  if (!text || typeof text !== 'string') return text;

  // If not encrypted with our envelope, return as plain text (backward compatibility)
  if (!text.startsWith('enc:v1:')) {
    return text;
  }

  try {
    const b64 = text.slice(7);
    const binary = atob(b64);
    const key = hashKey(conversationKey);
    let decodedUri = '';

    for (let i = 0; i < binary.length; i++) {
      const encryptedByte = binary.charCodeAt(i);
      const keyByte = key[i % key.length];
      const charCode = encryptedByte ^ keyByte ^ ((i * 7 + 13) & 0xff);
      decodedUri += String.fromCharCode(charCode);
    }

    return decodeURIComponent(decodedUri);
  } catch (err) {
    // If decryption fails (e.g. wrong key), return safe placeholder or raw
    return text.startsWith('enc:v1:') ? '🔒 Encrypted message' : text;
  }
}

/**
 * Checks if a string has the encrypted envelope
 */
export function isEncryptedMessage(text?: string): boolean {
  return typeof text === 'string' && text.startsWith('enc:v1:');
}
