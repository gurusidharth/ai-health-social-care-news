# Subscribe / Register email notifications — deploy runbook

Registering on the site (footer form) subscribes an email to a digest that's
sent whenever there's fresh AI-in-health-and-social-care news. This is
powered by three Supabase Edge Functions plus two tables — nothing runs on a
server you have to manage.

## How it fits together

- `subscribe` — called from the browser (footer form). Adds the email to
  `subscribers` and sends a welcome email.
- `unsubscribe` — the link inside every email. Deletes the subscriber row.
- `notify` — called from `.github/workflows/digest.yml` every 6h. Always
  emails everyone in `subscribers` something: new articles from the last 24h
  it hasn't sent yet (tracked in `sent_articles`), or, if nothing's new since
  the last run, the latest available articles again — a digest goes out every
  cycle either way.
- All outbound mail goes through Resend's HTTP API via the shared helper in
  `supabase/functions/_shared/mailer.ts`. Requires `oneaicare.com` to be a
  verified sending domain in Resend (Resend rejects mail to anyone but the
  account owner from an unverified domain).

## One-time setup

1. **Install the Supabase CLI** and log in:
   ```bash
   npm install -g supabase
   supabase login
   ```

2. **Link this repo to your Supabase project** (creates/uses the project
   whose URL is in `.env.example`):
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

3. **Push the migration** (creates `subscribers` and `sent_articles`):
   ```bash
   supabase db push
   ```

4. **Set Edge Function secrets** (`SUPABASE_URL` and the service-role key
   are injected automatically — don't set those yourself):
   ```bash
   supabase secrets set \
     RESEND_API_KEY=re_your_api_key \
     EMAIL_FROM="OneAICare <no-reply@oneaicare.com>" \
     SITE_URL=https://oneaicare.com \
     NOTIFY_SECRET=<generate-a-long-random-string> \
     --project-ref <your-project-ref>
   ```
   Get the API key from https://resend.com/api-keys. Before this can email
   anyone but the Resend account owner, verify `oneaicare.com` as a sending
   domain at https://resend.com/domains (add the DNS records Resend gives
   you) — otherwise every send 403s.

5. **Deploy the functions.** `supabase/config.toml` sets `verify_jwt = false`
   for all three, but pass `--no-verify-jwt` explicitly too — it's required
   if your project uses the newer `sb_publishable_`/`sb_secret_` API keys
   (see the note in Troubleshooting below), and some CLI/dashboard deploy
   paths don't reliably pick up `config.toml`'s per-function setting:
   ```bash
   supabase functions deploy subscribe --project-ref <your-project-ref> --no-verify-jwt
   supabase functions deploy unsubscribe --project-ref <your-project-ref> --no-verify-jwt
   supabase functions deploy notify --project-ref <your-project-ref> --no-verify-jwt
   ```
   All three have their own auth model instead of Supabase's JWT check:
   the publishable/anon key from the browser (subscribe), a plain link from
   email clients (unsubscribe), and the `NOTIFY_SECRET` header (notify).

6. **Add the GitHub Actions secret** so the 6-hourly workflow can trigger
   digests: repo Settings → Secrets and variables → Actions → New repository
   secret → `NOTIFY_SECRET` (same value as step 4). Without it, the
   "Email digest to subscribers" step logs a notice and skips — it never
   fails the build.

7. **Set the frontend env vars** (`.env`, not committed) so the footer form
   points at your project. Use whichever key type your project's
   **Settings → API Keys** page shows you:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   # newer projects (publishable/secret key system):
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
   # OR older projects (legacy JWT keys):
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

## Troubleshooting

**502 Bad Gateway on `subscribe`/`notify` (any payload, immediately):**
almost always means the function crashed at boot rather than during your
request — usually an import that no longer resolves. Check
`supabase functions logs <name> --project-ref <ref>` for a module-resolution
error. `_shared/supabaseAdmin.ts` uses an `npm:` specifier rather than
`deno.land/x` or a bare `esm.sh` URL for exactly this reason — `deno.land/x`
has been deprecated in favor of JSR, and old pinned URLs there can stop
resolving without warning. `_shared/mailer.ts` has no imports at all (plain
`fetch` to Resend's API), so it can't fail this way.

**403 from Resend ("you can only send testing emails to your own email
address"):** the sending domain isn't verified yet — finish the domain
verification step at https://resend.com/domains for `oneaicare.com`.

**New publishable/secret key projects specifically:** Supabase's Edge
Functions only verify JWT-based `anon`/`service_role` keys. If your project
was created with (or migrated to) the `sb_publishable_.../sb_secret_...` key
system, you *must* deploy with `--no-verify-jwt` (step 5) or every request
gets rejected before it reaches the function. The platform also won't
validate the `apikey` header for such functions — that's expected, not a bug;
`subscribe` is meant to be publicly callable anyway.

**Service-role key not found inside a function:** `_shared/supabaseAdmin.ts`
checks both `SUPABASE_SERVICE_ROLE_KEY` (legacy) and `SUPABASE_SECRET_KEYS`
(newer projects, a JSON dict — it reads the `default` entry). Both are
injected automatically; never set either yourself via `supabase secrets set`.

## Testing locally

```bash
# subscribe
curl -X POST https://<ref>.supabase.co/functions/v1/subscribe \
  -H "Content-Type: application/json" -H "apikey: <anon-or-publishable-key>" \
  -d '{"email":"you@example.com"}'

# notify (dry run against current data/news.json, last 24h window)
SUPABASE_URL=https://<ref>.supabase.co NOTIFY_SECRET=<secret> \
  npm run notify-digest
```
