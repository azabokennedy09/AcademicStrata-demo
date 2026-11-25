# Security notes for Academic Strata

## Order of deployment
1. Supabase > SQL Editor: run `update-3-security.sql` once (safe to repeat).
2. Push the code to GitHub; Cloudflare redeploys it.
3. Open the site, press F12 > Console, and check there is no red "Refused to load ... Content Security Policy" message
   (the site also shows a red bar at the bottom if something is blocked). If a script is blocked, put the old
   `script-src` line back in `_headers` and tell the developer.

## What the code and database now enforce
- Only GET/HEAD requests reach the site; private files (SQL, README, config files, dotfiles) return 404.
- Security headers are added by the Worker even if `_headers` is missing; the CSP only allows the two exact
  script files from jsDelivr (both also pinned by SRI hashes) instead of the whole CDN.
- Nobody can change a role through the API. Make admins only in the Supabase SQL editor:
  `update public.profiles set role = 'admin' where email = '...';`
- Contact and subscribe forms: size limits, format checks, 5 sends per hour per visitor address.
  Visitor addresses are stored only as a one-way hash and deleted after 24 hours (mention this in the privacy page).
- Orders must belong to the signed-in member, be "pending", and name a real guide (20 per day).
- Uploads: own folder only, safe file name (`uuid.pdf` / `uuid.docx`), at most 25 files per member.
- A file that has been approved as a resource can no longer be deleted or swapped by the uploader.
- A submission can only point to a file the sender uploaded; the Approve button re-checks this, and "Open file"
  now opens a short-lived signed link instead of a link typed by the sender.

## Steps only you can do (dashboards)
Cloudflare: turn on 2FA; SSL/TLS mode "Full (strict)"; "Always Use HTTPS"; Minimum TLS 1.2; Bot Fight Mode;
one WAF rate-limit rule (for example 100 requests per 10 seconds per IP); DNSSEC; keep API tokens scoped and out of the repo.
Supabase: turn on "Confirm email"; set Auth > URL Configuration so Site URL and Redirect URLs list only
https://academicstrata.com (no wildcards, no localhost); minimum password length 10 or more; disable sign-in
providers you do not use; check backups for your plan and export data regularly. Optional next step: Auth >
Attack Protection > enable CAPTCHA (Cloudflare Turnstile) and add the widget to the sign-up and sign-in forms.
GitHub: turn on 2FA, secret scanning with push protection, and branch protection for `main`. Delete or disable GitHub
Pages (Settings > Pages) because the site is hosted on Cloudflare and a second copy would have no security headers.
Gmail and PayPal: 2FA on both. Confirm payments inside PayPal itself, never from an email or screenshot.

## Known gaps
- `download_counts` and `bump_download` are used by the site but are not defined in `setup.sql`. Check in the SQL
  editor that RLS is on for that table and that the function only increments a counter.
- `style-src` still allows 'unsafe-inline' because the pages use about 70 inline style attributes.
- Admin login has no second factor inside the site; protect the admin email account with 2FA.
