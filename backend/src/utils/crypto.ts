import crypto from 'crypto';

// AAD để chống tráo ngữ cảnh
const AAD = Buffer.from('carogame.jwt.v1');

const b64u = {
  enc: (buf: Buffer) =>
    buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,''),
  dec: (s: string) =>
    Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4), 'base64'),
};

// Lấy key mã hoá 32 bytes:
// - Ưu tiên JWT_ENC_KEY (hex hoặc base64/url), nếu không có thì derive từ JWT_ACCESS_SECRET_KEY (HMAC-SHA256)
function encKey(): Buffer {
  const raw = (process.env.JWT_ENC_KEY || '').trim();
  if (raw) {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
    try { return b64u.dec(raw); } catch {}
    try { return Buffer.from(raw, 'base64'); } catch {}
    throw new Error('JWT_ENC_KEY must be 32-byte hex or base64/base64url');
  }
  const accessSecret = (process.env.JWT_ACCESS_SECRET_KEY || process.env.ACCESS_TOKEN_SECRET_KEY || '').trim();
  if (!accessSecret) throw new Error('Missing JWT_ACCESS_SECRET_KEY or ACCESS_TOKEN_SECRET_KEY (or JWT_ENC_KEY)');
  // 32 bytes cố định từ secret truy cập (đủ dùng cho mã hoá payload)
  return crypto.createHmac('sha256', Buffer.from(accessSecret)).update('access-payload').digest();
}

export function encryptJson(obj: any): string {
  const key = encKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(AAD);
  const ct = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [b64u.enc(iv), b64u.enc(ct), b64u.enc(tag)].join('.');
}

export function decryptJson(compact: string): any {
  const [ivB64, ctB64, tagB64] = compact.split('.');
  if (!ivB64 || !ctB64 || !tagB64) throw new Error('ENC_FORMAT');
  const key = encKey();
  const iv = b64u.dec(ivB64), ct = b64u.dec(ctB64), tag = b64u.dec(tagB64);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(AAD); decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return JSON.parse(pt.toString('utf8'));
}
