# Appwrite keep-alive — owner runbook

## Why this exists

GuardPay's backend is an Appwrite Cloud project on the **Free plan**. Since
27 Feb 2026 Appwrite automatically **pauses** a Free project after **7 days
without development activity in the Console**. While paused, every API call
returns `403 project_paused`, so users cannot sign in or load shifts. Since
29 Jun 2026 a project that stays paused for **90 days is deleted**.

Two things are confirmed by Appwrite staff and changelogs:

- End-user traffic (sign-ins, reads, writes from the app) does **not** count
  as activity.
- Scheduled Appwrite Functions stop running once paused, so they cannot
  un-pause a project.
- Pro plan projects ($25/month, per project) are never paused.

Sources: `appwrite.io/changelog/entry/2026-02-20-1`,
`appwrite.io/changelog/entry/2026-06-29`, Appwrite Discord thread
1481574986136158322 (staff reply, 14 Mar 2026).

## What the workflow does

`.github/workflows/appwrite-keepalive.yml` runs `scripts/appwrite-keepalive.mjs`
every 3 days (and on demand). The script:

1. creates a throwaway database `keepalive` with a collection `heartbeats`
   the first time it runs;
2. **renames the database** with a timestamp (a schema/metadata write);
3. writes one small heartbeat document and prunes ones older than 30 days;
4. exits with an error if the project is already paused, so GitHub emails
   you. That is a free outage alert even if the keep-alive itself fails.

It never touches `users_prefs` or `shifts_history`.

## This is an experiment

Whether Appwrite counts API-key schema writes as "development activity" is
**not documented**. Community scripts claim it works; Appwrite staff have
only said that runtime traffic does not. Treat the result as evidence:

- **Success criterion:** three consecutive weeks after the first run with
  **no** manual resume needed.
- **Failure:** the project pauses again (you get the workflow-failure email,
  or a user reports being locked out). Then the honest fix is Pro.

Record the first-run date here: `____-__-__`

## One-time setup (about 5 minutes)

### 1. Create a scoped API key in the Appwrite Console

Console → your project → **Overview** → **Integrations** → **API keys** →
**Create API key**.

- Name: `github-keepalive`
- Expiration: 1 year (set a calendar reminder to rotate)
- Scopes (tick only these):
  - `databases.read`, `databases.write`
  - `collections.read`, `collections.write`
  - `attributes.read`, `attributes.write`
  - `documents.read`, `documents.write`

Copy the key once. It is shown only at creation.

> Blast radius: any key with `databases.write` or `collections.write` can
> delete production collections if it leaks. It lives only in GitHub's
> encrypted secrets and is never printed by the script. If you ever see it
> in a log or paste it anywhere, delete it in the Console and create a new
> one.

### 2. Add three repository secrets on GitHub

Repo → **Settings** → **Secrets and variables** → **Actions** → **New
repository secret**:

| Secret name | Value |
|---|---|
| `APPWRITE_ENDPOINT` | the same endpoint the app uses, e.g. `https://fra.cloud.appwrite.io/v1` (with or without the `/v1`, both work) |
| `APPWRITE_PROJECT_ID` | the project id (same as `EXPO_PUBLIC_APPWRITE_PROJECT_ID`) |
| `APPWRITE_KEEPALIVE_API_KEY` | the key from step 1 |

### 3. Run it once by hand

Repo → **Actions** → **Appwrite keep-alive** → **Run workflow**. The log should
end with `keepalive: done <timestamp>`. In the Console you should now see a
database named `keepalive <timestamp>` with one `heartbeats` document.

### 4. Know that GitHub can switch the schedule off

In a **public** repository GitHub disables `schedule` triggers after 60 days
with no commits, silently. If this repo is public, either push a commit at
least every couple of months or check Actions → Appwrite keep-alive for a
"scheduled workflows disabled" banner. Private repositories are not affected.

### 5. Make sure failure emails reach you

GitHub → your avatar → **Settings** → **Notifications** → under *Actions*,
keep "Send notifications for failed workflows" on. A failed run means the
project is paused: open the Console and resume it.

## If you decide to stop the experiment

- Disable the workflow (Actions → Appwrite keep-alive → ⋯ → Disable) or
  delete the YAML.
- Delete the `github-keepalive` API key in the Console.
- Optionally delete the `keepalive` database.
- Upgrade the project to Pro; nothing in the app changes.

## Related app behaviour

Independently of this workflow, the app now recognises a paused or
unreachable backend (`utils/appwriteErrors.js`) and shows a "service
temporarily unavailable, your data is safe" screen with a retry button
instead of sending signed-in users back to onboarding.
