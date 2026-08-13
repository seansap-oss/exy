# EXY v1.5.20 — Master marketplace taxonomy expansion

This release is additive only. It does not redesign or remove any EXY screen,
route, listing, user, media record, policy, or existing taxonomy node.

## Included

- Parent-safe Supabase migration: `014_marketplace_taxonomy_master_expansion.sql`
- Expanded motors: vehicle body styles, motorcycle styles, e-bikes, bicycles,
  marine/watercraft, commercial vehicles, parts and accessories
- Expanded property, home, electronics, fashion, family, jobs, hobbies, pets,
  services and business/commercial classifications
- Extra searchable/filterable attributes for vehicles, jobs, property and
  electronics
- Purpose-specific SVG icons for the existing category rail; no layout change
- Shared web and Android taxonomy updates, versioned as `1.5.20`
- The final search-field upsert resolves by the database's real unique key,
  `(node_id, key)`, so an existing `Body style` field is updated rather than duplicated

## Supabase order

Your database screenshots already confirm that migrations 010, 012 and 013
are present. Run only migration 014 next. It is safe to run more than once.

## Important

Database taxonomy is not a video-player or social-provider fix. This release
does not alter Facebook, Instagram, YouTube, feed scaling, embeds, or media
fallback behaviour.
