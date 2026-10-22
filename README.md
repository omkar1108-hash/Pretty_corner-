# Pretty Corner

Handmade-accessories shop (chenille flowers, crochet, pearl & kundan jewellery). Everything is made to order, with pickup at stations between **Virar and Borivali**.

This repo holds **two completely separate websites** that share one Supabase database:

| | Folder | What it is | Address (example) | Port (local) |
| --- | --- | --- | --- | --- |
| **Shop** | [`apps/web`](apps/web) | What buyers see. No login. English / हिन्दी / मराठी. | `prettycorner.in` | 3000 |
| **Studio** | [`apps/seller`](apps/seller) | Seller dashboard. Login only. Own design, not linked from the shop, hidden from search engines. | `studio.prettycorner.in` | 3001 |

- [`supabase/schema.sql`](supabase/schema.sql) is the shared database.
- Shop: browse, search, filter, **Buy** → name + pickup station → WhatsApp with product details; **Custom order** form with pictures; the seller is emailed.
- Studio: overview, add / edit / pause / delete products, Materials and Product types (add new on the spot), crafting-material flag, enquiries inbox.

Stack: Next.js 15 · Tailwind CSS 4 · Supabase (database, login, image storage) · Resend (email).

## Run locally

```bash
# shop
cd apps/web
npm install
cp .env.example .env.local     # fill in
npm run dev                    # http://localhost:3000

# studio (second terminal)
cd apps/seller
npm install
cp .env.example .env.local     # fill in
npm run dev                    # http://localhost:3001
```

Without Supabase keys the shop runs in **preview mode** with sample products. The studio needs Supabase.

## One-time setup

### 1. Supabase (free) 
1. Create a project at <https://supabase.com>.
2. **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql), **Run**.
3. **Authentication → Users → Add user**: the seller's email + password (tick *Auto confirm*). That is the only login. Then **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up".
4. **Project Settings → API**: copy the *Project URL* and *anon public* key into **both** apps' `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### 2. Email to the seller (Resend, free) — shop only
1. <https://resend.com> → API key → `RESEND_API_KEY` in `apps/web/.env.local`.
2. `SELLER_EMAIL` is where order and custom-request emails go.
3. The default sender `onboarding@resend.dev` only delivers to the email that owns the Resend account. To email any address, verify a domain in Resend and set `EMAIL_FROM`.

### 3. WhatsApp auto-reply ("we'll revert within 24 hrs")
A website can only open a chat with a pre-filled message; it cannot send a message *from* the seller's number. The free way: in the **WhatsApp Business app** → **Settings → Business tools → Greeting message** → on, with text like:

> Thank you for contacting Pretty Corner! 💖 We will revert to you within 24 hours.
> आपके संदेश के लिए धन्यवाद! हम 24 घंटे के अंदर जवाब देंगे।
> तुमच्या संदेशाबद्दल धन्यवाद! आम्ही 24 तासांत उत्तर देऊ.

The number is `NEXT_PUBLIC_WHATSAPP_NUMBER` (currently `917499521677`).

### 4. Deploy (Vercel, free) — two projects from this one repo
Create **two** Vercel projects, both from this repo:

1. **Shop** → *Root Directory* `apps/web`, env vars from `apps/web/.env.example`. Set `NEXT_PUBLIC_SITE_URL` to the shop's live address (used for product links and photo previews in WhatsApp).
2. **Studio** → *Root Directory* `apps/seller`, env vars from `apps/seller/.env.example`. Set `NEXT_PUBLIC_SHOP_URL` to the shop's live address. Give it its own domain, e.g. `studio.prettycorner.in`.

## Where to change things

| Thing | Where |
| --- | --- |
| Pickup stations, shop name, max custom photos | `apps/web/src/lib/config.ts` |
| Translations | `apps/web/src/lib/i18n.ts` |
| WhatsApp message text | `apps/web/src/lib/whatsapp.ts` |
| Order + custom request API | `apps/web/src/app/api/enquiry/route.ts` |
| Studio colours | `apps/seller/src/app/globals.css` |
| Sample products (preview mode) | `apps/web/src/lib/sample-data.ts` |

Notes
- Photos can't be attached through a WhatsApp link, so messages carry links to the photos. Custom-request emails have the pictures attached.
- Category names are shown as typed (not translated). The studio is English only.
