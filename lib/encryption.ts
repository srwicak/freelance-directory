import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

import { getRequestContext } from '@cloudflare/next-on-pages';

// Helper to get key from env
const getEncryptionKey = () => {
    let key = process.env.ENCRYPTION_KEY;

    try {
        const context = getRequestContext();
        if (context?.env) {
            key = (context.env as any).ENCRYPTION_KEY || key;
        }
    } catch (e) {
        // Ignore
    }

    if (!key) {
        throw new Error('ENCRYPTION_KEY is not defined in environment variables');
    }
    // If key is hex string, convert to buffer. Assuming 32 bytes (64 hex chars)
    if (key.length === 64) {
        return Buffer.from(key, 'hex');
    }
    // If user provides a 32-char string directly
    if (key.length === 32) {
        return Buffer.from(key);
    }
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters or 32 characters)');
};


export const encrypt = (text: string): string => {
    if (!text) return text;

    try {
        const key = getEncryptionKey();
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:encryptedData
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Encryption failed');
    }
};

export const decrypt = (text: string): string => {
    if (!text) return text;

    // Try to decrypt. If it fails or format doesn't match, return original text (backward compatibility)
    const parts = text.split(':');
    if (parts.length !== 3) {
        // Not in our format, assume plain text
        return text;
    }

    try {
        const [ivHex, authTagHex, encryptedHex] = parts;
        const key = getEncryptionKey();
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        // If decryption fails (e.g. key mismatch or invalid data), return original text or throw
        // Returning original text might be safer for mixed content but risky if we strictly expect encryption
        // For now, let's log and return text to avoid crashing app on bad data
        console.warn('Decryption failed, returning original text:', error);
        return text;
    }
};
