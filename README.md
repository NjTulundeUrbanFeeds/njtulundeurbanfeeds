# NJ Tulunde Urban Feeds website (final): GitHub + Vercel + Supabase

## 1. Supabase (once, 5 minutes)
1. Supabase > SQL Editor > New query > paste all of `supabase-setup.sql` > Run.
   It is safe to run again. If your site is already live it also upgrades your database to the new categories (your existing products are moved into them).
2. Authentication > Users > Add user: email `njtulundeurbanfeeds@gmail.com`, a long strong password, tick Auto Confirm User.
3. Authentication > Sign In / Providers: turn OFF "Allow new users to sign up".
4. Optional but recommended: Authentication > Multi-factor: enable TOTP so login needs a phone code too.
5. `js/config.js` and `api/_cfg.js` already hold your project URL and public anon key (safe to publish). NEVER paste the service_role key anywhere in this project.

## 2. GitHub and Vercel
1. Put the contents of this folder in a GitHub repo (`index.html` at the repo root, not inside a sub-folder).
2. vercel.com > Add New > Project > import the repo > Deploy. No build settings are needed.
3. Open `yourproject.vercel.app/admin` and log in with the Supabase user from step 1.2.

## 3. Domain (Hostinger)
1. Buy the domain (this site assumes `njtulundeurbanfeeds.com`).
2. Vercel > Project > Settings > Domains > add it (and `www`). Vercel shows the exact DNS records.
3. Hostinger > Domains > DNS: add the records Vercel shows (A record for `@`, CNAME for `www`).
4. Different domain? Find-and-replace `njtulundeurbanfeeds.com` in all `.html`, `robots.txt`, `api/_cfg.js`, `.well-known/security.txt`.

## 4. What the admin does (`/admin`)
- Product categories panel: Animal Feeds, Silage Making, Silage Chopping Machines, Farm Tools, Supplements, Farm Services. Tap "+ Add" on a category to add a product to it.
- Add / edit / remove products with a photo, price and badge. "Hide" takes a product off the website without deleting it.
- Photos are shrunk and cleaned in your browser before upload (fast pages, phone location data removed).
- Blog articles and videos, and the home intro video.
- Logs you out after 30 minutes of no activity.

## 5. How customers order
Products page > Add to Cart (any number of items) > cart button > name, phone, location, pickup or delivery > Send Order on WhatsApp.
The message lists the customer details, every item with quantity and price, and a photo link for each product. Pick-up at Mwera goes to the Mwera WhatsApp, everything else to 0751282930.
There is no single-product page by design.

## 6. Categories (developer note)
`js/cats.js` is the one list used by the home page, Products tabs and the admin dropdown. Home cards and footer links point to `/products?c=<category>`. To add a new category: add it in `js/cats.js` and in the `products_category_check` line of `supabase-setup.sql`, then run the SQL again.

## 7. Security in this project
- Strict Content-Security-Policy, HSTS, no framing, nosniff, referrer and permissions policies (`vercel.json`).
- Database rules (RLS): everyone can read, only the one admin email can write. Photo bucket accepts images only, 5MB max, only admin can upload.
- All text from the database is escaped before display; image links must be https or on this site.
- Order details are never stored by the site; they only go to your WhatsApp. The cart lives in the customer's own browser.
- Admin page is `noindex`, not cached, and blocked in `robots.txt`.
- Keep the admin password private, use MFA, and do not share the Supabase dashboard login.
- Optional later: add SRI hashes to the Font Awesome and supabase-js tags (needs internet access to generate them).

## 8. SEO in this project
- Unique title, description, canonical and social tags on every page; structured data for the business (both branches), product categories, FAQ, breadcrumbs and each blog article; `/sitemap.xml` updates itself when you publish an article; custom 404 page.
- After launch: Google Search Console > add the domain > submit `https://yourdomain/sitemap.xml`. Create a Google Business Profile for both branches and link the site. Post a blog article or video every week from `/admin`.
