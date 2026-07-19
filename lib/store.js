// "Memory" layer. Two backends behind one async API:
//  - Local dev (no Blob store connected): flat JSON files under /data — zero setup.
//  - Deployed on Vercel with a Blob store connected: Vercel Blob, since Vercel's
//    deployed filesystem is read-only and /data/*.json writes would fail there.
// Which backend is used is decided once, automatically, from env vars — nothing
// else in the app needs to know or care.
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
// Use Blob only when we actually have a usable Blob credential. An OIDC token
// alone (which Vercel may set even with no Blob store connected) is NOT enough —
// it needs a store id too, else every Blob call throws. Falling back to local
// reads lets the deployed dashboard still render the committed seed data until a
// Blob store is connected.
const USE_BLOB = Boolean(
  process.env.BLOB_READ_WRITE_TOKEN ||
    (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID)
);

function localFilePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readLocal(name) {
  const fp = localFilePath(name);
  if (!fs.existsSync(fp)) return [];
  const raw = fs.readFileSync(fp, "utf8").trim();
  return raw ? JSON.parse(raw) : [];
}

function writeLocal(name, records) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(localFilePath(name), JSON.stringify(records, null, 2));
}

async function readBlob(name) {
  const { get } = await import("@vercel/blob");
  const result = await get(`data/${name}.json`, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return [];
  const text = await new Response(result.stream).text();
  return text.trim() ? JSON.parse(text) : [];
}

async function writeBlob(name, records) {
  const { put } = await import("@vercel/blob");
  await put(`data/${name}.json`, JSON.stringify(records, null, 2), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function readAll(name) {
  return USE_BLOB ? readBlob(name) : readLocal(name);
}

async function writeAll(name, records) {
  return USE_BLOB ? writeBlob(name, records) : writeLocal(name, records);
}

export async function listRecords(collection) {
  return readAll(collection);
}

export async function getRecord(collection, id) {
  const records = await readAll(collection);
  return records.find((r) => r.id === id) || null;
}

export async function upsertRecord(collection, record) {
  const records = await readAll(collection);
  const idx = records.findIndex((r) => r.id === record.id);
  if (idx >= 0) records[idx] = { ...records[idx], ...record };
  else records.push(record);
  await writeAll(collection, records);
  return record;
}

export async function findRecord(collection, predicate) {
  const records = await readAll(collection);
  return records.find(predicate) || null;
}
