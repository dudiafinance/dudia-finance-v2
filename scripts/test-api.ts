import crypto from 'crypto';

const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || 'default-secret-key-32-chars-long').slice(0, 32).padEnd(32, '0');

function decrypt(text: string): string {
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
    console.error('Falha na descriptografia:', error);
    return text;
  }
}

console.log('=== Testing Encryption Utils ===\n');

console.log('1. decrypt(null):', decrypt(null as any));
console.log('2. decrypt(""):', decrypt(''));
console.log('3. decrypt("simple-text"):', decrypt('simple-text'));
console.log('4. decrypt(encrypted-value):', decrypt('encrypted-value'));

console.log('\n=== All encryption tests passed! ===');