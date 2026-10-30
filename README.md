# Academicstrata website: setup guide

This folder is the complete website. It needs two free services: **Supabase** (accounts, database, file storage) and any static host (**Netlify**, Cloudflare Pages or Vercel).

## What works once it is set up
- Sign Up and Sign In with email and password (real accounts, with a Sign Out button)
- Members upload PDF or Word (.docx) files, up to 20 MB. Files wait for admin approval
- Admin approves or rejects files, marks them Free or Premium, and removes them
- Free guides download for everyone. Premium files are locked on the server and open only for members you grant access to
- Contact form and Subscribe box save to your Admin page
- Blog with three starter articles; resources and posts are public to read

## Step 1: Create the Supabase project (10 minutes)
1. Go to supabase.com, create a free account and a **New project** (save the database password).
2. Open **SQL Editor > New query**, paste the whole of `setup.sql` and press **Run**. It should say "Success".
3. Open **Project Settings > API Keys**. Copy the **Project URL** and the **Publishable key** (it starts with `sb_publishable_`). If you only see a **Legacy API Keys** tab, copy the `anon` key from there instead. Never use the `secret` or `service_role` key.
4. Open `config.js` in this folder and paste both values between the quotes.

## Step 2: Put the site online
- **Netlify:** go to app.netlify.com/drop and drag this whole folder onto the page. You get a link at once. Add your own domain under Domain settings.
- Cloudflare Pages and Vercel also work: upload the folder as a static site with no build command.

## Step 3: Allow sign-in on your site address
In Supabase open **Authentication > URL Configuration**. Set **Site URL** to your website address (for example https://yourname.netlify.app).

## Step 4: Make yourself the admin
1. Open your website and use **Sign Up** with info@kenstrata.com. Confirm the email if Supabase sends one.
2. In Supabase **SQL Editor** run:

    update public.profiles set role = 'admin' where email = 'info@kenstrata.com';

3. Sign in again. An **Admin** button now appears in the header.

## Everyday use
- **Approve files:** Resources page > "Pending review" > tick Premium if needed > Approve.
- **Give premium access:** Admin page > enter the member's email > Grant. Do this when a student has paid you (for example by mobile money). They must have signed up first.
- **Read messages and subscribers:** Admin page.
- **Add another admin:** run the same SQL line with their email.

## Good to know
- **Payments are manual.** The site does not charge money. You collect payment yourself, then press Grant. Automatic payments need a provider such as Flutterwave and extra work.
- **Spam.** Anyone can send a contact message. If spam appears, add a captcha (Supabase supports Cloudflare Turnstile).
- **Free plan.** Supabase pauses inactive free projects after a week. Open the dashboard to wake it.
- **Search engines.** Links like #blog and #post-... are page sections, which search engines handle poorly. For strong Google results you would later move to a framework with real page addresses.
- **Legal pages.** The Privacy, Terms and Cookie pages are drafts. Have a lawyer check them, and fill the [BRACKETS] in the Terms.
- **Still to personalise:** team names and photos, social media links, and the About text.

## Files
index.html (the site), backend.js (connects to Supabase), config.js (your two keys), setup.sql (database), thumbs/ (blog pictures), logo/ (logo files).


## Updating an existing setup
If you already ran `setup.sql` before, also run `update-1.sql` once in the Supabase SQL Editor. It is needed for the new **Page text** editor on the Admin page.

## New admin tools
On the **Admin** page you can write, edit and delete blog posts (with a thumbnail picture), and edit the wording of the About, Services and Team pages.
