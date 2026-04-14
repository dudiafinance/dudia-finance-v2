import crypto from 'node:crypto';

/**
 * Utilitário de Criptografia AES-256-GCM
 * Protege dados sensíveis (chaves de API, etc.) no banco de dados.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

// A chave deve ter 32 bytes (64 caracteres hex)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/**
 * Criptografa um texto simples
 * Retorna uma string no formato: salt:iv:authTag:encryptedContent
 */
export function encrypt(text: string): string {
  if (!text) return '';
  const keyStr = process.env.ENCRYPTION_KEY;
  if (!keyStr) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ WARNING: ENCRYPTION_KEY is missing. Data will not be encrypted!');
    }
    return text;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  // Derivação de chave simples
  const key = crypto.scryptSync(keyStr, salt, 32);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');

  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Descriptografa um conteúdo
 * Espera o formato: salt:iv:authTag:encryptedContent
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';
  const keyStr = process.env.ENCRYPTION_KEY;
  if (!keyStr || !encryptedData.includes(':')) return encryptedData;

  try {
    const [saltHex, ivHex, authTagHex, encryptedText] = encryptedData.split(':');
    
    if (!saltHex || !ivHex || !authTagHex || !encryptedText) {
      return encryptedData;
    }

    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(keyStr, salt, 32);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData; 
  }
}
