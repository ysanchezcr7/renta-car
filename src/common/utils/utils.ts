// src/common/utils.ts

import * as crypto from 'crypto';

export function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /\S+@\S+\.\S+/.test(email);
}

export function sanitizeUser(user: any): any {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}
export function sanitizeUsers(users: any[]): any[] {
  return users.map(sanitizeUser);
}

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto
  .createHash('sha256')
  .update(String(process.env.EMAIL_ENCRYPT_SECRET))
  .digest(); // 32 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16); // IV aleatorio
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encrypted: string): string {
  const [ivHex, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
