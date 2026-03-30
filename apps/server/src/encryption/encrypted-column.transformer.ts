import * as crypto from 'crypto';
import { ValueTransformer } from 'typeorm';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

function encrypt(plaintext: string): string {
  const key = Buffer.from(process.env['ENCRYPTION_KEY']!, 'hex');

  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

function decrypt(ciphertext: string): string {
  const key = Buffer.from(process.env['ENCRYPTION_KEY']!, 'hex');

  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8',
  );
}

/**
 * TypeORM ValueTransformer that transparently AES-256-GCM-encrypts a string
 * column before it is written to the database and decrypts it when it is read
 * back. The transformer stores ciphertext as iv:authTag:ciphertext (hex) in a
 * single varchar column. ENCRYPTION_KEY must be a 64-character hex string
 * (32 bytes); validated at startup by EncryptionModule.
 */
export const encryptedColumnTransformer: ValueTransformer = {
  to: (value: string | null): string | null =>
    value !== null ? encrypt(value) : null,
  from: (value: string | null): string | null =>
    value !== null ? decrypt(value) : null,
};
