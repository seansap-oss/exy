import { useEffect, type ReactNode } from 'react';
import type { Category, Listing, Seller } from '../types';
import { compact, inr, timeAgo } from '../lib/format';
import { fallbackGradient, listingCandidates } from '../lib/thumbnails';
import { MediaPreview } from './MediaPreview';
import { IconCheck, IconClose, IconEye, IconHeart, IconPin, IconShield, IconVideo } from './Icons';

/* -------------------------------------------------------------------------- */
/* Modal                                                                       */
/* -------------------------------------------------------------------------- */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: 'slim' | 'default' | 'wide';
  children: ReactNode;
  footer?: ReactNode;
  bare?: boolean;
}

export function Modal({ open, onClose, title, subtitle, size = 'default', children, footer, bare }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const cls = `modal${size === 'wide' ? ' modal--wide' : ''}${size === 'slim' ? ' modal--slim' : ''}`;

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-scrim" onClick={onClose} />
      <div className={cls}>
        {title && (
          <div className="modal__head">
            <div className="modal__title">
              {title}
              {subtitle && <small>{subtitle}</small>}
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <IconClose />
            </button>
          </div>
        )}
        <div className={bare ? '' : 'modal__body'}>{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Category icon (renders raw SVG markup, scaled 200% by .cat-orb__glyph)      */
/* -------------------------------------------------------------------------- */
export function CategoryIcon({ category, size = 22 }: { category: Category; size?: number }) {
  return (
    <span className="cat-orb__glyph" style={{ color: category.accent }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: category.icon }}
      />
    </span>
  );
}

export function CategoryOrb({ category, size = 22 }: { category: Category; size?: number }) {
  return (
    <span
      className="cat-orb"
      style={{
        background: `color-mix(in srgb, ${category.accent} 12%, transparent)`,
        borderColor: `color-mix(in srgb, ${category.accent} 26%, transparent)`,
      }}
    >
      <CategoryIcon category={category} size={size} />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Verification badge                                                          */
/* -------------------------------------------------------------------------- */
export function VerifyBadge({ level }: { level: Seller['verification'] }) {
  if (level === 'none') return null;
  const isInspector = level === 'verified-inspector';
  return (
    <span className={`badge ${isInspector ? 'badge--gold' : 'badge--verified'}`}>
      <IconShield size={11} />
      {isInspector ? 'Verified Inspector' : 'Verified Business'}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Listing card                                                                */
/* -------------------------------------------------------------------------- */
interface CardProps {
  listing: Listing;
  seller?: Seller;
  saved: boolean;
  onOpen: (id: string) => void;
  onToggleSave: (id: string) => void;
}

export function ListingCard({ listing, seller, saved, onOpen, onToggleSave }: CardProps) {
  const hot = listing.todayViews >= 25;
  return (
    <div className="card">
      <button
        className="card__media"
        onClick={() => onOpen(listing.id)}
        aria-label={listing.title}
        style={{ display: 'block', width: '100%', padding: 0 }}
      >
        <MediaPreview
          candidates={listingCandidates(listing)}
          fallback={fallbackGradient(listing)}
          provider={listing.video?.provider}
          oembedUrl={listing.video?.url ?? null}
          alt={listing.title}
          className="card__media-fill"
        />
        <span className="card__badges">
          {listing.featured && <span className="badge badge--featured">Featured</span>}
          {listing.video && (
            <span className="badge badge--video">
              <IconVideo size={11} />
              Reel
            </span>
          )}
          {seller && seller.verification !== 'none' && (
            <span className={`badge ${seller.verification === 'verified-inspector' ? 'badge--gold' : 'badge--verified'}`}>
              <IconShield size={10} />
              Verified
            </span>
          )}
        </span>
        {hot && (
          <span className="urgency urgency--float">
            <span className="urgency__flame">🔥</span>
            <span>
              Popular Ad! {listing.todayViews} buyers viewed this today — contact seller before it's gone.
            </span>
          </span>
        )}
      </button>
      <button
        className={`card__save${saved ? ' is-saved' : ''}`}
        onClick={() => onToggleSave(listing.id)}
        aria-label={saved ? 'Remove from saved' : 'Save listing'}
      >
        <IconHeart size={17} filled={saved} />
      </button>
      <button className="card__body" onClick={() => onOpen(listing.id)}>
        <div className="card__price">
          {inr(listing.price)}
          {listing.priceUnit && <small>{listing.priceUnit}</small>}
        </div>
        <div className="card__title">{listing.title}</div>
        <div className="card__meta">
          <IconPin size={13} />
          <span>{listing.location}</span>
        </div>
        <div className="card__foot">
          <span className="card__stats">
            <span className="card__stat">
              <IconEye size={13} /> {compact(listing.viewCount)}
            </span>
            <span className="card__stat">
              <IconHeart size={13} /> {compact(listing.saveCount)}
            </span>
          </span>
          <span>{timeAgo(listing.createdAt)}</span>
        </div>
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Switch + toast                                                              */
/* -------------------------------------------------------------------------- */
export function Switch({
  on,
  onChange,
  label,
  hint,
}: {
  on: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button type="button" className={`switch${on ? ' is-on' : ''}`} onClick={() => onChange(!on)}>
      <span className="switch__track" />
      <span className="switch__label">
        <b>{label}</b>
        {hint && <span>{hint}</span>}
      </span>
    </button>
  );
}

export interface ToastMsg {
  id: string;
  text: string;
  kind: 'ok' | 'err' | 'info';
}

export function ToastStack({ toasts }: { toasts: ToastMsg[] }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.kind}`}>
          {toast.kind === 'ok' && <IconCheck size={16} />}
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );
}

export function Empty({
  title,
  message,
  action,
  icon,
}: {
  title: string;
  message: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty__orb">{icon ?? <IconVideo size={30} />}</div>
      <b>{title}</b>
      <p>{message}</p>
      {action}
    </div>
  );
}
