import { existsSync, readFileSync } from 'node:fs';

const candidates = ['.env.production.local', '.env.local', '.env.production', '.env'];
const values = { ...process.env };

for (const file of candidates) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in values) continue;
    values[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

const url = (values.VITE_SUPABASE_URL ?? '').trim();
const key = (values.VITE_SUPABASE_ANON_KEY ?? '').trim();
let problem = '';

if (!url || !key) {
  problem = 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.';
} else {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) {
      problem = 'VITE_SUPABASE_URL must be an HTTPS *.supabase.co URL.';
    }
  } catch {
    problem = 'VITE_SUPABASE_URL is invalid.';
  }
  if (!problem && (key.length < 20 || /your_|placeholder|example/i.test(key))) {
    problem = 'VITE_SUPABASE_ANON_KEY is missing or still a placeholder.';
  }
}

if (problem) {
  console.error(`\nEXY release blocked: ${problem}`);
  console.error('Run: npx vercel env pull .env.local   (after linking the Vercel project)');
  process.exit(1);
}

console.log(`EXY Supabase release preflight passed for ${new URL(url).host}.`);
