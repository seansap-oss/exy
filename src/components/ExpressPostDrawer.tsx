import { useEffect, useMemo, useRef, useState } from 'react';
import type { Listing, Profile } from '../types';
import { keepSharedUrl, recoverSharedUrl, releaseSharedUrl, type SharePayload } from '../lib/shareTarget';
import { readLastLocation, rememberText, writeLastLocation } from '../lib/sellerMemory';
import { HistorySuggest } from './HistorySuggest';
import { saveListing } from '../lib/publish';
import { CATEGORIES } from '../data/categories';
import { parseVideoUrl, providerLabel } from '../lib/embeds';
import { TIER_LIMITS } from '../lib/payments';
import { uid } from '../lib/storage';
import { IconCheck, IconClose, IconSpark, IconVideo } from './Icons';

interface Props {
  payload: SharePayload | null;
  profile: Profile | null;
  onClose: () => void;
  onPublish: (listing: Listing) => void;
  onNeedAuth: () => void;
}

/**
 * Module 2.1 â€” Express Post Drawer.
 * Opens when a Reel/Short is shared into EXY from Instagram, Facebook or
 * YouTube. Video link, thumbnail and description arrive pre-filled; the user
 * only picks a category, types a price and hits Quick Publish.
 */
export function ExpressPostDrawer({ payload, profile, onClose, onPublish, onNeedAuth }: Props) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /**
   * Feature 1 â€” seed the form exactly once per shared payload.
   *
   * Previously this effect keyed on the `payload` object identity, so any
   * parent re-render produced a new object, re-ran the effect and wiped
   * whatever the user had typed â€” including the URL. It now keys on a stable
   * content signature and never overwrites a field with an empty value, so a
   * failed thumbnail/caption extraction leaves the URL intact.
   */
  const seededRef = useRef<string | null>(null);

  useEffect(() => {
    if (!payload) return;
    const signature = `${payload.url}::${payload.title}::${payload.text}`;
    if (seededRef.current === signature) return;
    seededRef.current = signature;

    const incoming = payload.url || payload.video?.url || recoverSharedUrl() || '';
    if (incoming) {
      setUrl(incoming);
      keepSharedUrl(incoming);
    }
    if (payload.caption) {
      setDescription(payload.caption);
      setTitle(payload.caption.split('\n')[0]?.slice(0, 80) ?? '');
    }
    if (!city) {
      const remembered = readLastLocation();
      if (remembered?.city) setCity(remembered.city);
    }
    setError('');
  }, [payload, city]);

  // Survive a drawer remount or an accidental reload mid-form.
  useEffect(() => {
    if (url) keepSharedUrl(url);
  }, [url]);

  const video = useMemo(() => parseVideoUrl(url), [url]);
  const subs = CATEGORIES.find((category) => category.id === categoryId)?.children ?? [];

  if (!payload) return null;

  function publish() {
    setError('');
    if (!profile) return onNeedAuth();
    if (!video) return setError('That link is not a recognised Instagram, YouTube, Facebook or TikTok video.');
    if (title.trim().length < 6) return setError('Give the listing a title of at least 6 characters.');
    if (!categoryId) return setError('Pick a category.');

    const limits = TIER_LIMITS[profile.tier];
    const listing: Listing = {
      id: uid('lst'),
      title: title.trim(),
      description: description.trim() || `Shared from ${providerLabel(video.provider)}.`,
      price: Number(price) || 0,
      negotiable: true,
      categoryId,
      subCategoryId: subCategoryId || subs[0]?.id || '',
      tags: [],
      features: [],
      location: city.trim() ? `${city.trim()}, India` : profile.location,
      region: 'india',
      city: city.trim() || profile.location.split(',')[0],
      sellerId: profile.id,
      video: limits.videos > 0 ? video : undefined,
      photos: ['linear-gradient(135deg,#FFB300,#FF9500)'],
      tier: profile.tier,
      featured: profile.tier === 'comprehensive' || profile.tier === 'dealer',
      condition: 'new',
      createdAt: new Date().toISOString(),
      viewCount: 0,
      saveCount: 0,
      clickCount: 0,
      leadCount: 0,
      todayViews: 0,
      hidePhone: profile.hidePhone,
      status: 'active',
    };

    // Write to Supabase FIRST. The drawer stays open and keeps every field on
    // failure so the user can correct and retry without re-entering anything.
    setBusy(true);
    void saveListing(listing, true).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(`Publish failed: ${result.error}`);
        return;
      }
      writeLastLocation(listing.city, '', profile.id);
      rememberText('location', listing.city, profile.id);
      if (listing.description) rememberText('description', listing.description, profile.id);
      releaseSharedUrl();
      onPublish({ ...listing, id: result.id ?? listing.id });
      onClose();
    });
  }

  return (
    <div className="xpd" role="dialog" aria-modal="true" aria-label="Express post">
      <div className="xpd__scrim" onClick={onClose} />
      <div className="xpd__sheet">
        <div className="xpd__grab" />

        <header className="xpd__head">
          <span className="xpd__spark">
            <IconSpark size={16} />
          </span>
          <div style={{ flex: 1 }}>
            <b>Express post</b>
            <span>
              {video ? `${providerLabel(video.provider)} detected â€” publish in seconds` : 'Shared link received'}
            </span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </header>

        <div className="xpd__body">
          <div className="xpd__preview">
            <div
              className="xpd__thumb"
              style={
                video?.poster
                  ? { backgroundImage: `url(${video.poster})` }
                  : { background: 'linear-gradient(135deg,#FFB300,#FF9500)' }
              }
            >
              <IconVideo size={20} />
            </div>
            <div className="xpd__link">
              <b>Video link</b>
              <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://â€¦" />
              <span>{video ? `âœ“ ${providerLabel(video.provider)} Â· ${video.externalId}` : 'Not recognised yet'}</span>
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="xp-title">
              Title
            </label>
            <input
              id="xp-title"
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What are you selling?"
              maxLength={90}
            />
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="field__label" htmlFor="xp-price">
                Price (â‚¹)
              </label>
              <input
                id="xp-price"
                className="input"
                type="number"
                inputMode="numeric"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0 for ask price"
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="xp-city">
                City
              </label>
              <input
                id="xp-city"
                className="input"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Bengaluru"
              />
              <HistorySuggest
                type="location"
                value={city}
                onPick={setCity}
                profileId={profile?.id}
                label="Recent locations"
              />
            </div>
          </div>

          <div className="field">
            <span className="field__label">Category</span>
            <div className="chips">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  className={`chip chip--sm${categoryId === category.id ? ' is-on' : ''}`}
                  onClick={() => {
                    setCategoryId(category.id);
                    setSubCategoryId('');
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {subs.length > 0 && (
            <div className="field">
              <span className="field__label">Subcategory</span>
              <div className="chips">
                {subs.map((sub) => (
                  <button
                    key={sub.id}
                    className={`chip chip--sm${subCategoryId === sub.id ? ' is-on' : ''}`}
                    onClick={() => setSubCategoryId(sub.id)}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="xp-desc">
              Description <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>â€” auto-filled from caption</span>
            </label>
            <textarea
              id="xp-desc"
              className="textarea"
              style={{ minHeight: 84 }}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <HistorySuggest
              type="description"
              value={description}
              onPick={setDescription}
              profileId={profile?.id}
              label="Previous descriptions"
            />
          </div>

          {error && <div className="field__error">{error}</div>}
        </div>

        <footer className="xpd__foot">
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" style={{ flex: 1 }} onClick={publish} disabled={busy}>
            <IconCheck size={16} /> {busy ? 'Publishing' : 'Quick Publish'}
          </button>
        </footer>
      </div>
    </div>
  );
}
