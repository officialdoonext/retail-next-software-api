import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'retail-next-ultra-secure-jwt-secret-key-2026';
const ENCRYPTION_KEY = Buffer.from(
  (process.env.ENCRYPTION_KEY || 'retailnextsecretencryptionkey32b').padEnd(32, '0').slice(0, 32),
  'utf-8'
);
const IV_LENGTH = 16;

export const encrypt = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

export const decrypt = (text) => {
  if (!text || !text.includes(':')) return text;
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return text;
  }
};

export const generateToken = (payload, expiresIn = '365d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

export const generateUniqueBarcode = () => {
  const prefix = '890';
  let randomBody = '';
  for (let i = 0; i < 9; i++) {
    randomBody += Math.floor(Math.random() * 10);
  }
  const digits = prefix + randomBody;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const val = parseInt(digits[i], 10);
    sum += i % 2 === 0 ? val : val * 3;
  }
  const checksum = (10 - (sum % 10)) % 10;
  return `${digits}${checksum}`;
};
