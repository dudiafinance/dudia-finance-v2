import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt } from '@/lib/crypto';

describe('Crypto Module', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long!!!';
  });

  it('should produce different output each time due to random IV', () => {
    const text = 'hello world';
    const encrypted1 = encrypt(text);
    const encrypted2 = encrypt(text);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should correctly encrypt and decrypt text', () => {
    const text = 'Hello, this is a secret message!';
    const encrypted = encrypt(text);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  it('should return empty string when encrypting empty string', () => {
    const encrypted = encrypt('');
    expect(encrypted).toBe('');
  });

  it('should return empty string when decrypting empty string', () => {
    const decrypted = decrypt('');
    expect(decrypted).toBe('');
  });

  it('should return original string when decrypting plain text without separator', () => {
    const plainText = 'this is not encrypted text';
    const decrypted = decrypt(plainText);
    expect(decrypted).toBe(plainText);
  });

  it('should handle special characters correctly', () => {
    const text = 'Special chars: äöü ñ 中文 🎉';
    const encrypted = encrypt(text);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  it('should handle long text correctly', () => {
    const text = 'A'.repeat(10000);
    const encrypted = encrypt(text);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });
});
