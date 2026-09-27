#!/usr/bin/env node
// Read-only: dumps one user's shifts_history documents for a date range to a
// JSON file, for offline verification of the salary/overtime maths.
//
// Usage (run in YOUR terminal, never paste the key into a chat):
//   APPWRITE_API_KEY=<key> node scripts/dump-shifts.mjs <userId> <fromYYYY-MM-DD> <toYYYY-MM-DD> <outFile>
// Endpoint / project / database / collection ids are read from .env
// (they are public identifiers that ship in the app).

import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => l.split("=").map((x) => x.trim())),
);
const ENDPOINT = env.EXPO_PUBLIC_APPWRITE_ENDPOINT.replace(/\/+$/, "");
const PROJECT = env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const DB = env.EXPO_PUBLIC_APPWRITE_DB;
const COL = env.EXPO_PUBLIC_APPWRITE_SHIFTS_HISTORY_ID;
const KEY = process.env.APPWRITE_API_KEY;

const [userId, from, to, outFile] = process.argv.slice(2);
if (!KEY || !userId || !from || !to || !outFile) {
  console.error("usage: APPWRITE_API_KEY=... node scripts/dump-shifts.mjs <userId> <from> <to> <outFile>");
  process.exit(2);
}

const q = (o) => `queries[]=${encodeURIComponent(JSON.stringify(o))}`;
const all = [];
let cursor = null;
for (;;) {
  const parts = [
    q({ method: "equal", attribute: "user_id", values: [userId] }),
    q({ method: "greaterThanEqual", attribute: "start_time", values: [`${from}T00:00:00.000Z`] }),
    q({ method: "lessThan", attribute: "start_time", values: [`${to}T00:00:00.000Z`] }),
    q({ method: "orderAsc", attribute: "start_time", values: [] }),
    q({ method: "limit", values: [100] }),
  ];
  if (cursor) parts.push(q({ method: "cursorAfter", values: [cursor] }));
  const res = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents?${parts.join("&")}`, {
    headers: { "X-Appwrite-Project": PROJECT, "X-Appwrite-Key": KEY },
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`request failed: ${res.status} ${json?.type || ""} ${json?.message || ""}`);
    process.exit(1);
  }
  const docs = json.documents || [];
  all.push(...docs);
  if (docs.length < 100) break;
  cursor = docs[docs.length - 1].$id;
}
writeFileSync(outFile, JSON.stringify(all, null, 2));
console.log(`wrote ${all.length} documents to ${outFile}`);
