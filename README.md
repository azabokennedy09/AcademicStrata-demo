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
1. Open your website and use **Sign Up** with azabokennedy09@gmail.com. Confirm the email if Supabase sends one.
2. In Supabase **SQL Editor** run:

    update public.profiles set role = 'admin' where email = 'azabokennedy09@gmail.com';

3. Sign in again. An **Admin** button now appears in the header.

## Everyday use
- **Approve files:** Resources page > "Pending review" > tick Premium if needed > Approve.
- **Give premium access:** Admin page > enter the member's email > Grant. Do this when a student has paid you (for example by mobile money). They must have signed up first.
- **Read messages and subscribers:** Admin page.
- **Add another admin:** run the same SQL line with their email.

## Good to know
- **Payments (PayPal, $1 per premium guide).** See the section below. You confirm each payment yourself in PayPal, then press Unlock.
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


## Premium guides: $1 each with PayPal
1. In Supabase SQL Editor run `update-2.sql` once (new installs already have it inside `setup.sql`).
2. On the Resources page, tick **Premium** on each guide you want to sell.
3. A signed-in member presses **Pay $1 with PayPal** on a premium guide. The site saves a pending order and opens your PayPal button in a new tab.
4. When the payment shows in your PayPal account, open the **Admin** page, find the order under **Premium orders**, and press **Unlock**. The guide then shows a Download button for that member only.
5. **Dismiss** removes an order that was never paid.

Important about the PayPal button (hosted_button_id PKQP4Q6EZ8NDU):
- The button image in your code says **Subscribe**. If it is a subscription button, buyers are charged again and again. For one-time $1 payments, create a **Buy Now** button in PayPal (Pay & Get Paid > Payment links and buttons), set the price to 1.00 USD, and replace `hosted_button_id` in `index.html` (search for PKQP4Q6EZ8NDU).
- One button has one fixed price, so every premium guide costs $1.
- The site cannot check PayPal itself. That is why you press Unlock. Automatic unlocking needs a PayPal webhook and a server function, which can be added later.
- In PayPal you can set a **return URL** (your site address) so buyers come back to the site after paying.
