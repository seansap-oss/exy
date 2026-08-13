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
  ['taxonomy nodes', 'taxonomy_nodes'],
  ['taxonomy attributes', 'taxonomy_attributes'],
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

// Taxonomy must be present in production. The app ships a client-side fallback
// for browsing, but the database seed is required for reliable admin, search,
// bulk-import and future server-side filtering behaviour.
const { count: categoryCount, error: taxonomyCountError } = await client
  .from('taxonomy_nodes')
  .select('id', { count: 'exact', head: true })
  .eq('level', 'category')
  .eq('active', true);

if (taxonomyCountError) {
  failures += 1;
  console.error(`FAIL taxonomy seed: ${taxonomyCountError.message}`);
} else if ((categoryCount ?? 0) < 15) {
  failures += 1;
  console.error(`FAIL taxonomy seed: expected at least 15 active top-level categories, found ${categoryCount ?? 0}. Run migrations 012 and 013.`);
} else {
  console.log(`PASS taxonomy seed (${categoryCount} top-level categories)`);
}

const requiredTaxonomyNodes = ['veh-ebikes', 'veh-cycle-parts', 'job-trades', 'prp-for-rent', 'hom-furniture', 'ele-mobile-phones', 'family'];
const { data: requiredNodes, error: requiredNodesError } = await client
  .from('taxonomy_nodes')
  .select('id')
  .in('id', requiredTaxonomyNodes)
  .eq('active', true);

if (requiredNodesError) {
  failures += 1;
  console.error(`FAIL comprehensive taxonomy: ${requiredNodesError.message}`);
} else {
  const found = new Set((requiredNodes ?? []).map((node) => node.id));
  const missing = requiredTaxonomyNodes.filter((id) => !found.has(id));
  if (missing.length) {
    failures += 1;
    console.error(`FAIL comprehensive taxonomy: missing ${missing.join(', ')}. Run 012_vehicle_taxonomy_expansion.sql and 013_comprehensive_classified_taxonomy.sql.`);
  } else {
    console.log('PASS comprehensive taxonomy (motors, jobs, property, home, electronics and family)');
  }
}

// Provider fields preserve original social URLs. Their absence causes old rows
// to lose provider identity and fall into a generic card path.
const { error: providerFieldsError } = await client
  .from('listings')
  .select('id, provider, provider_media_id, video_url')
  .limit(1);
if (providerFieldsError) {
  failures += 1;
  console.error(`FAIL provider media fields: ${providerFieldsError.message}`);
} else {
  console.log('PASS provider media fields');
}

if (failures) {
  console.error(`EXY backend check failed: ${failures} required table(s) are unavailable.`);
  process.exit(1);
}
console.log('EXY backend check passed: public read path is healthy.');
