import type { Listing, SearchFilters, Seller } from '../types';
import { CATEGORY_MAP } from '../data/categories';
import { breadcrumb, nodeName, TAX_MAP, typesOf } from '../data/taxonomy';

export const EMPTY_FILTERS: SearchFilters = {
  keyword: '',
  categoryId: '',
  subCategoryId: '',
  location: 'global',
  city: '',
  mustHaveVideo: false,
  verifiedOnly: false,
  minPrice: null,
  maxPrice: null,
  condition: '',
  sort: 'recent',
};

/**
 * Universal cross-category query engine.
 * Matches keyword against title, description, category, subcategory,
 * tags, features, location and seller identity.
 */
export function applyFilters(
  listings: Listing[],
  filters: SearchFilters,
  sellerMap: Record<string, Seller>,
): Listing[] {
  const keyword = filters.keyword.trim().toLowerCase();
  const terms = keyword ? keyword.split(/\s+/) : [];

  const result = listings.filter((listing) => {
    if (listing.status !== 'active') return false;

    if (terms.length) {
      const seller = sellerMap[listing.sellerId];
      const taxonomyPath = breadcrumb(listing.categoryId, listing.subCategoryId, listing.typeId);
      const legacyCategory = CATEGORY_MAP[listing.categoryId];
      const legacySubcategory = legacyCategory?.children.find((child) => child.id === listing.subCategoryId)?.name ?? '';
      const taxonomyCategory = TAX_MAP[listing.categoryId];
      const taxonomyType = listing.typeId
        ? typesOf(listing.categoryId, listing.subCategoryId).find((type) => type.id === listing.typeId)?.name ?? ''
        : '';
      const attributes = Object.values(listing.attributes ?? {}).join(' ');
      const haystack = [
        listing.title,
        listing.description,
        listing.location,
        listing.city,
        taxonomyPath.join(' '),
        taxonomyCategory?.name ?? '',
        nodeName(listing.categoryId, listing.subCategoryId, listing.typeId),
        legacyCategory?.name ?? '',
        legacySubcategory,
        taxonomyType,
        attributes,
        listing.tags.join(' '),
        listing.features.join(' '),
        seller?.name ?? '',
        seller?.handle ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!terms.every((term) => haystack.includes(term))) return false;
    }

    if (filters.categoryId && listing.categoryId !== filters.categoryId) return false;
    if (filters.subCategoryId && listing.subCategoryId !== filters.subCategoryId) return false;
    if (filters.location === 'india' && listing.region !== 'india') return false;
    if (filters.location === 'regional' && filters.city && listing.city !== filters.city) return false;
    if (filters.mustHaveVideo && !listing.video) return false;
    if (filters.verifiedOnly && (sellerMap[listing.sellerId]?.verification ?? 'none') === 'none') return false;
    if (filters.minPrice != null && listing.price < filters.minPrice) return false;
    if (filters.maxPrice != null && listing.price > 0 && listing.price > filters.maxPrice) return false;
    if (filters.condition && listing.condition !== filters.condition) return false;
    return true;
  });

  const sorted = [...result];
  switch (filters.sort) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'popular':
      sorted.sort((a, b) => b.viewCount + b.saveCount * 3 - (a.viewCount + a.saveCount * 3));
      break;
    default:
      sorted.sort(
        (a, b) => Number(b.featured) - Number(a.featured) || +new Date(b.createdAt) - +new Date(a.createdAt),
      );
  }
  return sorted;
}
