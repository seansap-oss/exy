import { useMemo, useState } from 'react';
import type { Listing, ListingCondition, NativeMedia, Profile } from '../types';
import { TAXONOMY, TAX_MAP, subcategoriesOf, typesOf, attributesOf } from '../data/taxonomy';
import { parseVideoUrl, providerLabel } from '../lib/embeds';
import { isSuperAdmin, limitLabel, limitsForProfile } from '../lib/payments';
import { uid } from '../lib/storage';
import { UnifiedUploader } from './UnifiedUploader';
import { HistorySuggest } from './HistorySuggest';
import { readLastLocation, rememberText, requestCurrentLocation, writeLastLocation, clearLastLocation } from '../lib/sellerMemory';
import { Modal, Switch } from './Ui';
import { VideoEmbed } from './VideoEmbed';
import { IconCheck, IconLock, IconPin, IconUpload, IconVideo } from './Icons';

const SWATCHES = [
  'linear-gradient(135deg,#fde68a,#f2713a)',
  'linear-gradient(135deg,#bfdbfe,#2563eb)',
  'linear-gradient(135deg,#bbf7d0,#16a34a)',
  'linear-gradient(135deg,#e9d5ff,#7c3aed)',
  'linear-gradient(135deg,#fed7aa,#c2410c)',
  'linear-gradient(135deg,#cbd5e1,#334155)',
  'linear-gradient(135deg,#a5f3fc,#0e7490)',
  'linear-gradient(135deg,#fbcfe8,#be185d)',
];

interface Props {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  activeAdCount: number;
  onPublish: (listing: Listing) => void;
  onUpgrade: () => void;
  onToast: (text: string, kind?: 'ok' | 'err' | 'info') => void;
}

export function SellFlow({ open, onClose, profile, activeAdCount, onPublish, onUpgrade, onToast }: Props) {
  const admin = isSuperAdmin(profile);
  const limits = limitsForProfile(profile);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    priceUnit: '',
    negotiable: true,
    categoryId: '',
    subCategoryId: '',
    condition: 'new' as ListingCondition,
    city: readLastLocation()?.city ?? '',
    location: readLastLocation()?.area ?? '',
    videoUrl: '',
    photos: [SWATCHES[0]] as string[],
    hidePhone: false,
    phone: '',
    tags: [] as string[],
    typeId: '',
    attributes: {} as Record<string, string>,
    features: ['', '', ''],
  });
  const [hosted, setHosted] = useState<NativeMedia[]>([]);
  const [error, setError] = useState('');

  const subs = form.categoryId ? subcategoriesOf(form.categoryId) : [];
  const types = form.categoryId && form.subCategoryId ? typesOf(form.categoryId, form.subCategoryId) : [];
  const attrDefs = form.categoryId ? attributesOf(form.categoryId) : [];
  const video = useMemo(() => parseVideoUrl(form.videoUrl), [form.videoUrl]);
  const overQuota = !admin && activeAdCount >= limits.ads;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function next() {
    setError('');
    if (step === 0) {
      if (!form.categoryId || !form.subCategoryId) return setError('Pick a category and subcategory.');
    }
    if (step === 1) {
      if (form.title.trim().length < 8) return setError('Title must be at least 8 characters.');
      if (form.description.trim().length < 20) return setError('Add a description of at least 20 characters.');
      if (!form.city.trim()) return setError('Enter the city where the item or service is located.');
    }
    setStep((prev) => Math.min(prev + 1, 3));
  }

  function publish() {
    setError('');
    if (overQuota) return setError(`Your ${profile.tier} plan allows ${limits.ads} active ad(s). Upgrade to post more.`);
    if (!form.hidePhone && form.phone.replace(/\D/g, '').length < 10) {
      return setError('Enter a valid contact number, or enable phone privacy masking.');
    }

    const uploadedVideo = hosted.find((item) => item.kind === 'video');
    const listing: Listing = {
      id: uid('lst'),
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      priceUnit: form.priceUnit.trim() || undefined,
      negotiable: form.negotiable,
      categoryId: form.categoryId,
      subCategoryId: form.subCategoryId,
      tags: form.tags,
      typeId: form.typeId || undefined,
      attributes: Object.keys(form.attributes).length ? form.attributes : undefined,
      features: form.features.map((f) => f.trim()).filter(Boolean),
      location: form.location.trim() || `${form.city.trim()}, India`,
      region: 'india',
      city: form.city.trim(),
      sellerId: profile.id,
      video:
        limits.videos > 0 && uploadedVideo
          ? {
              provider: 'native' as const,
              url: uploadedVideo.src,
              externalId: uploadedVideo.id,
              embedSrc: uploadedVideo.src,
              poster: uploadedVideo.poster,
            }
          : limits.videos > 0 && video
            ? video
            : undefined,
      media: hosted.length ? hosted : undefined,
      photos: hosted.filter((m) => m.kind === 'image').length
        ? hosted.filter((m) => m.kind === 'image').map((m) => `url(${m.src}) center/cover`)
        : form.photos.slice(0, limits.photos),
      tier: profile.tier,
      featured: profile.tier === 'comprehensive' || profile.tier === 'dealer',
      condition: form.condition,
      createdAt: new Date().toISOString(),
      viewCount: 0,
      saveCount: 0,
      clickCount: 0,
      leadCount: 0,
      todayViews: 0,
      hidePhone: form.hidePhone,
      status: 'active',
    };
    // Feature 2 + 3 - remember what the seller used.
    writeLastLocation(listing.city, form.location, profile.id);
    rememberText('location', listing.city, profile.id);
    if (listing.description) rememberText('description', listing.description, profile.id);
    listing.features.forEach((feature) => rememberText('phrase', feature, profile.id));

    onPublish(listing);
    setStep(0);
    setForm({
      title: '',
      description: '',
      price: '',
      priceUnit: '',
      negotiable: true,
      categoryId: '',
      subCategoryId: '',
      condition: 'new',
      city: readLastLocation()?.city ?? '',
      location: readLastLocation()?.area ?? '',
      videoUrl: '',
      photos: [SWATCHES[0]],
      hidePhone: false,
      phone: '',
      tags: [],
      typeId: '',
      attributes: {},
      features: ['', '', ''],
    });
    setHosted([]);
    onClose();
  }

  const steps = ['Category', 'Details', 'Media', 'Contact'];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Post a listing"
      subtitle={
        admin
          ? `SUPER ADMIN · ${activeAdCount} active ads used · Unlimited photos · Unlimited video`
          : `${profile.tier.toUpperCase()} plan · ${activeAdCount}/${limitLabel(limits.ads)} ads used · ${limitLabel(limits.photos)} photos · ${limits.videos ? `${limits.videos} video embed` : 'no video embed'}`
      }
      footer={
        <>
          {step > 0 && (
            <button className="btn btn--ghost" onClick={() => setStep((prev) => prev - 1)}>
              Back
            </button>
          )}
          <span className="spacer" />
          <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700 }}>
            Step {step + 1} of {steps.length}
          </span>
          {step < 3 ? (
            <button className="btn btn--primary" onClick={next}>
              Continue
            </button>
          ) : (
            <button className="btn btn--primary" onClick={publish} disabled={overQuota}>
              <IconCheck size={16} /> Publish listing
            </button>
          )}
        </>
      }
    >
      <div className="tabs" style={{ marginBottom: 20 }}>
        {steps.map((label, index) => (
          <button
            key={label}
            className={`tab${index === step ? ' is-on' : ''}`}
            onClick={() => index < step && setStep(index)}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      {overQuota && !admin && (
        <div className="urgency" style={{ marginBottom: 18 }}>
          <span className="urgency__flame">⚡</span>
          <span>
            You've used all {limits.ads} active ad slots on the {profile.tier} plan.{' '}
            <button style={{ fontWeight: 800, textDecoration: 'underline' }} onClick={onUpgrade}>
              Upgrade now
            </button>{' '}
            to publish more.
          </span>
        </div>
      )}

      {step === 0 && (
        <>
          <div className="field">
            <span className="field__label">Broad category</span>
            <div className="chips">
              {TAXONOMY.map((category) => (
                <button
                  key={category.id}
                  className={`chip${form.categoryId === category.id ? ' is-on' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, categoryId: category.id, subCategoryId: '' }))}
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
                    className={`chip${form.subCategoryId === sub.id ? ' is-on' : ''}`}
                    onClick={() => set('subCategoryId', sub.id)}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Type — third taxonomy level */}
          {types.length > 0 && (
            <div className="field">
              <span className="field__label">Type</span>
              <div className="chips">
                {types.map((type) => (
                  <button
                    key={type.id}
                    className={`chip chip--sm${form.typeId === type.id ? ' is-on' : ''}`}
                    onClick={() => set('typeId', form.typeId === type.id ? '' : type.id)}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic, category-specific attributes from the shared taxonomy */}
          {attrDefs.length > 0 && (
            <div className="field">
              <span className="field__label">{TAX_MAP[form.categoryId]?.name} details</span>
              <div className="form-grid form-grid--3">
                {attrDefs.map((attr) => (
                  <div className="field" key={attr.key}>
                    <label className="field__label" htmlFor={`sf-${attr.key}`}>
                      {attr.label}
                      {attr.unit ? ` (${attr.unit})` : ''}
                    </label>
                    {attr.options?.length ? (
                      <select
                        id={`sf-${attr.key}`}
                        className="select"
                        value={form.attributes[attr.key] ?? ''}
                        onChange={(event) =>
                          set('attributes', { ...form.attributes, [attr.key]: event.target.value })
                        }
                      >
                        <option value="">Not specified</option>
                        {attr.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`sf-${attr.key}`}
                        className="input"
                        type={attr.input === 'number' ? 'number' : 'text'}
                        value={form.attributes[attr.key] ?? ''}
                        onChange={(event) =>
                          set('attributes', { ...form.attributes, [attr.key]: event.target.value })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <div className="field">
            <label className="field__label" htmlFor="s-title">
              Listing title
            </label>
            <input
              id="s-title"
              className="input"
              value={form.title}
              onChange={(event) => set('title', event.target.value)}
              placeholder="e.g. Wire-cut red bricks — truckload delivery in 24 hrs"
              maxLength={90}
            />
            <span className="field__hint">{form.title.length}/90 characters</span>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="s-desc">
              Description
            </label>
            <textarea
              id="s-desc"
              className="textarea"
              value={form.description}
              onChange={(event) => set('description', event.target.value)}
              placeholder="Describe condition, quantity, delivery terms and what makes your offer better."
            />
            <HistorySuggest
              type="description"
              value={form.description}
              onPick={(text) => set('description', text)}
              profileId={profile.id}
              label="Previous descriptions"
            />
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="field__label" htmlFor="s-price">
                Price (₹) — leave 0 for "Ask price"
              </label>
              <input
                id="s-price"
                className="input"
                type="number"
                min={0}
                value={form.price}
                onChange={(event) => set('price', event.target.value)}
                placeholder="18500"
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="s-unit">
                Price unit (optional)
              </label>
              <input
                id="s-unit"
                className="input"
                value={form.priceUnit}
                onChange={(event) => set('priceUnit', event.target.value)}
                placeholder="per bag / per month"
              />
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="field__label" htmlFor="s-city">
                City
              </label>
              <input
                id="s-city"
                className="input"
                value={form.city}
                onChange={(event) => set('city', event.target.value)}
                placeholder="Bengaluru"
              />
              {/* Feature 2 — location memory controls */}
              <div className="loc-memory">
                <button
                  type="button"
                  className="chip chip--sm"
                  onClick={async () => {
                    const position = await requestCurrentLocation();
                    if (!position) return onToast('Location permission denied or unavailable.', 'err');
                    set('location', `Near ${position.latitude.toFixed(3)}, ${position.longitude.toFixed(3)}`);
                    onToast('Current location captured.', 'ok');
                  }}
                >
                  <IconPin size={12} /> Use current location
                </button>
                {form.city && (
                  <button
                    type="button"
                    className="chip chip--sm"
                    onClick={() => {
                      set('city', '');
                      set('location', '');
                      clearLastLocation(profile.id);
                      onToast('Saved location cleared.', 'info');
                    }}
                  >
                    Clear saved location
                  </button>
                )}
              </div>
              <HistorySuggest
                type="location"
                value={form.city}
                onPick={(text) => set('city', text)}
                profileId={profile.id}
                label="Recent locations"
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="s-loc">
                Locality / area
              </label>
              <input
                id="s-loc"
                className="input"
                value={form.location}
                onChange={(event) => set('location', event.target.value)}
                placeholder="Whitefield, Bengaluru"
              />
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="field__label" htmlFor="s-cond">
                Condition
              </label>
              <select
                id="s-cond"
                className="select"
                value={form.condition}
                onChange={(event) => set('condition', event.target.value as ListingCondition)}
              >
                <option value="new">New</option>
                <option value="like-new">Like new</option>
                <option value="good">Good</option>
                <option value="used">Used</option>
                <option value="service">Service / Contract</option>
              </select>
            </div>
            <div className="field">
              <span className="field__label">Pricing flexibility</span>
              <Switch on={form.negotiable} onChange={(value) => set('negotiable', value)} label="Price negotiable" />
            </div>
          </div>
          <div className="field">
            <span className="field__label">Key features (up to 3)</span>
            {form.features.map((feature, index) => (
              <input
                key={index}
                className="input"
                style={{ marginBottom: 8 }}
                value={feature}
                onChange={(event) => {
                  const copy = [...form.features];
                  copy[index] = event.target.value;
                  set('features', copy);
                }}
                placeholder={['Free delivery within city', 'GST invoice provided', '1-year warranty'][index]}
              />
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="field">
            <label className="field__label" htmlFor="s-video">
              <IconVideo size={13} /> Social video embed (Reel / Short / FB video)
            </label>
            <input
              id="s-video"
              className="input"
              value={form.videoUrl}
              onChange={(event) => set('videoUrl', event.target.value)}
              placeholder="https://www.instagram.com/reel/… or https://youtube.com/shorts/…"
              disabled={limits.videos === 0 && !admin}
            />
            {limits.videos === 0 && !admin ? (
              <span className="field__hint">
                Video embeds are not included in the Free plan.{' '}
                <button style={{ color: 'var(--accent)', fontWeight: 700 }} onClick={onUpgrade}>
                  Upgrade to Standard (₹200)
                </button>
              </span>
            ) : (
              <span className="field__hint">
                {video
                  ? `✓ Detected ${providerLabel(video.provider)} — id ${video.externalId}`
                  : 'Paste a public Instagram Reel, YouTube Short, Facebook Reel or TikTok URL.'}
              </span>
            )}
          </div>

          {video && (limits.videos > 0 || admin) && !hosted.length && (
            <div style={{ maxWidth: 300, margin: '0 auto 18px' }}>
              <VideoEmbed video={video} title="Listing hero preview" />
            </div>
          )}

          <div className="divider" />

          {/* One compact control for photos and videos together. */}
          <div className="field">
            <span className="field__label">
              <IconUpload size={13} /> Add photos or videos
            </span>
            <UnifiedUploader
              items={hosted}
              onChange={setHosted}
              maxPhotos={limits.photos}
              maxVideos={limits.videos}
              unlimited={admin}
              onError={(message) => onToast(message, 'err')}
            />
            {limits.videos === 0 && !admin && (
              <span className="field__hint">
                Photos only on the Free plan.{' '}
                <button style={{ color: 'var(--accent)', fontWeight: 700 }} onClick={onUpgrade}>
                  Upgrade
                </button>{' '}
                to host video.
              </span>
            )}
          </div>

          <div className="divider" />

          {/* Cover style is still available when no photo has been uploaded. */}
          {!hosted.some((item) => item.kind === 'image') && (
            <div className="field">
              <span className="field__label">Cover style ({form.photos.length}/{limitLabel(limits.photos)})</span>
              <span className="field__hint" style={{ marginBottom: 10 }}>
                Used as the card background when you haven't uploaded a photo.
              </span>
              <div className="swatches">
                {SWATCHES.map((swatch) => {
                  const on = form.photos.includes(swatch);
                  return (
                    <button
                      key={swatch}
                      className={`swatch${on ? ' is-on' : ''}`}
                      style={{ background: swatch }}
                      aria-label="Photo slot"
                      onClick={() => {
                        if (on) {
                          if (form.photos.length > 1) set('photos', form.photos.filter((p) => p !== swatch));
                        } else if (form.photos.length < limits.photos) {
                          set('photos', [...form.photos, swatch]);
                        } else {
                          setError(`Your plan allows ${limits.photos} photos. Upgrade for more.`);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <div className="field">
            <span className="field__label">
              <IconLock size={13} /> Phone privacy
            </span>
            <Switch
              on={form.hidePhone}
              onChange={(value) => set('hidePhone', value)}
              label="Hide my phone number"
              hint="Buyers reach you via in-app chat or a private callback request instead."
            />
          </div>

          {!form.hidePhone && (
            <div className="field">
              <label className="field__label" htmlFor="s-phone">
                Contact number
              </label>
              <input
                id="s-phone"
                className="input"
                value={form.phone}
                onChange={(event) => set('phone', event.target.value)}
                placeholder="+91 98765 43210"
              />
              <span className="field__hint">Shown publicly on your listing. Turn on masking to keep it private.</span>
            </div>
          )}

          <div className="divider" />

          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel__title">Review</div>
            <div className="meta-list">
              <div className="meta-item">
                <span>Category</span>
                <b>{TAX_MAP[form.categoryId]?.name ?? '—'}</b>
              </div>
              <div className="meta-item">
                <span>Subcategory</span>
                <b>{subs.find((s) => s.id === form.subCategoryId)?.name ?? '—'}</b>
              </div>
              <div className="meta-item">
                <span>Price</span>
                <b>{form.price ? `₹${Number(form.price).toLocaleString('en-IN')}` : 'Ask price'}</b>
              </div>
              <div className="meta-item">
                <span>Video</span>
                <b>{video && limits.videos > 0 ? providerLabel(video.provider) : 'None'}</b>
              </div>
              <div className="meta-item">
                <span>Photos</span>
                <b>{form.photos.length}</b>
              </div>
              <div className="meta-item">
                <span>Phone</span>
                <b>{form.hidePhone ? 'Masked' : form.phone || '—'}</b>
              </div>
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="field__error" style={{ marginTop: 14 }}>
          {error}
        </div>
      )}
    </Modal>
  );
}
