# Pretty Corner

Website for a handmade-accessories shop (chenille flowers, crochet, pearl & kundan jewellery).
Everything is made to order, with pickup at stations between **Virar and Borivali**.

- **Buyers** (no login): browse, search, filter, tap **Buy** → enter name + pickup station → WhatsApp opens with the product details, and the seller is emailed. There is also a **Custom order** form with pictures. The site is in English, हिन्दी and मराठी.
- **Seller** (login at `/admin`): add / edit / pause / delete products, manage Materials and Product types, and see every enquiry.

Stack: Next.js 15 (App Router) · Tailwind CSS 4 · Supabase (database, login, image storage) · Resend (email).

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

Without Supabase keys the site runs in **preview mode** with sample products, so you can see it straight away. The seller area needs Supabase.

## One-time setup

### 1. Supabase (free)
1. Create a project at <https://supabase.com>.
2. **SQL Editor → New query**, paste everything from [`supabase/schema.sql`](supabase/schema.sql), **Run**. This creates the tables, security rules, the two image buckets and the starter categories.
3. **Authentication → Users → Add user**: create the seller's email + password (tick *Auto confirm*). That is the only login. Then **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up" so nobody else can create an account.
4. **Project Settings → API**: copy the *Project URL* and the *anon public* key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 2. Email to the seller (Resend, free tier)
1. Sign up at <https://resend.com>, create an API key → `RESEND_API_KEY`.
2. `SELLER_EMAIL` is where order and custom-request emails go.
3. The default sender `onboarding@resend.dev` only delivers to the email that owns the Resend account. To email any address, verify a domain in Resend and set `EMAIL_FROM`.

### 3. WhatsApp auto-reply ("we'll revert within 24 hrs")
A website can only open a WhatsApp chat with a pre-filled message; it cannot send a message *from* the seller's number. The free way to get the automatic reply:

In the **WhatsApp Business app** on the seller's phone: **Settings → Business tools → Greeting message** → turn on, and use text like:

> Thank you for contacting Pretty Corner! 💖 We will revert to you within 24 hours.
> आपके संदेश के लिए धन्यवाद! हम 24 घंटे के अंदर जवाब देंगे।
> तुमच्या संदेशाबद्दल धन्यवाद! आम्ही 24 तासांत उत्तर देऊ.

(The number is set by `NEXT_PUBLIC_WHATSAPP_NUMBER`, currently `918655434260`.)

### 4. Deploy (Vercel, free)
Import this repo at <https://vercel.com>, add the environment variables from `.env.example`, and set `NEXT_PUBLIC_SITE_URL` to the live address. Product links inside WhatsApp messages use that URL, and WhatsApp shows the product photo as a preview of the link.

## How things work

| Thing | Where |
| --- | --- |
| Pickup stations, shop name, number of custom photos | `src/lib/config.ts` |
| Translations (English / Hindi / Marathi) | `src/lib/i18n.ts` |
| WhatsApp message text | `src/lib/whatsapp.ts` |
| Order + custom request API (saves, emails, builds WhatsApp link) | `src/app/api/enquiry/route.ts` |
| Database tables and security rules | `supabase/schema.sql` |
| Sample products (preview mode only) | `src/lib/sample-data.ts` |

Notes
- **Photos in WhatsApp:** the WhatsApp link can't attach files, so messages contain links to the photos. For custom requests, the email to the seller has the pictures attached.
- **Categories:** *Material* and *Product type* are separate lists. In the product form choose **+ Add new…** to create one on the spot. A product can be marked **Crafting material** to sell supplies; buyers can filter by that.
- Category names are shown as typed (they aren't translated).
- The seller area is English only.
