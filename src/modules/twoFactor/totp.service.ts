import { authenticator } from 'otplib';
import { securityConfig } from '../../config/security.js';
import { SecretBox } from '../../shared/crypto/encryption.js';

export class TotpService {
  constructor(private readonly secretBox: SecretBox) {}

  generateSecret(): string 
  {
    return authenticator.generateSecret();
  }

  encryptSecret(secret: string): string 
  {
    return this.secretBox.encrypt(secret);
  }

  decryptSecret(secretEncrypted: string): string 
  {
    return this.secretBox.decrypt(secretEncrypted);
  }

  provisioningUri(username: string, secret: string): string 
  {
    return authenticator.keyuri(username, securityConfig.totpIssuer, secret);
  }

  matchingTimeStep(code: string, secret: string): number | null
  {
    const now = Date.now();
    const verifier = authenticator.clone();
    verifier.options = { step: 30, window: 1, epoch: now };
    const delta = verifier.checkDelta(code, secret);
    return delta === null ? null : Math.floor(now / 30_000) + delta;
  }
}

