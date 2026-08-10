import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  Category,
  DealerQuote,
  Listing,
  NativeMedia,
  Profile,
  Seller,
  SubCategory,
  TickerConfig,
  TickerFont,
  TickerSegment,
  VerificationLevel,
} from '../types';
import { parseVideoUrl, providerLabel } from '../lib/embeds';
import { compact, inr, slugify } from '../lib/format';
import { uid } from '../lib/storage';
import { isSupabaseLive } from '../lib/supabase';
import { saveListing, saveTicker, setListingPublished, validateForPublish, type PublishState } from '../lib/publish';
import { removeListing } from '../lib/listingsStore';
import {
  BG_PRESETS,
  BG_SWATCHES,
  HEIGHT_PRESETS,
  ICON_LIBRARY,
  newSegment,
  TEXT_COLORS,
  TICKER_FONT_LABELS,
} from '../lib/ticker';
import { TickerTape, TickerStack } from './TickerTape';
import { MediaUploader } from './MediaUploader';
import { BulkImport } from './BulkImport';
import { Switch } from './Ui';
import {
  IconBadge,
  IconChart,
  IconCheck,
  IconCopy,
  IconFilm,
  IconLayers,
  IconLink,
  IconList,
  IconLoop,
  IconMegaphone,
  IconPause,
  IconPlayCircle,
  IconTrash,
  IconType,
  IconUpload,
  IconUsers,
  IconVideo,
  IconWallet,
} from './Icons';

type AdminTab = 'ticker' | 'linker' | 'bulk' | 'uploader' | 'sellers' | 'cloner' | 'dealers' | 'listings' | 'metrics';

interface Props {
  ticker: TickerConfig;
  onTicker: (config: TickerConfig) => void;
  categories: Category[];
  onCategories: (categories: Category[]) => void;
  sellers: Seller[];
  onSellers: (sellers: Seller[]) => void;
  profiles: Profile[];
  onProfiles: (profiles: Profile[]) => void;
  listings: Listing[];
  onListings: (listings: Listing[]) => void;
  quotes: DealerQuote[];
  onQuotes: (quotes: DealerQuote[]) => void;
  onToast: (text: string, kind?: 'ok' | 'err' | 'info') => void;
  onOpenListing: (id: string) => void;
}

export function AdminPanel(props: Props) {
  const [tab, setTab] = useState<AdminTab>('ticker');

  const nav: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'ticker', label: 'Ticker Tape', icon: <IconMegaphone size={17} /> },
    { id: 'linker', label: 'Visual Seeder', icon: <IconVideo size={17} /> },
    { id: 'bulk', label: 'Bulk URL Import', icon: <IconList size={17} /> },
    { id: 'uploader', label: 'Native Uploader', icon: <IconUpload size={17} /> },
    { id: 'sellers', label: 'Seller Profiling', icon: <IconUsers size={17} /> },
    { id: 'cloner', label: 'Category Cloner', icon: <IconLayers size={17} /> },
    { id: 'dealers', label: 'Dealer Pricing', icon: <IconWallet size={17} /> },
    { id: 'listings', label: 'Listing Registry', icon: <IconList size={17} /> },
    { id: 'metrics', label: 'Platform Metrics', icon: <IconChart size={17} /> },
  ];

  return (
    <div className="shell">
      <div className="admin-banner">
        <b>Super-Admin Portal</b>
        <span>
          {isSupabaseLive
            ? 'Connected to production Supabase. Previews are local until you press Publish Live.'
            : 'Supabase unavailable — nothing you save here will reach the live website or Android app.'}
        </span>
      </div>

      <div className="admin-layout">
        <nav className="admin-nav">
          {nav.map((item) => (
            <button
              key={item.id}
              className={`admin-nav__item${tab === item.id ? ' is-on' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div>
          {tab === 'ticker' && (
            <TickerManager
              config={props.ticker}
              onChange={props.onTicker}
              listings={props.listings}
              onToast={props.onToast}
            />
          )}
          {tab === 'linker' && (
            <VisualSeeder
              categories={props.categories}
              sellers={props.sellers}
              listings={props.listings}
              onListings={props.onListings}
              onToast={props.onToast}
            />
          )}
          {tab === 'bulk' && (
            <BulkImport
              categories={props.categories}
              sellers={props.sellers}
              listings={props.listings}
              onListings={props.onListings}
              onToast={props.onToast}
            />
          )}
          {tab === 'uploader' && (
            <NativeUploaderPanel
              categories={props.categories}
              sellers={props.sellers}
              listings={props.listings}
              onListings={props.onListings}
              onToast={props.onToast}
            />
          )}
          {tab === 'sellers' && (
            <SellerProfiling
              sellers={props.sellers}
              onSellers={props.onSellers}
              profiles={props.profiles}
              onProfiles={props.onProfiles}
              onToast={props.onToast}
            />
          )}
          {tab === 'cloner' && (
            <CategoryCloner
              categories={props.categories}
              onCategories={props.onCategories}
              onToast={props.onToast}
            />
          )}
          {tab === 'dealers' && (
            <DealerPricing
              quotes={props.quotes}
              onQuotes={props.onQuotes}
              sellers={props.sellers}
              onToast={props.onToast}
            />
          )}
          {tab === 'listings' && (
            <ListingRegistry
              listings={props.listings}
              sellers={props.sellers}
              onListings={props.onListings}
              onToast={props.onToast}
              onOpenListing={props.onOpenListing}
            />
          )}
          {tab === 'metrics' && (
            <PlatformMetrics
              listings={props.listings}
              sellers={props.sellers}
              categories={props.categories}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* Module 4 — Global Ticker Tape Manager                                       */
/* ========================================================================== */
function TickerManager({
  config,
  onChange,
  listings,
  onToast,
}: {
  config: TickerConfig;
  onChange: (config: TickerConfig) => void;
  listings: Listing[];
  onToast: (text: string, kind?: 'ok' | 'err' | 'info') => void;
}) {
  const [draft, setDraft] = useState<TickerConfig>(config);
  const [activeId, setActiveId] = useState<string>(config.segments[0]?.id ?? '');
  const [iconTarget, setIconTarget] = useState<'lead' | 'trail'>('lead');

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(config), [draft, config]);

  // Keep the latest callback without retriggering the debounce effect.
  const [pubState, setPubState] = useState<PublishState>('idle');
  const [pubError, setPubError] = useState('');
  const busy = pubState === 'saving' || pubState === 'publishing';

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /**
   * Auto-sync: every edit broadcasts to the live ticker after a short debounce
   * so the main page updates without a refresh. The explicit Save button
   * remains for committing immediately / confirming the write.
   */
  const syncTimer = useRef<number | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => onChangeRef.current(draft), 260);
    return () => {
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
    };
  }, [draft]);

  const set = <K extends keyof TickerConfig>(key: K, value: TickerConfig[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  /** Controls an operator expects to act with zero delay. */
  const setLive = <K extends keyof TickerConfig>(key: K, value: TickerConfig[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    onChange(next);
  };

  const active = draft.segments.find((segment) => segment.id === activeId) ?? draft.segments[0];

  function patchSegment(id: string, patch: Partial<TickerSegment>) {
    setDraft((prev) => ({
      ...prev,
      segments: prev.segments.map((segment) => (segment.id === id ? { ...segment, ...patch } : segment)),
    }));
  }

  function addSegment() {
    const segment = newSegment({ text: 'New announcement segment' });
    setDraft((prev) => ({ ...prev, segments: [...prev.segments, segment] }));
    setActiveId(segment.id);
  }

  function removeSegment(id: string) {
    setDraft((prev) => ({ ...prev, segments: prev.segments.filter((segment) => segment.id !== id) }));
  }

  function move(id: string, delta: number) {
    setDraft((prev) => {
      const index = prev.segments.findIndex((segment) => segment.id === id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= prev.segments.length) return prev;
      const segments = [...prev.segments];
      [segments[index], segments[target]] = [segments[target], segments[index]];
      return { ...prev, segments };
    });
  }

  function insertIcon(icon: string) {
    if (!active) return;
    patchSegment(active.id, iconTarget === 'lead' ? { leadIcon: icon } : { trailIcon: icon });
  }

  return (
    <>
      <div className="section__head" style={{ marginBottom: 16 }}>
        <div>
          <h2 className="section__title">Global Ticker Tape Manager</h2>
          <p className="section__sub">
            High-visibility scrolling bar between the header and hero. Only listings at or above the eligible tier
            appear in the global rotation.
          </p>
        </div>
      </div>

      {/* Live preview */}
      <div className="panel">
        <div className="panel__title">Live preview</div>
        <div className="ticker-preview">
          <TickerTape config={draft} listings={listings} preview />
        </div>
        <div className="panel__title" style={{ marginTop: 18 }}>
          Stacked / multi-line preview
        </div>
        <div className="ticker-preview">
          <TickerStack config={draft} />
        </div>
      </div>

      {/* Playback */}
      <div className="panel">
        <div className="panel__title">Playback</div>
        <div className="pill-row" style={{ marginBottom: 16 }}>
          <button
            className={`btn ${draft.playing ? 'btn--soft' : 'btn--primary'} btn--sm`}
            onClick={() => setLive('playing', !draft.playing)}
          >
            {draft.playing ? <IconPause size={16} /> : <IconPlayCircle size={16} />}
            {draft.playing ? 'Pause' : 'Start'}
          </button>
          <button
            className={`chip chip--sm${draft.loop ? ' is-on' : ''}`}
            onClick={() => setLive('loop', !draft.loop)}
          >
            <IconLoop size={13} /> Loop {draft.loop ? 'on' : 'off'}
          </button>
          <button
            className={`chip chip--sm${draft.enabled ? ' is-on' : ''}`}
            onClick={() => setLive('enabled', !draft.enabled)}
          >
            {draft.enabled ? 'Visible' : 'Hidden'}
          </button>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="tk-speed">
            Scroll speed — {draft.speed}
          </label>
          <input
            id="tk-speed"
            className="range"
            type="range"
            min={1}
            max={100}
            value={draft.speed}
            onChange={(event) => set('speed', Number(event.target.value))}
          />
          <span className="field__hint">Hovering the live ticker always pauses it for readability.</span>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <span className="field__label">Scroll direction</span>
          <div className="segmented">
            <button
              className={draft.direction === 'left' ? 'is-on' : ''}
              onClick={() => setLive('direction', 'left')}
            >
              ← Right to Left
              <small>Default marquee</small>
            </button>
            <button
              className={draft.direction === 'right' ? 'is-on' : ''}
              onClick={() => setLive('direction', 'right')}
            >
              Left to Right →
              <small>Reverse flow</small>
            </button>
          </div>
        </div>
      </div>

      {/* Size */}
      <div className="panel">
        <div className="panel__title">Ticker height &amp; size</div>
        <div className="segmented">
          {HEIGHT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={draft.height === preset.id ? 'is-on' : ''}
              onClick={() => set('height', preset.id)}
            >
              {preset.label}
              <small>{preset.blurb}</small>
            </button>
          ))}
        </div>
        <span className="field__hint" style={{ marginTop: 10, display: 'block' }}>
          Adjusts vertical padding and font scale on both the preview and the live bar.
        </span>
      </div>

      {/* Background colour */}
      <div className="panel">
        <div className="panel__title">Ticker background colour</div>
        <div className="bg-swatches">
          {BG_SWATCHES.map((swatch) => (
            <button
              key={swatch.value}
              className={`bg-swatch${draft.background === swatch.value ? ' is-on' : ''}`}
              onClick={() => set('background', swatch.value)}
            >
              <i style={{ background: swatch.value }} />
              {swatch.label}
            </button>
          ))}
        </div>

        <div className="form-grid" style={{ marginTop: 14 }}>
          <div className="field">
            <label className="field__label" htmlFor="tk-hex">
              Custom hex
            </label>
            <input
              id="tk-hex"
              className="input"
              value={draft.background}
              onChange={(event) => set('background', event.target.value)}
              placeholder="#1C1917"
              style={{ fontFamily: 'ui-monospace, monospace' }}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="tk-picker">
              Colour picker
            </label>
            <input
              id="tk-picker"
              type="color"
              className="input"
              style={{ padding: 4, height: 46 }}
              value={/^#[0-9a-f]{6}$/i.test(draft.background) ? draft.background : '#1C1917'}
              onChange={(event) => set('background', event.target.value)}
            />
          </div>
        </div>

        <span className="field__label" style={{ display: 'block', marginBottom: 8 }}>
          Gradient presets
        </span>
        <div className="swatches">
          {BG_PRESETS.map((bg) => (
            <button
              key={bg}
              className={`swatch${draft.background === bg ? ' is-on' : ''}`}
              style={{ background: bg, width: 56 }}
              onClick={() => set('background', bg)}
              aria-label="Background preset"
            />
          ))}
        </div>
      </div>

      {/* Segments */}
      <div className="panel">
        <div className="panel__title">
          <IconType size={15} /> Text segments
        </div>

        <div className="seg-list">
          {draft.segments.map((segment, index) => (
            <div key={segment.id} className={`seg-row${activeId === segment.id ? ' is-on' : ''}`}>
              <button className="seg-row__main" onClick={() => setActiveId(segment.id)}>
                <span style={{ opacity: 0.5, fontSize: 11, fontWeight: 800 }}>{index + 1}</span>
                {segment.leadIcon && <span>{segment.leadIcon}</span>}
                <span
                  style={{
                    fontWeight: segment.bold ? 800 : 600,
                    fontStyle: segment.italic ? 'italic' : 'normal',
                    color: segment.color || undefined,
                  }}
                >
                  {segment.text || 'Empty segment'}
                </span>
                {segment.trailIcon && <span>{segment.trailIcon}</span>}
                {segment.newLine && <span className="badge badge--soft">↵ new line</span>}
              </button>
              <div className="seg-row__tools">
                <button className="icon-btn" onClick={() => move(segment.id, -1)} aria-label="Move up">
                  ↑
                </button>
                <button className="icon-btn" onClick={() => move(segment.id, 1)} aria-label="Move down">
                  ↓
                </button>
                <button
                  className="icon-btn"
                  onClick={() => removeSegment(segment.id)}
                  aria-label="Delete segment"
                  disabled={draft.segments.length <= 1}
                >
                  <IconTrash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn--soft btn--sm" style={{ marginTop: 12 }} onClick={addSegment}>
          + Add segment
        </button>
      </div>

      {/* Segment editor */}
      {active && (
        <div className="panel">
          <div className="panel__title">Editing segment</div>

          <div className="field">
            <label className="field__label" htmlFor="seg-text">
              Text
            </label>
            <textarea
              id="seg-text"
              className="textarea"
              style={{ minHeight: 74 }}
              value={active.text}
              onChange={(event) => patchSegment(active.id, { text: event.target.value })}
            />
          </div>

          <div className="pill-row" style={{ marginBottom: 16 }}>
            <button
              className={`chip chip--sm${active.bold ? ' is-on' : ''}`}
              onClick={() => patchSegment(active.id, { bold: !active.bold })}
              style={{ fontWeight: 800 }}
            >
              B Bold
            </button>
            <button
              className={`chip chip--sm${active.italic ? ' is-on' : ''}`}
              onClick={() => patchSegment(active.id, { italic: !active.italic })}
              style={{ fontStyle: 'italic' }}
            >
              I Slanted
            </button>
            <button
              className={`chip chip--sm${active.newLine ? ' is-on' : ''}`}
              onClick={() => patchSegment(active.id, { newLine: !active.newLine })}
            >
              ↵ New line
            </button>
          </div>

          <div className="form-grid">
            <div className="field">
              <span className="field__label">Text colour</span>
              <div className="swatches">
                <button
                  className={`swatch${!active.color ? ' is-on' : ''}`}
                  style={{ background: 'var(--surface-3)', fontSize: 10, fontWeight: 800 }}
                  onClick={() => patchSegment(active.id, { color: '' })}
                >
                  Auto
                </button>
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`swatch${active.color === color ? ' is-on' : ''}`}
                    style={{ background: color }}
                    onClick={() => patchSegment(active.id, { color })}
                    aria-label={color}
                  />
                ))}
                <input
                  type="color"
                  className="swatch"
                  style={{ padding: 0 }}
                  value={active.color || '#ffffff'}
                  onChange={(event) => patchSegment(active.id, { color: event.target.value })}
                  aria-label="Custom colour"
                />
              </div>
            </div>

            <div className="field">
              <span className="field__label">Colour head (first word)</span>
              <div className="swatches">
                <button
                  className={`swatch${!active.headColor ? ' is-on' : ''}`}
                  style={{ background: 'var(--surface-3)', fontSize: 10, fontWeight: 800 }}
                  onClick={() => patchSegment(active.id, { headColor: '' })}
                >
                  Off
                </button>
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`swatch${active.headColor === color ? ' is-on' : ''}`}
                    style={{ background: color }}
                    onClick={() => patchSegment(active.id, { headColor: color })}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <span className="field__label">Inline emoji &amp; icon library</span>
            <div className="pill-row" style={{ marginBottom: 10 }}>
              <button
                className={`chip chip--sm${iconTarget === 'lead' ? ' is-on' : ''}`}
                onClick={() => setIconTarget('lead')}
              >
                Insert before text
              </button>
              <button
                className={`chip chip--sm${iconTarget === 'trail' ? ' is-on' : ''}`}
                onClick={() => setIconTarget('trail')}
              >
                Insert after text
              </button>
              <button
                className="chip chip--sm"
                onClick={() => patchSegment(active.id, iconTarget === 'lead' ? { leadIcon: '' } : { trailIcon: '' })}
              >
                Clear
              </button>
            </div>
            {ICON_LIBRARY.map((group) => (
              <div key={group.group} style={{ marginBottom: 10 }}>
                <div className="filter-group__title" style={{ marginBottom: 6 }}>
                  {group.group}
                </div>
                <div className="chips">
                  {group.items.map((icon) => (
                    <button
                      key={icon}
                      className={`emoji-btn${
                        (iconTarget === 'lead' ? active.leadIcon : active.trailIcon) === icon ? ' is-on' : ''
                      }`}
                      onClick={() => insertIcon(icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global styling */}
      <div className="panel">
        <div className="panel__title">Global styling</div>

        <div className="field">
          <span className="field__label">Font family</span>
          <div className="chips">
            {TICKER_FONT_LABELS.map((font) => (
              <button
                key={font.id}
                className={`chip chip--sm${draft.font === font.id ? ' is-on' : ''}`}
                onClick={() => set('font', font.id as TickerFont)}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="tk-size">
            Font size — {draft.fontSize}px
          </label>
          <input
            id="tk-size"
            className="range"
            type="range"
            min={11}
            max={24}
            value={draft.fontSize}
            onChange={(event) => set('fontSize', Number(event.target.value))}
          />
        </div>

        <div className="field">
          <span className="field__label">Default text colour</span>
          <div className="swatches">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                className={`swatch${draft.defaultColor === color ? ' is-on' : ''}`}
                style={{ background: color }}
                onClick={() => set('defaultColor', color)}
                aria-label={color}
              />
            ))}
            <input
              type="color"
              className="swatch"
              style={{ padding: 0 }}
              value={draft.defaultColor}
              onChange={(event) => set('defaultColor', event.target.value)}
              aria-label="Custom colour"
            />
          </div>
        </div>

      </div>

      {/* Monetisation binding */}
      <div className="panel">
        <div className="panel__title">
          <IconWallet size={15} /> Monetisation binding
        </div>
        <Switch
          on={draft.showFeaturedListings}
          onChange={(value) => set('showFeaturedListings', value)}
          label="Rotate paid listings through the ticker"
          hint="Free-tier ads are never eligible for the global ticker."
        />
        <div className="field" style={{ marginTop: 14 }}>
          <label className="field__label" htmlFor="tk-tier">
            Minimum eligible tier
          </label>
          <select
            id="tk-tier"
            className="select"
            value={draft.minTier}
            onChange={(event) => set('minTier', event.target.value as TickerConfig['minTier'])}
          >
            <option value="standard">Tier 2 — Standard (₹200) and above</option>
            <option value="comprehensive">Tier 3 — Comprehensive (₹1,000) and above</option>
            <option value="dealer">Tier 4 — Dealer only</option>
          </select>
        </div>
      </div>

      <div className="save-bar">
        <span className={`save-bar__state ${dirty ? 'is-dirty' : 'is-clean'}`}>
          {/* Truthful state: preview is never described as live. */}
          {pubState === 'saving' && '⏳ Saving draft…'}
          {pubState === 'publishing' && '⏳ Publishing live…'}
          {pubState === 'saved' && '✓ Draft saved to Supabase (hidden from public)'}
          {pubState === 'published' && '✓ Published live — all clients updated'}
          {pubState === 'error' && `✗ ${pubError}`}
          {pubState === 'idle' && (dirty ? '● Unsaved local preview' : '○ No unsaved changes')}
          <em style={{ display: 'block', fontStyle: 'normal', fontWeight: 500, fontSize: 11, opacity: 0.75 }}>
            {isSupabaseLive
              ? 'Target: production Supabase · ticker_settings row 1'
              : 'Supabase unavailable — nothing will reach the live site'}
          </em>
        </span>
        <button className="btn btn--ghost btn--sm" onClick={() => setDraft(config)} disabled={!dirty}>
          Discard
        </button>
        <button
          className="btn btn--ghost btn--sm"
          disabled={busy}
          onClick={async () => {
            setPubState('saving');
            setPubError('');
            const result = await saveTicker(draft, false);
            if (result.ok) {
              setPubState('saved');
              onToast('Draft saved to Supabase (not public yet)', 'ok');
            } else {
              setPubState('error');
              setPubError(result.error ?? 'Save failed');
              onToast(`Save failed: ${result.error}`, 'err');
            }
          }}
        >
          Save Draft
        </button>
        <button
          className="btn btn--primary"
          disabled={busy}
          onClick={async () => {
            setPubState('publishing');
            setPubError('');
            const result = await saveTicker(draft, true);
            if (result.ok) {
              // Only mirror into app state once the database confirmed it.
              onChange(draft);
              setPubState('published');
              onToast('Published live — website and Android will update', 'ok');
            } else {
              setPubState('error');
              setPubError(result.error ?? 'Publish failed');
              onToast(`Publish failed: ${result.error}`, 'err');
            }
          }}
        >
          <IconCheck size={16} /> Publish Live
        </button>
      </div>
    </>
  );
}

/* ========================================================================== */
/* Module 2.1 — Visual Database Seeder (Linker)                                */
/* ========================================================================== */
function VisualSeeder({
  categories,
  sellers,
  listings,
  onListings,
  onToast,
}: {
  categories: Category[];
  sellers: Seller[];
  listings: Listing[];
  onListings: (listings: Listing[]) => void;
  onToast: (text: string, kind?: 'ok' | 'err' | 'info') => void;
}) {
  const [form, setForm] = useState({
    title: '',
    price: '',
    categoryId: categories[0]?.id ?? '',
    subCategoryId: categories[0]?.children[0]?.id ?? '',
    sellerId: sellers[0]?.id ?? '',
    city: '',
    location: '',
    description: '',
    instagram: '',
    youtube: '',
    facebook: '',
    poster: '',
    featured: true,
  });
  const [bulk, setBulk] = useState('');
  const [error, setError] = useState('');

  const subs = categories.find((c) => c.id === form.categoryId)?.children ?? [];
  const resolved = useMemo(() => {
    for (const url of [form.instagram, form.youtube, form.facebook]) {
      const parsed = parseVideoUrl(url);
      if (parsed) return parsed;
    }
    return null;
  }, [form.instagram, form.youtube, form.facebook]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function seed(publishLive: boolean) {
    setError('');
    if (form.title.trim().length < 6) return setError('Enter a story / ad title.');
    if (!resolved) return setError('Provide at least one valid Instagram, YouTube or Facebook video URL.');

    const seller = sellers.find((s) => s.id === form.sellerId);
    const listing: Listing = {
      id: uid('lst'),
      title: form.title.trim(),
      description: form.description.trim() || `Aggregated from ${providerLabel(resolved.provider)} by EXY content staff.`,
      price: Number(form.price) || 0,
      negotiable: true,
      categoryId: form.categoryId,
      subCategoryId: form.subCategoryId || subs[0]?.id || '',
      tags: [],
      features: [],
      location: form.location.trim() || seller?.location || 'India',
      region: 'india',
      city: form.city.trim() || (seller?.location.split(',')[0] ?? 'India'),
      sellerId: form.sellerId,
      video: { ...resolved, poster: form.poster.trim() || resolved.poster },
      photos: ['linear-gradient(135deg,#fde68a,#f2713a)'],
      tier: form.featured ? 'comprehensive' : 'standard',
      featured: form.featured,
      condition: 'new',
      createdAt: new Date().toISOString(),
      viewCount: 0,
      saveCount: 0,
      clickCount: 0,
      leadCount: 0,
      todayViews: 0,
      hidePhone: seller?.hidePhone ?? false,
      status: 'active',
    };

    // Write to production Supabase first; only mirror locally on confirmation.
    void saveListing(listing, publishLive).then((result) => {
      if (!result.ok) {
        setError(`${publishLive ? 'Publish' : 'Draft save'} failed: ${result.error}`);
        onToast(`${publishLive ? 'Publish' : 'Save'} failed: ${result.error}`, 'err');
        return;
      }
      if (publishLive) onListings([listing, ...listings]);
      onToast(
        publishLive
          ? `Published live (${result.operation}) — id ${result.id}`
          : `Draft saved to Supabase — hidden from public feed`,
        'ok',
      );
      setForm({ ...form, title: '', price: '', description: '', instagram: '', youtube: '', facebook: '', poster: '' });
    });
  }

  function bulkSeed() {
    const urls = bulk.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const parsed = urls.map((url) => parseVideoUrl(url)).filter(Boolean);
    if (!parsed.length) return onToast('No valid video URLs found in the batch.', 'err');

    const seller = sellers.find((s) => s.id === form.sellerId);
    const created: Listing[] = parsed.map((video, index) => ({
      id: uid('lst'),
      title: `${providerLabel(video!.provider)} import #${index + 1} — ${video!.externalId}`,
      description: 'Bulk-imported reel awaiting editorial review.',
      price: 0,
      negotiable: true,
      categoryId: form.categoryId,
      subCategoryId: form.subCategoryId || subs[0]?.id || '',
      tags: [],
      features: [],
      location: seller?.location ?? 'India',
      region: 'india',
      city: seller?.location.split(',')[0] ?? 'India',
      sellerId: form.sellerId,
      video: video!,
      photos: ['linear-gradient(135deg,#cbd5e1,#334155)'],
      tier: 'standard',
      featured: false,
      condition: 'new',
      createdAt: new Date().toISOString(),
      viewCount: 0,
      saveCount: 0,
      clickCount: 0,
      leadCount: 0,
      todayViews: 0,
      hidePhone: seller?.hidePhone ?? false,
      status: 'active',
    }));

    onListings([...created, ...listings]);
    onToast(`Bulk-imported ${created.length} reels`, 'ok');
    setBulk('');
  }

  return (
    <>
      <div className="section__head" style={{ marginBottom: 16 }}>
        <div>
          <h2 className="section__title">Visual Database Seeder</h2>
          <p className="section__sub">
            Aggregate high-quality visual listings from social platforms. EXY parses the platform ID and stores the
            video link with its poster thumbnail.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel__title">
          <IconLink size={15} /> Story details
        </div>

        <div className="form-grid">
          <div className="field">
            <label className="field__label" htmlFor="vs-title">
              Story / Ad title
            </label>
            <input
              id="vs-title"
              className="input"
              value={form.title}
              onChange={(event) => set('title', event.target.value)}
              placeholder="Handmade black oxford shoes — Goodyear welted"
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="vs-price">
              Price (₹)
            </label>
            <input
              id="vs-price"
              className="input"
              type="number"
              value={form.price}
              onChange={(event) => set('price', event.target.value)}
              placeholder="6400"
            />
          </div>
        </div>

        <div className="form-grid form-grid--3">
          <div className="field">
            <label className="field__label" htmlFor="vs-cat">
              Category
            </label>
            <select
              id="vs-cat"
              className="select"
              value={form.categoryId}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  categoryId: event.target.value,
                  subCategoryId: categories.find((c) => c.id === event.target.value)?.children[0]?.id ?? '',
                }))
              }
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="vs-sub">
              Subcategory
            </label>
            <select
              id="vs-sub"
              className="select"
              value={form.subCategoryId}
              onChange={(event) => set('subCategoryId', event.target.value)}
            >
              {subs.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="vs-seller">
              Seller profile
            </label>
            <select
              id="vs-seller"
              className="select"
              value={form.sellerId}
              onChange={(event) => set('sellerId', event.target.value)}
            >
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label className="field__label" htmlFor="vs-city">
              City tag
            </label>
            <input
              id="vs-city"
              className="input"
              value={form.city}
              onChange={(event) => set('city', event.target.value)}
              placeholder="Mumbai"
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="vs-loc">
              Location tag
            </label>
            <input
              id="vs-loc"
              className="input"
              value={form.location}
              onChange={(event) => set('location', event.target.value)}
              placeholder="Dadar, Mumbai"
            />
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="vs-desc">
            Description
          </label>
          <textarea
            id="vs-desc"
            className="textarea"
            value={form.description}
            onChange={(event) => set('description', event.target.value)}
            placeholder="What the seller offers, delivery terms, guarantees…"
          />
        </div>
      </div>

      <div className="panel">
        <div className="panel__title">
          <IconVideo size={15} /> Media inputs — social embeds
        </div>

        <div className="field">
          <label className="field__label" htmlFor="vs-ig">
            Instagram Reel URL
          </label>
          <input
            id="vs-ig"
            className="input"
            value={form.instagram}
            onChange={(event) => set('instagram', event.target.value)}
            placeholder="https://www.instagram.com/reel/CxYz12AbCdE/"
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="vs-yt">
            YouTube Short URL
          </label>
          <input
            id="vs-yt"
            className="input"
            value={form.youtube}
            onChange={(event) => set('youtube', event.target.value)}
            placeholder="https://www.youtube.com/shorts/dQw4w9WgXcQ"
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="vs-fb">
            Facebook Video URL
          </label>
          <input
            id="vs-fb"
            className="input"
            value={form.facebook}
            onChange={(event) => set('facebook', event.target.value)}
            placeholder="https://www.facebook.com/reel/1234567890"
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="vs-poster">
            Poster / thumbnail override (optional)
          </label>
          <input
            id="vs-poster"
            className="input"
            value={form.poster}
            onChange={(event) => set('poster', event.target.value)}
            placeholder="https://…/thumbnail.jpg"
          />
          <span className="field__hint">
            {resolved
              ? `✓ ${providerLabel(resolved.provider)} detected — id ${resolved.externalId}`
              : 'Fill any one of the three fields above to resolve an embed.'}
          </span>
        </div>

        {resolved && (
          <div style={{ maxWidth: 250, marginBottom: 16 }}>
            <div className="video video--vertical">
              <iframe src={resolved.embedSrc} title="Embed preview" loading="lazy" allowFullScreen />
            </div>
          </div>
        )}

        <Switch
          on={form.featured}
          onChange={(value) => set('featured', value)}
          label="Mark as featured (ticker eligible)"
        />

        {error && <div className="field__error" style={{ marginTop: 12 }}>{error}</div>}

        <div className="pill-row" style={{ marginTop: 16 }}>
          <button className="btn btn--ghost" onClick={() => seed(false)}>
            Save Draft
          </button>
          <button className="btn btn--primary" onClick={() => seed(true)}>
            <IconVideo size={16} /> Publish Live
          </button>
        </div>
        <span className="field__hint" style={{ marginTop: 8, display: 'block' }}>
          Draft writes to Supabase but stays hidden from the public feed. Publish Live makes it visible on the
          website and Android app.
        </span>
      </div>

      <div className="panel">
        <div className="panel__title">
          <IconCopy size={15} /> Bulk reel importer
        </div>
        <div className="field">
          <label className="field__label" htmlFor="vs-bulk">
            One URL per line
          </label>
          <textarea
            id="vs-bulk"
            className="textarea"
            value={bulk}
            onChange={(event) => setBulk(event.target.value)}
            placeholder={'https://www.youtube.com/shorts/abc123\nhttps://www.instagram.com/reel/CxYz12AbCdE/'}
          />
        </div>
        <button className="btn btn--soft" onClick={bulkSeed}>
          Import batch
        </button>
      </div>
    </>
  );
}

/* ========================================================================== */
/* Module 2.2 — Native Content Uploader                                        */
/* ========================================================================== */
function NativeUploaderPanel({
  categories,
  sellers,
  listings,
  onListings,
  onToast,
}: {
  categories: Category[];
  sellers: Seller[];
  listings: Listing[];
  onListings: (listings: Listing[]) => void;
  onToast: (text: string, kind?: 'ok' | 'err' | 'info') => void;
}) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [subCategoryId, setSubCategoryId] = useState(categories[0]?.children[0]?.id ?? '');
  const [sellerId, setSellerId] = useState(sellers[0]?.id ?? '');
  const [videos, setVideos] = useState<NativeMedia[]>([]);
  const [images, setImages] = useState<NativeMedia[]>([]);
  const [audio, setAudio] = useState<NativeMedia[]>([]);
  const [error, setError] = useState('');

  const subs = categories.find((c) => c.id === categoryId)?.children ?? [];
  const media = [...videos, ...images, ...audio];

  function publish() {
    setError('');
    if (title.trim().length < 6) return setError('Enter a listing title.');
    if (!media.length) return setError('Upload at least one media file.');

    const seller = sellers.find((s) => s.id === sellerId);
    const hero = videos[0];

    const listing: Listing = {
      id: uid('lst'),
      title: title.trim(),
      description: 'Natively hosted media listing published from the EXY admin uploader.',
      price: Number(price) || 0,
      negotiable: true,
      categoryId,
      subCategoryId: subCategoryId || subs[0]?.id || '',
      tags: [],
      features: [],
      location: seller?.location ?? 'India',
      region: 'india',
      city: seller?.location.split(',')[0] ?? 'India',
      sellerId,
      video: hero
        ? {
            provider: 'native',
            url: hero.src,
            externalId: hero.id,
            embedSrc: hero.src,
            poster: hero.poster ?? images[0]?.src,
          }
        : undefined,
      media,
      photos: images.length
        ? images.map((image) => `url(${image.src}) center/cover`)
        : ['linear-gradient(135deg,#fde68a,#f2713a)'],
      tier: 'comprehensive',
      featured: true,
      condition: 'new',
      createdAt: new Date().toISOString(),
      viewCount: 0,
      saveCount: 0,
      clickCount: 0,
      leadCount: 0,
      todayViews: 0,
      hidePhone: seller?.hidePhone ?? false,
      status: 'active',
    };

    const check = validateForPublish(listing);
    if (!check.valid) {
      setError(check.errors.join(' '));
      return;
    }
    void saveListing(listing, true).then((result) => {
      if (!result.ok) {
        setError(`Publish failed: ${result.error}`);
        onToast(`Publish failed: ${result.error}`, 'err');
        return;
      }
      onListings([listing, ...listings]);
      onToast(`Published live (${result.operation}) with ${media.length} hosted file(s)`, 'ok');
      setTitle('');
      setPrice('');
      setVideos([]);
      setImages([]);
      setAudio([]);
    });
  }

  return (
    <>
      <div className="section__head" style={{ marginBottom: 16 }}>
        <div>
          <h2 className="section__title">Native Content Uploader</h2>
          <p className="section__sub">
            Host media directly on EXY servers. Video is transcoded to 480p in the background before upload to keep
            bandwidth and storage costs low.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel__title">Listing details</div>
        <div className="form-grid">
          <div className="field">
            <label className="field__label" htmlFor="nu-title">
              Title
            </label>
            <input
              id="nu-title"
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Factory tour — solid sheesham sofa build"
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="nu-price">
              Price (₹)
            </label>
            <input
              id="nu-price"
              className="input"
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="42800"
            />
          </div>
        </div>
        <div className="form-grid form-grid--3">
          <div className="field">
            <label className="field__label" htmlFor="nu-cat">
              Category
            </label>
            <select
              id="nu-cat"
              className="select"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setSubCategoryId(categories.find((c) => c.id === event.target.value)?.children[0]?.id ?? '');
              }}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="nu-sub">
              Subcategory
            </label>
            <select
              id="nu-sub"
              className="select"
              value={subCategoryId}
              onChange={(event) => setSubCategoryId(event.target.value)}
            >
              {subs.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="nu-seller">
              Seller
            </label>
            <select id="nu-seller" className="select" value={sellerId} onChange={(event) => setSellerId(event.target.value)}>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel__title">
          <IconFilm size={15} /> MP4 video — auto 480p compression
        </div>
        <MediaUploader kind="video" items={videos} onChange={setVideos} max={3} onError={(msg) => onToast(msg, 'err')} />
      </div>

      <div className="panel">
        <div className="panel__title">
          <IconUpload size={15} /> JPG / PNG images
        </div>
        <MediaUploader kind="image" items={images} onChange={setImages} max={8} onError={(msg) => onToast(msg, 'err')} />
      </div>

      <div className="panel">
        <div className="panel__title">Audio banner — MP3 + still poster</div>
        <MediaUploader kind="audio" items={audio} onChange={setAudio} max={2} onError={(msg) => onToast(msg, 'err')} />
        {audio.length > 0 && (
          <div className="audio-banner" style={images[0] ? { backgroundImage: `url(${images[0].src})` } : undefined}>
            <div className="audio-banner__body">
              <b>{title || 'Untitled audio banner'}</b>
              <audio src={audio[0].src} controls />
            </div>
          </div>
        )}
      </div>

      {error && <div className="field__error" style={{ marginBottom: 12 }}>{error}</div>}

      <button className="btn btn--primary" onClick={publish}>
        <IconCheck size={16} /> Publish hosted listing
      </button>
    </>
  );
}

/* ========================================================================== */
/* Module 1.4 — Seller Profiling (upgrade an existing user)                    */
/* ========================================================================== */
function SellerProfiling({
  sellers,
  onSellers,
  profiles,
  onProfiles,
  onToast,
}: {
  sellers: Seller[];
  onSellers: (sellers: Seller[]) => void;
  profiles: Profile[];
  onProfiles: (profiles: Profile[]) => void;
  onToast: (text: string, kind?: 'ok' | 'err' | 'info') => void;
}) {
  const candidates = profiles.filter((profile) => !profile.isSeller);
  const [targetId, setTargetId] = useState(candidates[0]?.id ?? '');
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [handle, setHandle] = useState('');
  const [domain, setDomain] = useState('exy.com');
  const [verification, setVerification] = useState<VerificationLevel>('verified-business');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const target = profiles.find((profile) => profile.id === targetId);
  const resolvedHandle = slugify(handle || businessName || target?.username || '');
  const storefrontUrl = resolvedHandle ? `${resolvedHandle}.${domain}` : `brand.${domain}`;

  function upgrade() {
    setError('');
    if (!target) return setError('Select a user account to upgrade.');
    if (businessName.trim().length < 3) return setError('Enter the business name.');
    if (!resolvedHandle) return setError('Enter a storefront handle.');
    if (sellers.some((seller) => seller.handle === resolvedHandle)) return setError('That handle is already taken.');

    const upgraded: Profile = {
      ...target,
      isSeller: true,
      businessName: businessName.trim(),
      bio: bio.trim() || 'EXY verified business storefront.',
      verification,
      storefrontHandle: resolvedHandle,
      storefrontUrl,
      location: location.trim() || target.location,
    };

    onProfiles(profiles.map((profile) => (profile.id === target.id ? upgraded : profile)));
    onSellers([
      {
        id: upgraded.id,
        name: upgraded.businessName!,
        handle: resolvedHandle,
        bio: upgraded.bio!,
        avatarColor: upgraded.avatarColor,
        location: upgraded.location,
        phone: upgraded.phone ?? '+91 00000 00000',
        hidePhone: upgraded.hidePhone,
        verification,
        storefrontUrl,
        memberSince: upgraded.createdAt.slice(0, 10),
        rating: upgraded.rating,
        responseTime: upgraded.responseTime,
      },
      ...sellers.filter((seller) => seller.id !== upgraded.id),
    ]);

    onToast(`${upgraded.businessName} upgraded — storefront live at ${storefrontUrl}`, 'ok');
    setBusinessName('');
    setBio('');
    setHandle('');
  }

  function setBadge(id: string, level: VerificationLevel) {
    onSellers(sellers.map((seller) => (seller.id === id ? { ...seller, verification: level } : seller)));
    onProfiles(profiles.map((profile) => (profile.id === id ? { ...profile, verification: level } : profile)));
    onToast('Verification badge updated', 'ok');
  }

  return (
    <>
      <div className="section__head" style={{ marginBottom: 16 }}>
        <div>
          <h2 className="section__title">Seller Profiling</h2>
          <p className="section__sub">
            Upgrade an existing user account into a verified business: issue the badge, write the bio and generate a
            custom storefront URL.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel__title">
          <IconBadge size={15} /> Upgrade a user account
        </div>

        <div className="field">
          <label className="field__label" htmlFor="sp-user">
            User account
          </label>
          <select id="sp-user" className="select" value={targetId} onChange={(event) => setTargetId(event.target.value)}>
            {candidates.length === 0 && <option value="">No standard users available</option>}
            {candidates.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.fullName} · @{profile.username} · {profile.email}
              </option>
            ))}
          </select>
          <span className="field__hint">
            Only accounts that are not already sellers appear here. Users register through Supabase Auth.
          </span>
        </div>

        <div className="form-grid">
          <div className="field">
            <label className="field__label" htmlFor="sp-biz">
              Business name
            </label>
            <input
              id="sp-biz"
              className="input"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="Mahindra Bricks & Aggregates"
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="sp-handle">
              Storefront handle
            </label>
            <input
              id="sp-handle"
              className="input"
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="mahindra-bricks"
            />
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="sp-bio">
            Business description / bio
          </label>
          <textarea
            id="sp-bio"
            className="textarea"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="What the business sells, delivery radius, guarantees…"
          />
        </div>

        <div className="form-grid form-grid--3">
          <div className="field">
            <label className="field__label" htmlFor="sp-loc">
              Location
            </label>
            <input
              id="sp-loc"
              className="input"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Ghaziabad, India"
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="sp-domain">
              Domain
            </label>
            <select id="sp-domain" className="select" value={domain} onChange={(event) => setDomain(event.target.value)}>
              <option value="exy.com">exy.com</option>
              <option value="exy.in">exy.in</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="sp-badge">
              Verification badge
            </label>
            <select
              id="sp-badge"
              className="select"
              value={verification}
              onChange={(event) => setVerification(event.target.value as VerificationLevel)}
            >
              <option value="none">No badge</option>
              <option value="verified-business">Verified Business ✓</option>
              <option value="verified-inspector">Verified Inspector ✓</option>
            </select>
          </div>
        </div>

        <div className="clone-preview">
          Storefront URL → https://{storefrontUrl}
          <br />
          In-PWA route → /store/{resolvedHandle || 'brand'}
          <br />
          Badge → {verification === 'none' ? 'none' : verification.replace('-', ' ')}
        </div>

        {error && <div className="field__error" style={{ marginTop: 12 }}>{error}</div>}

        <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={upgrade} disabled={!candidates.length}>
          <IconUsers size={16} /> Upgrade to seller
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Storefront URL</th>
              <th>Location</th>
              <th>Certification</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((seller) => (
              <tr key={seller.id}>
                <td>
                  <b>{seller.name}</b>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>@{seller.handle}</div>
                </td>
                <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{seller.storefrontUrl}</td>
                <td>{seller.location}</td>
                <td>
                  <select
                    className="select"
                    style={{ height: 36, fontSize: 12.5 }}
                    value={seller.verification}
                    onChange={(event) => setBadge(seller.id, event.target.value as VerificationLevel)}
                  >
                    <option value="none">No badge</option>
                    <option value="verified-business">Verified Business</option>
                    <option value="verified-inspector">Verified Inspector</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ========================================================================== */
/* Module 3.2 — Category clone engine                                          */
/* ========================================================================== */
function CategoryCloner({
  categories,
  onCategories,
  onToast,
}: {
  categories: Category[];
  onCategories: (categories: Category[]) => void;
  onToast: (text: string, kind?: 'ok' | 'err' | 'info') => void;
}) {
  const [sourceId, setSourceId] = useState(categories[0]?.id ?? '');
  const [subId, setSubId] = useState('');
  const [newName, setNewName] = useState('');
  const [includeChildren, setIncludeChildren] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [targetId, setTargetId] = useState('');

  const source = categories.find((c) => c.id === sourceId);
  const sourceSub = source?.children.find((c) => c.id === subId);
  const scope: 'category' | 'subcategory' = subId ? 'subcategory' : 'category';
  const resolvedName = newName.trim() || `${(sourceSub?.name ?? source?.name) ?? 'Category'} Copy`;

  function cloneCategory() {
    if (!source) return;
    const slug = slugify(resolvedName);
    if (categories.some((c) => c.slug === slug)) return onToast('A category with that slug already exists.', 'err');

    const clone: Category = {
      ...source,
      id: uid('cat'),
      name: resolvedName,
      slug,
      children: includeChildren
        ? source.children.map((child) => ({ ...child, id: uid('sub'), tags: includeTags ? [...child.tags] : [] }))
        : [],
    };
    onCategories([...categories, clone]);
    onToast(`Cloned "${source.name}" → "${resolvedName}" with ${clone.children.length} subcategories`, 'ok');
    setNewName('');
  }

  function cloneSub() {
    if (!source || !sourceSub) return;
    const destinationId = targetId || source.id;
    const clone: SubCategory = {
      ...sourceSub,
      id: uid('sub'),
      name: resolvedName,
      slug: slugify(resolvedName),
      tags: includeTags ? [...sourceSub.tags] : [],
    };
    onCategories(
      categories.map((category) =>
        category.id === destinationId ? { ...category, children: [...category.children, clone] } : category,
      ),
    );
    onToast(`Cloned "${sourceSub.name}" into ${categories.find((c) => c.id === destinationId)?.name ?? 'category'}`, 'ok');
    setNewName('');
  }

  return (
    <>
      <div className="section__head" style={{ marginBottom: 16 }}>
        <div>
          <h2 className="section__title">Category Clone Engine</h2>
          <p className="section__sub">
            Duplicate entire category hierarchies including subcategories and tag structures in one click.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel__title">
          <IconLayers size={15} /> Clone source
        </div>
        <div className="form-grid">
          <div className="field">
            <label className="field__label" htmlFor="cc-src">
              Source category
            </label>
            <select
              id="cc-src"
              className="select"
              value={sourceId}
              onChange={(event) => {
                setSourceId(event.target.value);
                setSubId('');
              }}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.children.length})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="cc-scope">
              Scope
            </label>
            <select id="cc-scope" className="select" value={subId} onChange={(event) => setSubId(event.target.value)}>
              <option value="">Whole category (with subcategories)</option>
              {source?.children.map((child) => (
                <option key={child.id} value={child.id}>
                  Subcategory only — {child.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="cc-name">
            New name
          </label>
          <input
            id="cc-name"
            className="input"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder={resolvedName}
          />
        </div>

        {scope === 'subcategory' && (
          <div className="field">
            <label className="field__label" htmlFor="cc-target">
              Destination category
            </label>
            <select id="cc-target" className="select" value={targetId} onChange={(event) => setTargetId(event.target.value)}>
              <option value="">Same category ({source?.name})</option>
              {categories
                .filter((category) => category.id !== sourceId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {scope === 'category' && (
          <Switch
            on={includeChildren}
            onChange={setIncludeChildren}
            label="Include all subcategories"
            hint={`${source?.children.length ?? 0} subcategories will be duplicated`}
          />
        )}
        <Switch on={includeTags} onChange={setIncludeTags} label="Include tag structure" />

        <div className="clone-preview" style={{ marginTop: 16 }}>
          {scope === 'category' ? (
            <>
              📁 {resolvedName} <span style={{ opacity: 0.6 }}>({slugify(resolvedName)})</span>
              {includeChildren &&
                source?.children.map((child) => (
                  <div key={child.id} style={{ paddingLeft: 18 }}>
                    └─ {child.name}
                    {includeTags && child.tags.length > 0 && <span style={{ opacity: 0.55 }}> [{child.tags.join(', ')}]</span>}
                  </div>
                ))}
            </>
          ) : (
            <>
              📁 {categories.find((c) => c.id === (targetId || sourceId))?.name}
              <div style={{ paddingLeft: 18 }}>
                └─ {resolvedName}
                {includeTags && sourceSub?.tags.length ? <span style={{ opacity: 0.55 }}> [{sourceSub.tags.join(', ')}]</span> : null}
              </div>
            </>
          )}
        </div>

        <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={scope === 'category' ? cloneCategory : cloneSub}>
          <IconCopy size={16} /> Duplicate {scope}
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Slug</th>
              <th>Subcategories</th>
              <th>Tags</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>
                  <b>{category.name}</b>
                </td>
                <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{category.slug}</td>
                <td>{category.children.length}</td>
                <td>{category.children.reduce((sum, child) => sum + child.tags.length, 0)}</td>
                <td>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => {
                      onCategories(categories.filter((item) => item.id !== category.id));
                      onToast('Category removed', 'info');
                    }}
                  >
                    <IconTrash size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ========================================================================== */
/* Module 5.1 Tier 4 — Dealer custom pricing                                   */
/* ========================================================================== */
function DealerPricing({
  quotes,
  onQuotes,
  sellers,
  onToast,
}: {
  quotes: DealerQuote[];
  onQuotes: (quotes: DealerQuote[]) => void;
  sellers: Seller[];
  onToast: (text: string, kind?: 'ok' | 'err' | 'info') => void;
}) {
  const [sellerId, setSellerId] = useState(sellers[0]?.id ?? '');
  const [price, setPrice] = useState('');
  const [cadence, setCadence] = useState('per quarter');
  const [notes, setNotes] = useState('');

  function create() {
    const seller = sellers.find((item) => item.id === sellerId);
    if (!seller || !price) return onToast('Select a dealer and set a price.', 'err');

    const quote: DealerQuote = {
      id: uid('quote'),
      profileId: seller.id,
      businessName: seller.name,
      price: Number(price),
      cadence,
      notes: notes.trim(),
      status: 'sent',
      createdAt: new Date().toISOString(),
    };
    onQuotes([quote, ...quotes]);
    onToast(`Custom quote of ${inr(quote.price)} sent to ${seller.name}`, 'ok');
    setPrice('');
    setNotes('');
  }

  return (
    <>
      <div className="section__head" style={{ marginBottom: 16 }}>
        <div>
          <h2 className="section__title">Dealer Tier — Custom Pricing</h2>
          <p className="section__sub">
            Tier 4 storefront pricing is set per dealer by an admin. Quotes appear on the dealer's packages page.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel__title">
          <IconWallet size={15} /> New dealer quote
        </div>
        <div className="form-grid form-grid--3">
          <div className="field">
            <label className="field__label" htmlFor="dp-seller">
              Dealer
            </label>
            <select id="dp-seller" className="select" value={sellerId} onChange={(event) => setSellerId(event.target.value)}>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="dp-price">
              Custom price (₹)
            </label>
            <input
              id="dp-price"
              className="input"
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="15000"
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="dp-cadence">
              Billing cadence
            </label>
            <select id="dp-cadence" className="select" value={cadence} onChange={(event) => setCadence(event.target.value)}>
              <option>per month</option>
              <option>per quarter</option>
              <option>per year</option>
              <option>one-time</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="dp-notes">
            Inclusions / notes
          </label>
          <textarea
            id="dp-notes"
            className="textarea"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Unlimited inventory, bulk reel ingestion, dedicated account manager, custom domain."
          />
        </div>
        <button className="btn btn--primary" onClick={create}>
          Send quote
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Dealer</th>
              <th>Price</th>
              <th>Cadence</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: 'var(--ink-3)' }}>
                  No dealer quotes issued yet.
                </td>
              </tr>
            )}
            {quotes.map((quote) => (
              <tr key={quote.id}>
                <td>
                  <b>{quote.businessName}</b>
                  {quote.notes && <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{quote.notes}</div>}
                </td>
                <td>
                  <b>{inr(quote.price)}</b>
                </td>
                <td>{quote.cadence}</td>
                <td>
                  <span className="badge badge--soft">{quote.status}</span>
                </td>
                <td>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => onQuotes(quotes.filter((item) => item.id !== quote.id))}
                  >
                    <IconTrash size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ========================================================================== */
/* Listing registry                                                            */
/* ========================================================================== */
function ListingRegistry({
  listings,
  sellers,
  onListings,
  onToast,
  onOpenListing,
}: {
  listings: Listing[];
  sellers: Seller[];
  onListings: (listings: Listing[]) => void;
  onToast: (text: string, kind?: 'ok' | 'err' | 'info') => void;
  onOpenListing: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = listings.filter((listing) => listing.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <div className="section__head" style={{ marginBottom: 16 }}>
        <div>
          <h2 className="section__title">Listing Registry</h2>
          <p className="section__sub">{listings.length} listings indexed across the platform.</p>
        </div>
      </div>

      <input
        className="input"
        style={{ marginBottom: 16 }}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter listings by title…"
      />

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Listing</th>
              <th>Seller</th>
              <th>Tier</th>
              <th>Media</th>
              <th>Views</th>
              <th>Saves</th>
              <th>Leads</th>
              <th>Featured</th>
              <th>Live</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((listing) => (
              <tr key={listing.id}>
                <td style={{ maxWidth: 240 }}>
                  <button style={{ textAlign: 'left', fontWeight: 650 }} onClick={() => onOpenListing(listing.id)}>
                    {listing.title}
                  </button>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{inr(listing.price)}</div>
                </td>
                <td>{sellers.find((s) => s.id === listing.sellerId)?.name ?? '—'}</td>
                <td>
                  <span className="badge badge--soft">{listing.tier}</span>
                </td>
                <td>
                  {listing.media?.length
                    ? `${listing.media.length} hosted`
                    : listing.video
                      ? providerLabel(listing.video.provider)
                      : `${listing.photos.length} photos`}
                </td>
                <td>{compact(listing.viewCount)}</td>
                <td>{compact(listing.saveCount)}</td>
                <td>{compact(listing.leadCount)}</td>
                <td>
                  <button
                    className={`chip chip--sm${listing.featured ? ' is-on' : ''}`}
                    onClick={() =>
                      onListings(listings.map((l) => (l.id === listing.id ? { ...l, featured: !l.featured } : l)))
                    }
                  >
                    {listing.featured ? 'Featured' : 'Standard'}
                  </button>
                </td>
                <td>
                  {/* Publish / unpublish writes straight to Supabase. */}
                  <button
                    className={`chip chip--sm${listing.status === 'active' ? ' is-on' : ''}`}
                    onClick={async () => {
                      const goLive = listing.status !== 'active';
                      const result = await setListingPublished(listing.id, goLive);
                      if (!result.ok) return onToast(`Failed: ${result.error}`, 'err');
                      onListings(
                        listings.map((l) =>
                          l.id === listing.id ? { ...l, status: goLive ? 'active' : 'paused' } : l,
                        ),
                      );
                      onToast(goLive ? 'Published live' : 'Unpublished — hidden from public feed', 'ok');
                    }}
                  >
                    {listing.status === 'active' ? 'Live' : 'Hidden'}
                  </button>
                </td>
                <td>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => {
                      onListings(listings.filter((l) => l.id !== listing.id));
                      removeListing(listing.id);
                      onToast('Listing removed from Supabase', 'info');
                    }}
                  >
                    <IconTrash size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ========================================================================== */
/* Platform metrics                                                            */
/* ========================================================================== */
function PlatformMetrics({
  listings,
  sellers,
  categories,
}: {
  listings: Listing[];
  sellers: Seller[];
  categories: Category[];
}) {
  const totals = listings.reduce(
    (acc, listing) => ({
      views: acc.views + listing.viewCount,
      saves: acc.saves + listing.saveCount,
      clicks: acc.clicks + listing.clickCount,
      leads: acc.leads + listing.leadCount,
    }),
    { views: 0, saves: 0, clicks: 0, leads: 0 },
  );

  const withVideo = listings.filter((l) => l.video).length;
  const hosted = listings.filter((l) => l.media?.length).length;
  const verified = sellers.filter((s) => s.verification !== 'none').length;
  const revenue = listings.reduce(
    (sum, l) => sum + (l.tier === 'standard' ? 200 : l.tier === 'comprehensive' ? 1000 : 0),
    0,
  );

  const byCategory = categories
    .map((category) => ({
      name: category.name,
      accent: category.accent,
      count: listings.filter((l) => l.categoryId === category.id).length,
      views: listings.filter((l) => l.categoryId === category.id).reduce((sum, l) => sum + l.viewCount, 0),
    }))
    .sort((a, b) => b.views - a.views);

  const max = Math.max(1, ...byCategory.map((row) => row.views));

  return (
    <>
      <div className="section__head" style={{ marginBottom: 16 }}>
        <div>
          <h2 className="section__title">Platform Metrics</h2>
          <p className="section__sub">
            Database-level impression, click, save and lead counters. Views require a 10-second dwell.
          </p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        {[
          { label: 'Total views', value: compact(totals.views) },
          { label: 'Total clicks', value: compact(totals.clicks) },
          { label: 'Total saves', value: compact(totals.saves) },
          { label: 'Total leads', value: compact(totals.leads) },
          { label: 'Listings', value: String(listings.length) },
          { label: 'Social embeds', value: `${withVideo}/${listings.length}` },
          { label: 'EXY-hosted media', value: String(hosted) },
          { label: 'Verified sellers', value: `${verified}/${sellers.length}` },
          { label: 'Package revenue', value: inr(revenue) },
        ].map((tile) => (
          <div key={tile.label} className="stat-tile">
            <span>{tile.label}</span>
            <b>{tile.value}</b>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel__title">Impressions by category</div>
        {byCategory.map((row) => (
          <div key={row.name} style={{ marginBottom: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
              <b style={{ fontWeight: 650 }}>{row.name}</b>
              <span style={{ color: 'var(--ink-3)' }}>
                {compact(row.views)} views · {row.count} ads
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(row.views / max) * 100}%`,
                  height: '100%',
                  background: row.accent,
                  borderRadius: 99,
                  transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
