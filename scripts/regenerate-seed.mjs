// regenerate-seed.mjs — generates 010_taxonomy_seed_v2.sql from src/data/taxonomy.ts
import { TAXONOMY } from './src/data/taxonomy.ts';
import { writeFileSync } from 'node:fs';

const nodes = [];
const attrs = [];

for (const cat of TAXONOMY) {
  nodes.push(`  ('${cat.id}',null,'category','${cat.name.replace(/'/g, "''")}','${cat.id}',0)`);
  for (const sub of cat.children ?? []) {
    nodes.push(`  ('${sub.id}','${cat.id}','subcategory','${sub.name.replace(/'/g, "''")}','${sub.id}',0)`);
    for (const t of sub.children ?? []) {
      nodes.push(`  ('${t.id}','${sub.id}','type','${t.name.replace(/'/g, "''")}','${t.id}',0)`);
    }
  }
  cat.attributes.forEach((a, i) => {
    attrs.push(
      `  ('${cat.id}__${a.key}','${cat.id}','${a.key}','${a.label.replace(/'/g, "''")}','${a.input}','${JSON.stringify(
        a.options ?? [],
      ).replace(/'/g, "''")}'::jsonb,${a.unit ? `'${a.unit}'` : 'null'},${a.required ? 'true' : 'false'},${a.filterable === false ? 'false' : 'true'},${i})`,
    );
  });
}

const sql = `-- ============================================================================
-- EXY - Taxonomy seed v2 (regenerated from src/data/taxonomy.ts)
-- 14 main categories. Run AFTER 005_taxonomy.sql. Idempotent.
-- ============================================================================

insert into public.taxonomy_nodes (id, parent_id, level, name, slug, sort_order) values
${nodes.join(',\n')}
on conflict (id) do update set name = excluded.name, parent_id = excluded.parent_id, sort_order = excluded.sort_order;

insert into public.taxonomy_attributes (id, node_id, key, label, input_type, options, unit, required, filterable, sort_order) values
${attrs.join(',\n')}
on conflict (id) do update set label = excluded.label, options = excluded.options, input_type = excluded.input_type;
`;

writeFileSync('supabase/migrations/010_taxonomy_seed_v2.sql', sql);
console.log(`main: ${TAXONOMY.length}  nodes: ${nodes.length}  attrs: ${attrs.length}`);
