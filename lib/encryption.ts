// Encryption module using Web Crypto API — compatible with Cloudflare Workers / Edge Runtime
// Uses AES-256-GCM for authenticated encryption

import { getRequestContext } from '@cloudflare/next-on-pages';

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 12 bytes is recommended for AES-GCM
const KEY_LENGTH = 256; // bits

// Helper: Uint8Array to a fresh ArrayBuffer (avoids SharedArrayBuffer TS type issue)
function toBuffer(arr: Uint8Array): ArrayBuffer {
    return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

// Helper: hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

// Helper: Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Helper: string to Uint8Array (UTF-8)
function stringToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str);
}

// Helper: Uint8Array to string (UTF-8)
function bytesToString(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
}

// Get ENCRYPTION_KEY from env
function getRawKey(): string {
    let key = process.env.ENCRYPTION_KEY;

    try {
        const context = getRequestContext();
        if (context?.env) {
            key = (context.env as any).ENCRYPTION_KEY || key;
        }
    } catch (e) {
        // Not in Cloudflare context
    }

    if (!key) {
        throw new Error('ENCRYPTION_KEY is not defined in environment variables');
    }

    // Strip quotes if present (some .env parsers leave them)
    key = key.replace(/^["']|["']$/g, '');

    return key;
}

// Import the raw key as a CryptoKey for AES-GCM
async function getEncryptionKey(): Promise<CryptoKey> {
    const rawKey = getRawKey();

    let keyBytes: Uint8Array;

    // If key is 64 hex chars = 32 bytes
    if (rawKey.length === 64 && /^[0-9a-fA-F]+$/.test(rawKey)) {
        keyBytes = hexToBytes(rawKey);
    }
    // If key is 32 chars (raw ASCII)
    else if (rawKey.length === 32) {
        keyBytes = stringToBytes(rawKey);
    } else {
        throw new Error(
            `ENCRYPTION_KEY must be 32 bytes (64 hex characters or 32 ASCII characters). Got length=${rawKey.length}`
        );
    }

    return crypto.subtle.importKey(
        'raw',
        toBuffer(keyBytes),
        { name: ALGORITHM },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt a plain-text string.
 * Returns a string in the format: `iv_hex:encrypted_hex`
 * (AES-GCM appends the auth tag to the ciphertext automatically)
 */
export async function encrypt(text: string): Promise<string> {
    if (!text) return text;

    try {
        const key = await getEncryptionKey();
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const plainBytes = stringToBytes(text);

        const cipherBuffer = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv: toBuffer(iv) },
            key,
            toBuffer(plainBytes)
        );

        // AES-GCM output = ciphertext + authTag (last 16 bytes)
        const cipherBytes = new Uint8Array(cipherBuffer);

        return `${bytesToHex(iv)}:${bytesToHex(cipherBytes)}`;
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Encryption failed');
    }
}

/**
 * Decrypt a string produced by `encrypt`.
 * Expects format: `iv_hex:ciphertext_with_tag_hex`
 * Falls back to returning the original string if the format doesn't match (backward compat).
 */
export async function decrypt(text: string): Promise<string> {
    if (!text) return text;

    // Check if it looks like our encrypted format
    const colonIndex = text.indexOf(':');
    if (colonIndex === -1) {
        // Not encrypted, return as-is (backward compatibility with plain-text data)
        return text;
    }

    // Our format is iv_hex:cipher_hex. iv is 12 bytes = 24 hex chars.
    const parts = text.split(':');
    if (parts.length !== 2 || parts[0].length !== IV_LENGTH * 2) {
        // Old 3-part format or something else — try 3-part for backward compat
        if (parts.length === 3) {
            return decryptLegacy(parts);
        }
        // Not our format, return as-is
        return text;
    }

    try {
        const [ivHex, cipherHex] = parts;
        const key = await getEncryptionKey();
        const iv = hexToBytes(ivHex);
        const cipherBytes = hexToBytes(cipherHex);

        const plainBuffer = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv: toBuffer(iv) },
            key,
            toBuffer(cipherBytes)
        );

        return bytesToString(new Uint8Array(plainBuffer));
    } catch (error) {
        console.warn('Decryption failed, returning original text:', error);
        return text;
    }
}

/**
 * Attempt to decrypt old 3-part format: iv:authTag:ciphertext
 * This provides backward compatibility with the old Node.js crypto implementation.
 */
async function decryptLegacy(parts: string[]): Promise<string> {
    try {
        const [ivHex, authTagHex, cipherHex] = parts;
        const key = await getEncryptionKey();
        const iv = hexToBytes(ivHex);

        // Web Crypto AES-GCM expects ciphertext + authTag concatenated
        const cipherBytes = hexToBytes(cipherHex);
        const authTagBytes = hexToBytes(authTagHex);

        // Concatenate ciphertext + authTag
        const combined = new Uint8Array(cipherBytes.length + authTagBytes.length);
        combined.set(cipherBytes);
        combined.set(authTagBytes, cipherBytes.length);

        const plainBuffer = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv: toBuffer(iv) },
            key,
            toBuffer(combined)
        );

        return bytesToString(new Uint8Array(plainBuffer));
    } catch (error) {
        console.warn('Legacy decryption failed, returning original text:', error);
        return parts.join(':'); // Return original string
    }
}

/**
 * Encrypt multiple fields in an object. Only encrypts specified keys.
 */
export async function encryptFields<T extends Record<string, any>>(
    data: T,
    fieldsToEncrypt: (keyof T)[]
): Promise<T> {
    const result = { ...data };
    for (const field of fieldsToEncrypt) {
        if (result[field] && typeof result[field] === 'string') {
            (result as any)[field] = await encrypt(result[field] as string);
        }
    }
    return result;
}

/**
 * Decrypt multiple fields in an object. Only decrypts specified keys.
 */
export async function decryptFields<T extends Record<string, any>>(
    data: T,
    fieldsToDecrypt: (keyof T)[]
): Promise<T> {
    const result = { ...data };
    for (const field of fieldsToDecrypt) {
        if (result[field] && typeof result[field] === 'string') {
            (result as any)[field] = await decrypt(result[field] as string);
        }
    }
    return result;
}
