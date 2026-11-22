import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export class SecretBox {
  private readonly key: Buffer;

  constructor(keyBase64: string) {
    this.key = Buffer.from(keyBase64, 'base64');
    if (this.key.length !== 32) {
      throw new Error('TOTP_ENCRYPTION_KEY_BASE64 must decode to 32 bytes');
    }
  }

  encrypt(plaintext: string): string 
  {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`;
  }

  decrypt(payload: string): string 
  {
    const parts = payload.split('.');
    const [ivRaw, tagRaw, ciphertextRaw] = parts;
    if (parts.length !== 3 || !ivRaw || !tagRaw || ciphertextRaw === undefined ||
        !parts.every((part) => /^[A-Za-z0-9_-]*$/.test(part)) ||
        Buffer.from(ivRaw, 'base64url').length !== 12 || Buffer.from(tagRaw, 'base64url').length !== 16 ||
        !parts.every((part) => Buffer.from(part, 'base64url').toString('base64url') === part))
      throw new Error('Invalid encrypted payload');

    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivRaw, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextRaw, 'base64url')),
      decipher.final()
    ]);
    return plaintext.toString('utf8');
  }
}
