import type { Category } from '../types';
import { TAXONOMY, type TaxNode } from './taxonomy';

/**
 * Compatibility view for the existing category rail, browse page and legacy
 * listings. The taxonomy is the only editable source of category data.
 * This adapter deliberately preserves the existing Category UI contract.
 */
const ICONS: Record<string, string> = {
  electronics: `<rect x="4" y="4" width="16" height="12" rx="1"/><path d="M8 20h8M12 16v4"/>`,
  vehicles: `<path d="M3 13l2-5h14l2 5v6H3z"/><path d="M3 13h18M7 17h.01M17 17h.01"/><path d="M7 8V5h10v3"/>`,
  property: `<path d="M3 11.5L12 4l9 7.5V20H3z"/><path d="M9 20v-5h6v5"/>`,
  home: `<path d="M3 11.5L12 4l9 7.5V20H3z"/><path d="M9 20v-5h6v5"/>`,
  fashion: `<path d="M7 5l2-2h6l2 2 3 2-2 4-2-1v10H8V10l-2 1-2-4z"/>`,
  jobs: `<rect x="4" y="7" width="16" height="13" rx="1"/><path d="M8 7V5h8v2M4 12h16M10 12v2h4v-2"/>`,
  services: `<path d="M14.5 6.5a4 4 0 01-5.4 5.4L4 17v3h3l5.1-5.1a4 4 0 005.4-5.4l-2.3 2.3-2-2z"/>`,
  business: `<path d="M3 21V8l5-3 5 3v13M13 21V4l5-2 3 2v17M2 21h20"/>`,
  appliances: `<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6M9 12h.01M15 12h.01M9 16h.01M15 16h.01"/>`,
  leisure: `<path d="M5 5h14v14H5z"/><path d="M9 5v14M5 9h4M5 15h4M13 9h6M13 15h6"/>`,
  agri: `<path d="M12 21V11M12 14c-5 0-7-3-7-7 5 0 7 3 7 7zM12 11c0-5 3-8 7-8 0 5-2 8-7 8z"/>`,
  family: `<path d="M6 20v-7a6 6 0 0112 0v7M3 20h18M9 7a3 3 0 116 0"/>`,
  education: `<path d="M3 7l9-4 9 4-9 4z"/><path d="M6 9v5c3 2 9 2 12 0V9M21 8v6"/>`,
  travel: `<path d="M3 14l18-5-7 7-3-1-3 4-2-1 1-4z"/>`,
  community: `<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20c.5-4 3-6 5-6s4.5 2 5 6M11 20c.5-3 2.5-5 5-5s4.5 2 5 5"/>`,
};
const ICON = ICONS.business;
const ACCENTS = ['#e0851b', '#2563eb', '#0ea5a4', '#7c3aed', '#16a34a', '#f2713a'];

function tags(node: TaxNode): string[] {
  return [node.name, ...(node.children?.map((child) => child.name) ?? [])]
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 2)
    .slice(0, 12);
}

export const CATEGORIES: Category[] = TAXONOMY.map((category, index) => ({
  id: category.id,
  name: category.name,
  slug: category.id,
  accent: ACCENTS[index % ACCENTS.length],
  blurb: `${category.name} listings, services and local offers.`,
  icon: ICONS[category.id] ?? ICON,
  children: (category.children ?? []).map((child) => ({
    id: child.id,
    name: child.name,
    slug: child.id,
    tags: tags(child),
  })),
}));

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category]),
);

export function findSubCategory(categoryId: string, subId: string) {
  return CATEGORY_MAP[categoryId]?.children.find((child) => child.id === subId);
}

export function categoryName(categoryId: string): string {
  return CATEGORY_MAP[categoryId]?.name ?? 'Uncategorised';
}

export function subCategoryName(categoryId: string, subId: string): string {
  return findSubCategory(categoryId, subId)?.name ?? '';
}

export const ALL_TAGS = Array.from(
  new Set(CATEGORIES.flatMap((category) => category.children.flatMap((child) => child.tags))),
).sort();
