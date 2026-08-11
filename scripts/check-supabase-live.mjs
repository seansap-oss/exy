import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const values = { ...process.env };
for (const file of ['.env.production.local', '.env.local', '.env.production', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in values) continue;
    values[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

const url = (values.VITE_SUPABASE_URL ?? '').trim();
const key = (values.VITE_SUPABASE_ANON_KEY ?? '').trim();
if (!url || !key) {
  console.error('EXY backend check blocked: run `npx vercel env pull .env.local` first.');
  process.exit(1);
}

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const checks = [
  ['profiles', 'profiles'],
  ['listings', 'listings'],
  ['ticker', 'ticker_settings'],
];

let failures = 0;
for (const [label, table] of checks) {
  const { error } = await client.from(table).select('id').limit(1);
  if (error) {
    failures += 1;
    console.error(`FAIL ${label}: ${error.message}`);
  } else {
    console.log(`PASS ${label}`);
  }
}

if (failures) {
  console.error(`EXY backend check failed: ${failures} required table(s) are unavailable.`);
  process.exit(1);
}
console.log('EXY backend check passed: public read path is healthy.');
