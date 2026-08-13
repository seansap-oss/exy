# EXY v1.5.17 — social playback and taxonomy repair

## What changed

- Android now calls `https://exy-green.vercel.app/api/oembed` for Instagram and Facebook instead of a non-existent local `/api/oembed` route.
- Facebook shared links keep their original URL. EXY no longer rewrites normal Facebook `/videos/` URLs into `/reel/` URLs.
- Facebook share URLs (`/share/v/…` and `/share/r/…`) are accepted by the oEmbed endpoint.
- When Meta reports a post is private, deleted, restricted, or not embeddable, EXY shows a branded listing state with the title and an **Open on Facebook/Instagram** action. It no longer exposes Meta's blank/error frame.
- The Express Post drawer now uses the same **Main category → Subcategory → Type** picker as bulk import and search. It never silently assigns the first subcategory.
- The production health check now fails if taxonomy tables, taxonomy data, or social provider fields are missing.

## Important provider limitation

Meta no longer returns reusable Instagram/Facebook thumbnail URLs. EXY keeps a branded listing fallback until the seller adds a cover image. A public, embeddable post can play in the official provider player; a private/restricted post cannot be made playable by EXY.

## Required Supabase migration check

Run these existing migrations in the Supabase SQL Editor, in this order, if they have not already been run:

1. `supabase/migrations/005_taxonomy.sql`
2. `supabase/migrations/010_taxonomy_seed_v2.sql`

Then run `npm run backend:check` locally after pulling the production Vercel environment. The command verifies the live tables, provider fields, and at least 14 active top-level taxonomy categories.
