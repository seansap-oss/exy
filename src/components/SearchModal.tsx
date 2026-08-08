import { useEffect, useMemo, useRef, useState } from 'react';
import type { Listing, SearchFilters, Seller } from '../types';
import { CATEGORIES, CATEGORY_MAP } from '../data/categories';
import { inr } from '../lib/format';
import { applyFilters, EMPTY_FILTERS } from '../lib/search';
import { Modal, Switch } from './Ui';
import { IconFilter, IconSearch, IconVideo } from './Icons';

interface Props {
  open: boolean;
  onClose: () => void;
  listings: Listing[];
  sellerMap: Record<string, Seller>;
  cities: string[];
  filters: SearchFilters;
  onFilters: (filters: SearchFilters) => void;
  onOpenListing: (id: string) => void;
  onSeeAll: () => void;
}

export function SearchModal({
  open,
  onClose,
  listings,
  sellerMap,
  cities,
  filters,
  onFilters,
  onOpenListing,
  onSeeAll,
}: Props) {
  const [draft, setDraft] = useState<SearchFilters>(filters);
  const [geoState, setGeoState] = useState<'idle' | 'asking' | 'granted' | 'denied'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(filters);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open, filters]);

  const results = useMemo(() => applyFilters(listings, draft, sellerMap), [listings, draft, sellerMap]);
  const subs = draft.categoryId ? (CATEGORY_MAP[draft.categoryId]?.children ?? []) : [];

  const set = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  function requestGeo() {
    setGeoState('asking');
    if (!navigator.geolocation) {
      setGeoState('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeoState('granted');
        setDraft((prev) => ({ ...prev, location: 'regional', city: prev.city || cities[0] || '' }));
      },
      () => setGeoState('denied'),
      { timeout: 8000 },
    );
  }

  function commit() {
    onFilters(draft);
    onSeeAll();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} size="wide" bare>
      <div className="modal__head">
        <div className="search__bar" style={{ flex: 1 }}>
          <IconSearch size={19} />
          <input
            ref={inputRef}
            value={draft.keyword}
            onChange={(event) => set('keyword', event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && commit()}
            placeholder="Search everything — suits, bricks, 3BHK, roofing contractor, refurbished laptop…"
            aria-label="Search listings"
          />
          <button className="btn btn--primary btn--sm" onClick={commit}>
            Search
          </button>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close search">
          ✕
        </button>
      </div>

      <div className="search__layout">
        <aside className="search__filters">
          <div className="filter-group">
            <div className="filter-group__title">
              <IconFilter size={12} /> Broad Category
            </div>
            <select
              className="select"
              value={draft.categoryId}
              onChange={(event) => setDraft((prev) => ({ ...prev, categoryId: event.target.value, subCategoryId: '' }))}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {subs.length > 0 && (
              <select
                className="select"
                style={{ marginTop: 9 }}
                value={draft.subCategoryId}
                onChange={(event) => set('subCategoryId', event.target.value)}
              >
                <option value="">All subcategories</option>
                {subs.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="filter-group">
            <div className="filter-group__title">Location</div>
            <div className="chips">
              {(['global', 'india', 'regional'] as const).map((scope) => (
                <button
                  key={scope}
                  className={`chip chip--sm${draft.location === scope ? ' is-on' : ''}`}
                  onClick={() => set('location', scope)}
                >
                  {scope === 'global' ? 'Global' : scope === 'india' ? 'India' : 'Regional'}
                </button>
              ))}
            </div>
            {draft.location === 'regional' && (
              <>
                <select
                  className="select"
                  style={{ marginTop: 10 }}
                  value={draft.city}
                  onChange={(event) => set('city', event.target.value)}
                >
                  <option value="">Any city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <button className="btn btn--soft btn--sm" style={{ marginTop: 9, width: '100%' }} onClick={requestGeo}>
                  {geoState === 'granted'
                    ? '✓ Location detected'
                    : geoState === 'denied'
                      ? 'Permission denied — pick manually'
                      : geoState === 'asking'
                        ? 'Requesting…'
                        : 'Use my location'}
                </button>
              </>
            )}
          </div>

          <div className="filter-group">
            <div className="filter-group__title">Visual / Video Status</div>
            <Switch
              on={draft.mustHaveVideo}
              onChange={(value) => set('mustHaveVideo', value)}
              label="Must have video"
              hint="Reels, Shorts & FB video only"
            />
          </div>

          <div className="filter-group">
            <div className="filter-group__title">Verification</div>
            <Switch
              on={draft.verifiedOnly}
              onChange={(value) => set('verifiedOnly', value)}
              label="EXY Verified only"
              hint="Verified Business or Inspector"
            />
          </div>

          <div className="filter-group">
            <div className="filter-group__title">Price range (₹)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                type="number"
                min={0}
                placeholder="Min"
                value={draft.minPrice ?? ''}
                onChange={(event) => set('minPrice', event.target.value ? Number(event.target.value) : null)}
              />
              <input
                className="input"
                type="number"
                min={0}
                placeholder="Max"
                value={draft.maxPrice ?? ''}
                onChange={(event) => set('maxPrice', event.target.value ? Number(event.target.value) : null)}
              />
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-group__title">Condition</div>
            <select
              className="select"
              value={draft.condition}
              onChange={(event) => set('condition', event.target.value as SearchFilters['condition'])}
            >
              <option value="">Any condition</option>
              <option value="new">New</option>
              <option value="like-new">Like new</option>
              <option value="good">Good</option>
              <option value="used">Used</option>
              <option value="service">Service / Contract</option>
            </select>
          </div>

          <div className="filter-group">
            <div className="filter-group__title">Sort by</div>
            <select
              className="select"
              value={draft.sort}
              onChange={(event) => set('sort', event.target.value as SearchFilters['sort'])}
            >
              <option value="recent">Most recent</option>
              <option value="popular">Most popular</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>

          <button className="btn btn--ghost btn--sm btn--block" onClick={() => setDraft(EMPTY_FILTERS)}>
            Reset all filters
          </button>
        </aside>

        <div className="search__results">
          <div className="toolbar" style={{ marginBottom: 12 }}>
            <b style={{ fontSize: 13.5 }}>
              {results.length} {results.length === 1 ? 'match' : 'matches'}
            </b>
            <span className="toolbar__spacer" />
            <button className="btn btn--soft btn--sm" onClick={commit}>
              See all results
            </button>
          </div>

          {results.length === 0 ? (
            <div className="empty" style={{ padding: '40px 12px' }}>
              <b>No listings matched</b>
              <p>Try widening the location scope or turning off the "must have video" filter.</p>
            </div>
          ) : (
            results.slice(0, 24).map((listing) => (
              <button
                key={listing.id}
                className="result-row"
                onClick={() => {
                  onOpenListing(listing.id);
                  onClose();
                }}
              >
                <span
                  className="result-row__thumb"
                  style={
                    listing.video?.poster
                      ? { backgroundImage: `url(${listing.video.poster})`, backgroundSize: 'cover' }
                      : { background: listing.photos[0] }
                  }
                >
                  {listing.video && (
                    <i>
                      <IconVideo size={10} />
                    </i>
                  )}
                </span>
                <span className="result-row__main">
                  <b>{listing.title}</b>
                  <span>
                    {CATEGORY_MAP[listing.categoryId]?.name} · {listing.location}
                  </span>
                </span>
                <span className="result-row__price">{inr(listing.price)}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
