# iNKVRSE.OS

MONOLITH - The Universe of Ink.

Launch-ready founder landing page for iNKVRSE with Vercel API routes for waitlist capture and Stripe checkout.

## Local Setup

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env.local` and add Supabase + Stripe values.

Required variables:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_FOUNDATION_ARTIST`
- `STRIPE_PRICE_FOUNDATION_STUDIO`
- `STRIPE_PRICE_FOUNDATION_SUPPLIER`

## Supabase

Run `supabase/schema.sql` in the Supabase SQL editor.

## Deploy

Import this repository into Vercel, or connect it to the existing `inkvrse-os` project. The app builds static files into `dist` and keeps API routes under `/api`.
