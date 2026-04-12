import crypto from 'crypto';

const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY_RAW && process.env.NODE_ENV === 'production') {
  throw new Error('[encryption] ENCRYPTION_KEY env var is required in production');
}
if (!ENCRYPTION_KEY_RAW) {
  console.warn('[encryption] ENCRYPTION_KEY not set — using fallback key (UNSAFE, development only)');
}
const ENCRYPTION_KEY = (ENCRYPTION_KEY_RAW || 'default-secret-key-32-chars-long').slice(0, 32).padEnd(32, '0');
const IV_LENGTH = 16; // Para AES-256-CBC

/**
 * Criptografa um texto usando AES-256-CBC.
 */
export function encrypt(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Descriptografa um texto gerado pela função encrypt.
 */
export function decrypt(text: string): string {
  if (!text || !text.includes(':')) return text;
  
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error('[encryption] Falha na descriptografia — dado corrompido ou chave incorreta:', error);
    throw new Error('DECRYPTION_FAILED');
  }
}
