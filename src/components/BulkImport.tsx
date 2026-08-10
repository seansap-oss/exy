import { useMemo, useState } from 'react';
import type { Category, Listing, Seller } from '../types';
import { parseVideoUrl } from '../lib/embeds';
import { saveListing, validateForPublish } from '../lib/publish';
import { uid } from '../lib/storage';
import { IconCheck, IconClose, IconPlus, IconTrash } from './Icons';

const MAX_ROWS = 20;
const ROW_BATCH = 10;

interface Row {
  key: string;
  url: string;
  title: string;
  categoryId: string;
  price: string;
  city: string;
  description: string;
  status: 'draft' | 'live';
  /** Result of the last validate/publish pass. */
  error: string | null;
  publishedId: string | null;
  busy: boolean;
}

function blankRow(): Row {
  return {
    key: uid('row'),
    url: '',
    title: '',
    categoryId: '',
    price: '',
    city: '',
    description: '',
    status: 'live',
    error: null,
    publishedId: null,
    busy: false,
  };
}

interface Props {
  categories: Category[];
  sellers: Seller[];
  listings: Listing[];
  onListings: (listings: Listing[]) => void;
  onToast: (text: string, kind?: 'ok' | 'err' | 'info') => void;
}

/**
 * Desktop bulk importer. Uses the same saveListing() path as the single-post
 * form, so provider ids stay in text columns and seller_id is always taken
 * from the authenticated session.
 */
export function BulkImport({ categories, sellers, listings, onListings, onToast }: Props) {
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: ROW_BATCH }, blankRow));
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [summary, setSummary] = useState<{ ok: number; failed: number } | null>(null);

  const defaultSeller = sellers[0]?.id ?? '';

  const patch = (key: string, next: Partial<Row>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...next } : row)));

  const filled = useMemo(() => rows.filter((row) => row.url.trim() || row.title.trim()), [rows]);

  function addRows() {
    setRows((prev) => {
      const room = MAX_ROWS - prev.length;
      if (room <= 0) {
        onToast(`Maximum ${MAX_ROWS} rows per batch.`, 'info');
        return prev;
      }
      return [...prev, ...Array.from({ length: Math.min(ROW_BATCH, room) }, blankRow)];
    });
  }

  /** Builds a Listing from a row, or returns the reason it cannot be built. */
  function toListing(row: Row): { listing: Listing | null; error: string | null } {
    const video = parseVideoUrl(row.url.trim());
    if (!video) return { listing: null, error: 'Unrecognised URL — use a public Instagram, YouTube or Facebook link.' };
    if (row.title.trim().length < 6) return { listing: null, error: 'Title must be at least 6 characters.' };
    if (!row.categoryId) return { listing: null, error: 'Category is required.' };
    if (!row.city.trim()) return { listing: null, error: 'City is required.' };

    const seller = sellers.find((item) => item.id === defaultSeller);
    const listing: Listing = {
      // Client reference only. saveListing() omits it so PostgreSQL issues the UUID.
      id: uid('lst'),
      title: row.title.trim(),
      description: row.description.trim() || `Imported from ${video.provider}.`,
      price: Number(row.price) || 0,
      negotiable: true,
      categoryId: row.categoryId,
      subCategoryId: categories.find((c) => c.id === row.categoryId)?.children[0]?.id ?? '',
      tags: [],
      features: [],
      location: row.city.trim(),
      region: 'india',
      city: row.city.trim(),
      sellerId: defaultSeller,
      video,
      photos: ['linear-gradient(135deg,#FFB300,#FF9500)'],
      tier: 'comprehensive',
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
    };

    const check = validateForPublish(listing);
    if (!check.valid) return { listing: null, error: check.errors.join(' ') };
    return { listing, error: null };
  }

  function validateAll() {
    let valid = 0;
    setRows((prev) =>
      prev.map((row) => {
        if (!row.url.trim() && !row.title.trim()) return { ...row, error: null };
        const { error } = toListing(row);
        if (!error) valid += 1;
        return { ...row, error };
      }),
    );
    onToast(`${valid} of ${filled.length} rows are valid.`, valid === filled.length ? 'ok' : 'info');
  }

  /** Sequential writes so we never trip Supabase rate limits. */
  async function run(publishLive: boolean) {
    if (running) return; // guards a double-click
    const targets = rows.filter((row) => row.url.trim() && !row.publishedId);
    if (!targets.length) return onToast('Nothing to submit.', 'info');

    setRunning(true);
    setSummary(null);
    setProgress({ done: 0, total: targets.length });

    let ok = 0;
    let failed = 0;

    for (let index = 0; index < targets.length; index += 1) {
      const row = targets[index];
      patch(row.key, { busy: true, error: null });

      const { listing, error } = toListing(row);
      if (!listing) {
        patch(row.key, { busy: false, error });
        failed += 1;
      } else {
        const result = await saveListing(listing, publishLive);
        if (result.ok) {
          patch(row.key, { busy: false, error: null, publishedId: result.id });
          if (publishLive) onListings([{ ...listing, id: result.id ?? listing.id }, ...listings]);
          ok += 1;
        } else {
          patch(row.key, { busy: false, error: result.error });
          failed += 1;
        }
      }
      setProgress({ done: index + 1, total: targets.length });
    }

    setRunning(false);
    setSummary({ ok, failed });
    onToast(
      `${ok} ${publishLive ? 'published' : 'saved as drafts'}${failed ? `, ${failed} failed` : ''}.`,
      failed ? 'err' : 'ok',
    );
  }

  return (
    <>
      <div className="section__head" style={{ marginBottom: 16 }}>
        <div>
          <h2 className="section__title">Bulk URL Import</h2>
          <p className="section__sub">
            Paste up to {MAX_ROWS} public Instagram, YouTube or Facebook links and publish them in one pass. Uses the
            same Supabase publishing path as the single-post form.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <button className="btn btn--ghost btn--sm" onClick={addRows} disabled={running || rows.length >= MAX_ROWS}>
          <IconPlus size={14} /> Add 10 rows
        </button>
        <button className="btn btn--ghost btn--sm" onClick={validateAll} disabled={running}>
          Validate all
        </button>
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => setRows((prev) => prev.filter((row) => row.url.trim() || row.title.trim()))}
          disabled={running}
        >
          Clear empty rows
        </button>
        <span className="toolbar__spacer" />
        {progress && (
          <span className="badge badge--soft">
            {progress.done} of {progress.total} processed
          </span>
        )}
        <button className="btn btn--ghost btn--sm" onClick={() => void run(false)} disabled={running}>
          Save all as drafts
        </button>
        <button className="btn btn--primary btn--sm" onClick={() => void run(true)} disabled={running}>
          <IconCheck size={14} /> {running ? 'Publishing…' : 'Publish all valid'}
        </button>
      </div>

      {summary && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panel__title">Result</div>
          <div className="pill-row">
            <span className="badge badge--verified">{summary.ok} succeeded</span>
            {summary.failed > 0 && <span className="badge badge--soft">{summary.failed} failed</span>}
          </div>
          <span className="field__hint" style={{ marginTop: 8, display: 'block' }}>
            Failed rows keep their values and their exact error so you can correct and re-run.
          </span>
        </div>
      )}

      <div className="table-wrap">
        <table className="table bulk-table">
          <thead>
            <tr>
              <th style={{ width: 30 }}>#</th>
              <th style={{ minWidth: 210 }}>Video URL</th>
              <th style={{ minWidth: 160 }}>Title</th>
              <th style={{ minWidth: 130 }}>Category</th>
              <th style={{ width: 90 }}>Price</th>
              <th style={{ width: 120 }}>City</th>
              <th style={{ minWidth: 150 }}>Description</th>
              <th style={{ width: 110 }}>Status</th>
              <th style={{ width: 44 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const detected = row.url.trim() ? parseVideoUrl(row.url.trim()) : null;
              return (
                <tr key={row.key} className={row.error ? 'bulk-row--error' : row.publishedId ? 'bulk-row--ok' : ''}>
                  <td style={{ color: 'var(--ink-3)', fontSize: 11 }}>{index + 1}</td>
                  <td>
                    <input
                      className="input bulk-input"
                      value={row.url}
                      onChange={(event) => patch(row.key, { url: event.target.value, error: null })}
                      placeholder="https://www.instagram.com/reel/…"
                      disabled={row.busy || Boolean(row.publishedId)}
                    />
                    {detected && (
                      <span className="bulk-detect">
                        {detected.provider} · {detected.externalId}
                      </span>
                    )}
                  </td>
                  <td>
                    <input
                      className="input bulk-input"
                      value={row.title}
                      onChange={(event) => patch(row.key, { title: event.target.value })}
                      disabled={row.busy || Boolean(row.publishedId)}
                    />
                  </td>
                  <td>
                    <select
                      className="select bulk-input"
                      value={row.categoryId}
                      onChange={(event) => patch(row.key, { categoryId: event.target.value })}
                      disabled={row.busy || Boolean(row.publishedId)}
                    >
                      <option value="">Select…</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="input bulk-input"
                      type="number"
                      value={row.price}
                      onChange={(event) => patch(row.key, { price: event.target.value })}
                      disabled={row.busy || Boolean(row.publishedId)}
                    />
                  </td>
                  <td>
                    <input
                      className="input bulk-input"
                      value={row.city}
                      onChange={(event) => patch(row.key, { city: event.target.value })}
                      disabled={row.busy || Boolean(row.publishedId)}
                    />
                  </td>
                  <td>
                    <input
                      className="input bulk-input"
                      value={row.description}
                      onChange={(event) => patch(row.key, { description: event.target.value })}
                      disabled={row.busy || Boolean(row.publishedId)}
                    />
                  </td>
                  <td>
                    {row.busy && <span className="badge badge--soft">Working…</span>}
                    {!row.busy && row.publishedId && (
                      <span className="badge badge--verified" title={row.publishedId}>
                        <IconCheck size={10} /> {row.publishedId.slice(0, 8)}…
                      </span>
                    )}
                    {!row.busy && !row.publishedId && row.error && (
                      <span className="badge badge--soft" style={{ color: 'var(--danger)' }}>
                        <IconClose size={10} /> Failed
                      </span>
                    )}
                    {!row.busy && !row.publishedId && !row.error && <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>Ready</span>}
                  </td>
                  <td>
                    <button
                      className="btn btn--danger btn--sm"
                      onClick={() => setRows((prev) => prev.filter((item) => item.key !== row.key))}
                      disabled={running}
                      aria-label="Remove row"
                    >
                      <IconTrash size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.some((row) => row.error) && (
        <div className="panel" style={{ marginTop: 14 }}>
          <div className="panel__title">Row errors</div>
          <ul className="feature-list">
            {rows.map((row, index) =>
              row.error ? (
                <li key={row.key} style={{ color: 'var(--danger)' }}>
                  Row {index + 1}: {row.error}
                </li>
              ) : null,
            )}
          </ul>
        </div>
      )}
    </>
  );
}
