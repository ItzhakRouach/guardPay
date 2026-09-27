#!/usr/bin/env node
// Appwrite keep-alive touch. Runs from .github/workflows/appwrite-keepalive.yml.
//
// The Free plan caps the number of databases per project (the first run hit
// `additional_resource_not_allowed`), so the throwaway lives one level down:
// a dedicated collection `keepalive_heartbeats` inside the app's existing
// database. The production collections (users_prefs, shifts_history) are
// never read or written.
//
// What it does, in order:
//   1. Resolve the database: APPWRITE_DATABASE_ID if set, otherwise the
//      project's only database (fails if there are several).
//   2. Ensure the collection `keepalive_heartbeats` with a string attribute.
//   3. Schema-level touch: rename the collection to "keepalive <timestamp>".
//   4. Traffic touch: write one heartbeat document, prune ones > 30 days old.
//
// Exit codes: 0 ok · 1 project paused or API failure · 2 misconfiguration.
// Uses Node's built-in fetch — no dependencies, nothing to install in CI.

// Accept the endpoint with or without a trailing "/v1" (the app's .env
// value includes it); paths below always add "/v1" themselves.
const ENDPOINT = (process.env.APPWRITE_ENDPOINT || "")
  .replace(/\/+$/, "")
  .replace(/\/v1$/, "");
const PROJECT = process.env.APPWRITE_PROJECT_ID || "";
const KEY = process.env.APPWRITE_KEEPALIVE_API_KEY || "";
const DATABASE_ID_OVERRIDE = process.env.APPWRITE_DATABASE_ID || "";

const COLLECTION_ID = "keepalive_heartbeats";
const PRUNE_AFTER_DAYS = 30;

function fail(msg, code = 1) {
  console.error(`keepalive: ${msg}`);
  process.exit(code);
}

// Appwrite's error body is { message, code, type } — safe to print (it never
// echoes credentials) and essential for diagnosing scope / plan-limit 403s.
function describe(res) {
  const t = res.json?.type ? ` type=${res.json.type}` : "";
  const m = res.json?.message ? ` message="${res.json.message}"` : "";
  return `${res.status}${t}${m}`;
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

async function resolveDatabaseId() {
  if (DATABASE_ID_OVERRIDE) return DATABASE_ID_OVERRIDE;
  const res = await api("GET", "/v1/databases");
  if (res.status !== 200) fail(`could not list databases: ${describe(res)}`);
  const dbs = res.json?.databases || [];
  if (dbs.length === 1) return dbs[0].$id;
  fail(
    `project has ${dbs.length} databases; set the APPWRITE_DATABASE_ID secret to the app database id`,
    2,
  );
}

async function ensureCollection(dbId) {
  const base = `/v1/databases/${dbId}/collections`;
  const got = await api("GET", `${base}/${COLLECTION_ID}`);
  if (got.status === 200) return;
  if (got.status !== 404) {
    fail(`unexpected response reading collection: ${describe(got)}`);
  }
  const made = await api("POST", base, {
    collectionId: COLLECTION_ID,
    name: "keepalive",
    documentSecurity: false,
    enabled: true,
  });
  if (made.status !== 201) {
    fail(`could not create collection: ${describe(made)}`);
  }
  console.log("keepalive: created collection");
}

// Attribute creation is asynchronous on Appwrite. Run this every time (not
// only on the run that created the collection) so a failed or still
// "processing" attribute self-heals instead of failing every later run.
async function ensureAttribute(dbId) {
  const path = `/v1/databases/${dbId}/collections/${COLLECTION_ID}/attributes`;
  const got = await api("GET", `${path}/note`);
  if (got.status === 404) {
    const made = await api("POST", `${path}/string`, {
      key: "note",
      size: 64,
      required: false,
    });
    if (made.status !== 202 && made.status !== 201) {
      fail(`could not create attribute: ${describe(made)}`);
    }
    console.log("keepalive: created attribute");
  } else if (got.status === 200 && got.json?.status === "available") {
    return;
  } else if (got.status !== 200) {
    fail(`unexpected response reading attribute: ${describe(got)}`);
  }
  for (let i = 0; i < 10; i += 1) {
    await new Promise((r) => setTimeout(r, 2000));
    const check = await api("GET", `${path}/note`);
    if (check.json?.status === "available") return;
    if (check.json?.status === "failed") fail("attribute creation failed");
  }
  fail("attribute did not become available in time");
}

// Renaming the collection is a schema/metadata write on the project — the
// kind of "development activity" this experiment bets on. Only this
// collection is ever touched.
async function schemaTouch(dbId, stamp) {
  const res = await api(
    "PUT",
    `/v1/databases/${dbId}/collections/${COLLECTION_ID}`,
    { name: `keepalive ${stamp}`, enabled: true },
  );
  if (res.status !== 200) fail(`schema touch failed: ${describe(res)}`);
  console.log("keepalive: schema touch ok");
}

async function trafficTouch(dbId, stamp) {
  const docs = `/v1/databases/${dbId}/collections/${COLLECTION_ID}/documents`;
  const res = await api("POST", docs, {
    documentId: "unique()",
    data: { note: stamp },
  });
  if (res.status !== 201) fail(`heartbeat write failed: ${describe(res)}`);
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
  const old = await api("GET", `${docs}?${qs}`);
  const stale = old.json?.documents || [];
  for (const d of stale) {
    await api("DELETE", `${docs}/${d.$id}`);
  }
  if (stale.length)
    console.log(`keepalive: pruned ${stale.length} old heartbeats`);
}

const stamp = new Date().toISOString();
const dbId = await resolveDatabaseId();
await ensureCollection(dbId);
await ensureAttribute(dbId);
await schemaTouch(dbId, stamp);
await trafficTouch(dbId, stamp);
console.log(`keepalive: done ${stamp}`);
