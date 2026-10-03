import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * Encrypts integration tokens before they are stored.
 *
 * AES-256-GCM with a random 96-bit IV per value; the stored form is
 * `v1.<iv>.<tag>.<ciphertext>` in base64url. The key is INTEGRATIONS_KEY
 * (any long random string — it is hashed to 32 bytes). Until that is set, the
 * service-role key stands in, so the feature works on day one; setting a
 * dedicated key later only means reconnecting.
 */

function key(): Buffer {
  const material = process.env.INTEGRATIONS_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!material) throw new Error('INTEGRATIONS_KEY is not configured.');
  return createHash('sha256').update(`pp-integrations:${material}`).digest();
}

export function seal(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv, tag, body]
    .map((p) => (typeof p === 'string' ? p : p.toString('base64url')))
    .join('.');
}

export function open(sealed: string | null | undefined): string | null {
  if (!sealed) return null;
  const [v, iv, tag, body] = sealed.split('.');
  if (v !== 'v1' || !iv || !tag || !body) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(body, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return null;
  }
}
