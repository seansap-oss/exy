export type ThemeMode = 'airy' | 'gold';

/* ========================================================================== */
/* Module 2 — media                                                            */
/* ========================================================================== */
export type VideoProvider = 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'native' | 'none';

export interface VideoEmbed {
  provider: VideoProvider;
  /** Raw URL pasted by staff/seller, or object URL for native uploads */
  url: string;
  /** Parsed platform id (video id / post shortcode) */
  externalId: string;
  /** Fully-resolved iframe src (or blob src for native) */
  embedSrc: string;
  poster?: string;
}

export type NativeMediaKind = 'video' | 'image' | 'audio';

export interface NativeMedia {
  id: string;
  kind: NativeMediaKind;
  name: string;
  /** object URL in demo mode, Supabase Storage public URL in production */
  src: string;
  poster?: string;
  sizeBytes: number;
  originalBytes?: number;
  durationSec?: number;
  /** 480 for compressed video */
  height?: number;
  mime: string;
  bucket: string;
  path: string;
  createdAt: string;
}

/* ========================================================================== */
/* Module 3 — taxonomy                                                         */
/* ========================================================================== */
export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  blurb: string;
  accent: string;
  children: SubCategory[];
}

/* ========================================================================== */
/* Module 1 — identity                                                         */
/* ========================================================================== */
export type UserRole = 'user' | 'admin';

export type VerificationLevel = 'none' | 'verified-business' | 'verified-inspector';

export type Tier = 'free' | 'standard' | 'comprehensive' | 'dealer';

/** Supabase `profiles` row — 1:1 with auth.users */
export interface Profile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  role: UserRole;
  tier: Tier;
  tierExpiry: string | null;
  /** Seller upgrade fields, populated by admin (Module 1.4) */
  isSeller: boolean;
  businessName: string | null;
  bio: string | null;
  verification: VerificationLevel;
  storefrontUrl: string | null;
  storefrontHandle: string | null;
  avatarColor: string;
  location: string;
  hidePhone: boolean;
  rating: number;
  responseTime: string;
  createdAt: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

export interface SignUpInput {
  fullName: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
}

/* Public-facing seller view derived from a Profile */
export interface Seller {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatarColor: string;
  location: string;
  phone: string;
  hidePhone: boolean;
  verification: VerificationLevel;
  storefrontUrl: string;
  memberSince: string;
  rating: number;
  responseTime: string;
}

/* ========================================================================== */
/* Listings                                                                    */
/* ========================================================================== */
export type ListingCondition = 'new' | 'like-new' | 'good' | 'used' | 'service';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit?: string;
  negotiable: boolean;
  categoryId: string;
  subCategoryId: string;
  tags: string[];
  features: string[];
  location: string;
  region: 'india' | 'global';
  city: string;
  sellerId: string;
  video?: VideoEmbed;
  /** Directly-hosted media uploaded through the admin/native uploader */
  media?: NativeMedia[];
  photos: string[];
  tier: Tier;
  featured: boolean;
  condition: ListingCondition;
  createdAt: string;
  viewCount: number;
  saveCount: number;
  clickCount: number;
  leadCount: number;
  todayViews: number;
  hidePhone: boolean;
  status: 'active' | 'paused' | 'sold';
}

/* ========================================================================== */
/* Module 4 — ticker tape                                                      */
/* ========================================================================== */
export type TickerFont = 'inter' | 'mono' | 'serif' | 'condensed';

/** Vertical padding + font scale of the bar. */
export type TickerHeight = 'compact' | 'standard' | 'large';

/** Marquee flow. `left` scrolls right-to-left (default marquee). */
export type TickerDirection = 'left' | 'right';

export interface TickerSegment {
  id: string;
  /** Icon/emoji rendered before the text */
  leadIcon: string;
  text: string;
  /** Icon/emoji rendered after the text */
  trailIcon: string;
  color: string;
  /** "Colour head" — first word rendered in an accent colour */
  headColor: string;
  bold: boolean;
  italic: boolean;
  /** Forces a line break before this segment when rendered in multi-line mode */
  newLine: boolean;
}

export interface TickerConfig {
  /** Master visibility. Defaults to true so the bar renders on a fresh install. */
  enabled: boolean;
  playing: boolean;
  loop: boolean;
  /** 1–100; higher is faster */
  speed: number;
  /** Marquee flow direction. */
  direction: TickerDirection;
  /** Bar height / padding preset. */
  height: TickerHeight;
  fontSize: number;
  font: TickerFont;
  background: string;
  defaultColor: string;
  segments: TickerSegment[];
  showFeaturedListings: boolean;
  /** Minimum tier eligible for the global ticker */
  minTier: Exclude<Tier, 'free'>;
}

/* ========================================================================== */
/* Module 5 — monetisation                                                     */
/* ========================================================================== */
export interface Package {
  id: Tier;
  name: string;
  price: number;
  cadence: string;
  ads: string;
  photos: string;
  video: string;
  perks: string[];
  cta: string;
  highlight?: boolean;
  /** Tier 4 price is set by an admin per-dealer */
  adminPriced?: boolean;
}

export interface DealerQuote {
  id: string;
  profileId: string;
  businessName: string;
  price: number;
  cadence: string;
  notes: string;
  status: 'draft' | 'sent' | 'accepted';
  createdAt: string;
}

/* ========================================================================== */
/* Module 6 — messaging & leads                                                */
/* ========================================================================== */
export type MessageKind = 'text' | 'image' | 'callback' | 'system';

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  kind: MessageKind;
  body: string;
  /** data/object URL for shared images */
  imageSrc?: string;
  /** masked callback number payload */
  callbackNumber?: string;
  callbackApproved?: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface Thread {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  lastMessageAt: string;
  unreadForBuyer: number;
  unreadForSeller: number;
}

/* ========================================================================== */
/* Module 6.6 — analytics                                                      */
/* ========================================================================== */
export type AdEventKind = 'impression' | 'view' | 'click' | 'save' | 'unsave' | 'lead';

export interface AdEvent {
  id: string;
  listingId: string;
  userId: string | null;
  kind: AdEventKind;
  /** dwell seconds for `view` events */
  dwellSec?: number;
  createdAt: string;
}

/* ========================================================================== */
/* Search & routing                                                            */
/* ========================================================================== */
export interface SearchFilters {
  keyword: string;
  categoryId: string;
  subCategoryId: string;
  location: 'global' | 'india' | 'regional';
  city: string;
  mustHaveVideo: boolean;
  verifiedOnly: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  condition: ListingCondition | '';
  sort: 'recent' | 'price-asc' | 'price-desc' | 'popular';
}

export type Route =
  | { name: 'home' }
  | { name: 'feed'; startId?: string }
  | { name: 'browse'; categoryId?: string; subCategoryId?: string }
  | { name: 'listing'; id: string }
  | { name: 'store'; handle: string }
  | { name: 'messages'; threadId?: string }
  | { name: 'packages' }
  | { name: 'profile'; tab?: 'saved' | 'ads' | 'analytics' | 'settings' }
  | { name: 'admin' };
