/**
 * Storage abstraction layer.
 *
 * - In production (Vercel): reads/writes JSON blobs via @vercel/blob
 * - In development (local): reads/writes JSON files from /data directory
 *
 * The Vercel Blob token is injected automatically when you connect a Blob
 * store to your project in the Vercel dashboard.
 */

import fs from 'fs/promises';
import path from 'path';

const IS_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const dataDir = path.join(process.cwd(), 'data');

// Blob URL map — populated lazily on first write per file
// We use a stable pathname so each JSON file has a predictable URL.
// Pattern: db/<filename>  (e.g. db/players.json)
const blobUrlCache = new Map<string, string>();

// ─── In-memory request cache ─────────────────────────────────────────────────
// Avoids multiple round-trips to Blob/disk for the same file in one request.
// NOTE: In serverless this lives only for the duration of a single invocation.
const memCache = new Map<string, { data: any[]; ts: number }>();
const MEM_TTL_MS = 2000; // 2 seconds — enough for one serverless invocation

function memGet<T>(filename: string): T[] | null {
  const entry = memCache.get(filename);
  if (!entry) return null;
  if (Date.now() - entry.ts > MEM_TTL_MS) {
    memCache.delete(filename);
    return null;
  }
  return entry.data as T[];
}

function memSet<T>(filename: string, data: T[]): void {
  memCache.set(filename, { data, ts: Date.now() });
}

// ─── Local FS helpers ─────────────────────────────────────────────────────────

async function fsRead<T>(filename: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(dataDir, filename), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function fsWrite<T>(filename: string, data: T[]): Promise<void> {
  await fs.writeFile(
    path.join(dataDir, filename),
    JSON.stringify(data, null, 2),
    'utf-8'
  );
}

// ─── Blob helpers ─────────────────────────────────────────────────────────────

async function blobRead<T>(filename: string): Promise<T[]> {
  try {
    const { list, head } = await import('@vercel/blob');
    
    // Try to find the blob by prefix
    const { blobs } = await list({ prefix: `db/${filename}` });
    if (blobs.length === 0) return [];
    
    // Sort by uploadedAt descending to get latest
    blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    const blob = blobs[0];
    
    // Cache the URL for writes
    blobUrlCache.set(filename, blob.url);
    
    const res = await fetch(blob.url, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error(`[storage] blobRead error for ${filename}:`, err);
    return [];
  }
}

async function blobWrite<T>(filename: string, data: T[]): Promise<void> {
  const { put, del } = await import('@vercel/blob');
  
  // Upload new version with a stable pathname (overwrite: true)
  const blob = await put(`db/${filename}`, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });

  // Delete old version if URL changed (shouldn't happen with addRandomSuffix:false)
  const oldUrl = blobUrlCache.get(filename);
  if (oldUrl && oldUrl !== blob.url) {
    try { await del(oldUrl); } catch { /* ignore */ }
  }
  blobUrlCache.set(filename, blob.url);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function readData<T>(filename: string): Promise<T[]> {
  const cached = memGet<T>(filename);
  if (cached) return cached;

  const data = IS_BLOB ? await blobRead<T>(filename) : await fsRead<T>(filename);
  memSet(filename, data);
  return data;
}

export async function writeData<T>(filename: string, data: T[]): Promise<void> {
  memSet(filename, data); // update cache immediately
  if (IS_BLOB) {
    await blobWrite<T>(filename, data);
  } else {
    await fsWrite<T>(filename, data);
  }
}

/**
 * Call this once at startup (e.g., from an API init route) to seed Blob
 * storage from the committed data/ JSON files if the blobs don't exist yet.
 */
export async function seedBlobIfEmpty(): Promise<void> {
  if (!IS_BLOB) return;
  
  const files = ['players.json', 'seasons.json', 'matches.json', 'users.json'];
  for (const file of files) {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: `db/${file}` });
    if (blobs.length === 0) {
      // Blob is empty — seed from local file bundled in the deployment
      const local = await fsRead<any>(file);
      if (local.length > 0) {
        await blobWrite(file, local);
        console.log(`[storage] Seeded blob: db/${file} (${local.length} records)`);
      }
    }
  }
}
