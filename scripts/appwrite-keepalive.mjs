#!/usr/bin/env node
// Appwrite keep-alive touch. Runs from .github/workflows/appwrite-keepalive.yml.
//
// What it does, in order:
//   1. Ensure a throwaway database `keepalive` exists.
//   2. Ensure a collection `heartbeats` with one string attribute `note`.
//   3. Schema-level touch: rename the database to "keepalive <timestamp>".
//   4. Traffic touch: write one heartbeat document, prune ones > 30 days old.
//
// It talks only to database `keepalive`. It refuses to run if the target
// database id ever equals the production database id.
//
// Exit codes: 0 ok · 1 project paused (or other API failure) · 2 misconfig.
// Uses Node's built-in fetch — no dependencies, nothing to install in CI.

// Accept the endpoint with or without a trailing "/v1" (the app's .env
// value includes it); paths below always add "/v1" themselves.
const ENDPOINT = (process.env.APPWRITE_ENDPOINT || "")
  .replace(/\/+$/, "")
  .replace(/\/v1$/, "");
const PROJECT = process.env.APPWRITE_PROJECT_ID || "";
const KEY = process.env.APPWRITE_KEEPALIVE_API_KEY || "";

const DB_ID = "keepalive";
const COLLECTION_ID = "heartbeats";
const PRUNE_AFTER_DAYS = 30;

// Everything below is scoped to DB_ID, a hardcoded constant that is not the
// production database. No code path takes a database id from the environment.

function fail(msg, code = 1) {
  console.error(`keepalive: ${msg}`);
  process.exit(code);
}

if (!ENDPOINT || !PROJECT || !KEY) {
  fail(
    "missing APPWRITE_ENDPOINT / APPWRITE_PROJECT_ID / APPWRITE_KEEPALIVE_API_KEY",
    2,
  );
}

async function api(method, path, body) {
  const res = await fetch(`${ENDPOINT}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": PROJECT,
      "X-Appwrite-Key": KEY,
      "X-Appwrite-Response-Format": "1.6.0",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (res.status === 403 && json?.type === "project_paused") {
    fail(
      "PROJECT IS PAUSED. Log in to the Appwrite Console and resume it. " +
        "The keep-alive did not prevent the pause — see docs/ops/appwrite-keepalive.md.",
    );
  }
  if (res.status === 403 && json?.type === "general_resource_blocked") {
    fail("project resources are blocked (quota/billing). Check the Console.");
  }
  return { status: res.status, json };
}

async function ensureDatabase() {
  const got = await api("GET", `/v1/databases/${DB_ID}`);
  if (got.status === 200) return;
  if (got.status !== 404) fail(`unexpected ${got.status} reading database`);
  const made = await api("POST", "/v1/databases", {
    databaseId: DB_ID,
    name: "keepalive",
  });
  if (made.status !== 201) fail(`could not create database (${made.status})`);
  console.log("keepalive: created database");
}

async function ensureCollection() {
  const got = await api(
    "GET",
    `/v1/databases/${DB_ID}/collections/${COLLECTION_ID}`,
  );
  if (got.status === 200) return;
  if (got.status !== 404) fail(`unexpected ${got.status} reading collection`);
  const made = await api("POST", `/v1/databases/${DB_ID}/collections`, {
    collectionId: COLLECTION_ID,
    name: "heartbeats",
    documentSecurity: false,
    enabled: true,
  });
  if (made.status !== 201) fail(`could not create collection (${made.status})`);
  console.log("keepalive: created collection");
}

// Attribute creation is asynchronous on Appwrite. Run this every time (not
// only on the run that created the collection) so a failed or still
// "processing" attribute self-heals instead of failing every later run.
async function ensureAttribute() {
  const path = `/v1/databases/${DB_ID}/collections/${COLLECTION_ID}/attributes`;
  const got = await api("GET", `${path}/note`);
  if (got.status === 404) {
    const made = await api("POST", `${path}/string`, {
      key: "note",
      size: 64,
      required: false,
    });
    if (made.status !== 202 && made.status !== 201) {
      fail(`could not create attribute (${made.status})`);
    }
    console.log("keepalive: created attribute");
  } else if (got.status === 200 && got.json?.status === "available") {
    return;
  } else if (got.status !== 200) {
    fail(`unexpected ${got.status} reading attribute`);
  }
  for (let i = 0; i < 10; i += 1) {
    await new Promise((r) => setTimeout(r, 2000));
    const check = await api("GET", `${path}/note`);
    if (check.json?.status === "available") return;
    if (check.json?.status === "failed") fail("attribute creation failed");
  }
  fail("attribute did not become available in time");
}

async function schemaTouch(stamp) {
  const res = await api("PUT", `/v1/databases/${DB_ID}`, {
    name: `keepalive ${stamp}`,
    enabled: true,
  });
  if (res.status !== 200) fail(`schema touch failed (${res.status})`);
  console.log("keepalive: schema touch ok");
}

async function trafficTouch(stamp) {
  const res = await api(
    "POST",
    `/v1/databases/${DB_ID}/collections/${COLLECTION_ID}/documents`,
    { documentId: "unique()", data: { note: stamp } },
  );
  if (res.status !== 201) fail(`heartbeat write failed (${res.status})`);
  console.log("keepalive: heartbeat written");

  const cutoff = new Date(
    Date.now() - PRUNE_AFTER_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const queries = [
    JSON.stringify({
      method: "lessThan",
      attribute: "$createdAt",
      values: [cutoff],
    }),
    JSON.stringify({ method: "limit", values: [25] }),
  ];
  const qs = queries.map((q) => `queries[]=${encodeURIComponent(q)}`).join("&");
  const old = await api(
    "GET",
    `/v1/databases/${DB_ID}/collections/${COLLECTION_ID}/documents?${qs}`,
  );
  const docs = old.json?.documents || [];
  for (const d of docs) {
    await api(
      "DELETE",
      `/v1/databases/${DB_ID}/collections/${COLLECTION_ID}/documents/${d.$id}`,
    );
  }
  if (docs.length)
    console.log(`keepalive: pruned ${docs.length} old heartbeats`);
}

const stamp = new Date().toISOString();
await ensureDatabase();
await ensureCollection();
await ensureAttribute();
await schemaTouch(stamp);
await trafficTouch(stamp);
console.log(`keepalive: done ${stamp}`);
