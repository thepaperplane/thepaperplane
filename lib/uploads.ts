import 'server-only';

/**
 * Upload checks shared by every route that accepts a file.
 *
 * The browser's claimed MIME type is not trusted: the first bytes of the file
 * are read and must match a known signature for the type it claims to be.
 * A script renamed to .pdf, or an HTML page labelled image/png, is refused.
 */

const SIGNATURES: Record<string, (b: Uint8Array) => boolean> = {
  'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/webp': (b) =>
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50,
  'image/avif': (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70,
  'application/pdf': (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  // Legacy Office (OLE compound file).
  'application/msword': (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0,
  'application/vnd.ms-excel': (b) =>
    b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0,
  // OOXML and zip archives.
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (b) =>
    b[0] === 0x50 && b[1] === 0x4b,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': (b) =>
    b[0] === 0x50 && b[1] === 0x4b,
  'application/zip': (b) => b[0] === 0x50 && b[1] === 0x4b,
  // Plain text has no signature; refuse anything containing a NUL byte.
  'text/csv': (b) => !b.includes(0),
};

export const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/zip': 'zip',
  'text/csv': 'csv',
};

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];
export const RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const VAULT_TYPES = Object.keys(EXTENSIONS);

export type CheckedFile = { bytes: Uint8Array; type: string; ext: string; size: number };

export async function checkUpload(
  file: unknown,
  allowed: string[],
  maxBytes: number,
): Promise<{ ok: true; file: CheckedFile } | { ok: false; error: string }> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Choose a file.' };
  if (file.size > maxBytes) {
    return { ok: false, error: `Files must be under ${Math.round(maxBytes / 1048576)} MB.` };
  }
  const type = file.type;
  if (!allowed.includes(type)) return { ok: false, error: 'That file type is not accepted.' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = SIGNATURES[type];
  if (!check || !check(bytes.subarray(0, 16))) {
    return { ok: false, error: 'That file does not look like what its name says it is.' };
  }
  return { ok: true, file: { bytes, type, ext: EXTENSIONS[type] ?? 'bin', size: file.size } };
}
