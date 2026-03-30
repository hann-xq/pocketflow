import * as crypto from 'crypto';
import { encryptedColumnTransformer } from './encrypted-column.transformer';

describe('encryptedColumnTransformer', () => {
  beforeAll(() => {
    process.env['ENCRYPTION_KEY'] = crypto.randomBytes(32).toString('hex');
  });

  afterAll(() => {
    delete process.env['ENCRYPTION_KEY'];
  });

  describe('to (encrypt)', () => {
    it('returns null when given null', () => {
      expect(encryptedColumnTransformer.to(null)).toBeNull();
    });

    it('stores ciphertext as iv:authTag:ciphertext', () => {
      const result = encryptedColumnTransformer.to('secret')!;
      expect(result.split(':')).toHaveLength(3);
    });

    it('produces a different ciphertext on each call for the same input', () => {
      const a = encryptedColumnTransformer.to('secret');
      const b = encryptedColumnTransformer.to('secret');
      expect(a).not.toBe(b);
    });
  });

  describe('from (decrypt)', () => {
    it('returns null when given null', () => {
      expect(encryptedColumnTransformer.from(null)).toBeNull();
    });

    it('decrypts back to the original plaintext', () => {
      const plaintext = 'my-access-token';
      const ciphertext = encryptedColumnTransformer.to(plaintext)!;
      expect(encryptedColumnTransformer.from(ciphertext)).toBe(plaintext);
    });

    it('throws when the auth tag has been tampered with', () => {
      const ciphertext = encryptedColumnTransformer.to('secret')!;
      const [iv, , encrypted] = ciphertext.split(':');
      const tampered = [iv, 'ff'.repeat(16), encrypted].join(':');
      expect(() => encryptedColumnTransformer.from(tampered)).toThrow();
    });
  });
});
