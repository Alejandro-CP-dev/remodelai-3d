import crypto from 'crypto';

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}
