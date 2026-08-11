# EXY Supabase release setup

This is a one-time setup. It keeps Vercel and Android builds on the same
Supabase project and stops a release when the connection variables are absent.

1. In the Vercel project, set these variables for **Production** and **Preview**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Use the Supabase Project URL and the **public anon/publishable** key. Never
   use the `service_role` key in Vercel VITE variables, the website, or the APK.
3. Pull the Vercel variables into the local folder before every Android release:

   `npx vercel env pull .env.local`

4. Check live public database access:

   `npm run backend:check`

5. Build the website or Android app only with these release commands:

   `npm run build:release`

   `npm run android:prepare`

The release preflight blocks if either public Supabase variable is missing or
invalid. Ticker writes go through the verified Admin **Publish Live** path;
local ticker preview can no longer silently pretend to be a database save.
