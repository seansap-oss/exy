import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdEvent,
  Category,
  DealerQuote,
  Listing,
  Message,
  Package,
  Profile,
  Route,
  SearchFilters,
  Seller,
  Session,
  ThemeMode,
  Thread,
  ThemeMode as Theme,
  TickerConfig,
  Tier,
} from './types';
import { CATEGORIES } from './data/categories';
import { SELLERS } from './data/sellers';
import { LISTINGS } from './data/listings';
import { PACKAGES, TIER_LIMITS, tierExpiry, type PaymentResult } from './lib/payments';
import { compact, inr, maskPhone, timeAgo } from './lib/format';
import { load, save, uid } from './lib/storage';
import { applyFilters, EMPTY_FILTERS } from './lib/search';
import { fetchTicker, persistTicker, readTickerLocal, subscribeTicker } from './lib/tickerStore';
import { allLocalProfiles, persistProfile, profileToSeller, signOut as authSignOut } from './lib/auth';
import { isUrgent, track, urgencyText, VIEW_DWELL_SECONDS } from './lib/analytics';
import {
  autoReply,
  bumpThread,
  composeMessage,
  findOrCreateThread,
  markRead,
  readMessages,
  readThreads,
  unreadCount,
  writeMessages,
  writeThreads,
} from './lib/messaging';
import { isSupabaseLive } from './lib/supabase';
import { useAndroidBack } from './hooks/useAndroidBack';
import { TickerTape } from './components/TickerTape';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { CheckoutModal } from './components/CheckoutModal';
import { SellFlow } from './components/SellFlow';
import { AdminPanel } from './components/AdminPanel';
import { VideoEmbed } from './components/VideoEmbed';
import { VisualFeed } from './components/VisualFeed';
import { LiveClassifiedsOverlay } from './components/LiveClassifiedsOverlay';
import { ExpressPostDrawer } from './components/ExpressPostDrawer';
import { clearShareParams, isShareLaunch, readSharePayload, type SharePayload } from './lib/shareTarget';
import { Messenger } from './components/Messenger';
import {
  CategoryOrb,
  Empty,
  ListingCard,
  Switch,
  ToastStack,
  VerifyBadge,
  type ToastMsg,
} from './components/Ui';
import {
  IconArrow,
  IconBookmark,
  IconChart,
  IconChat,
  IconCheck,
  IconChevron,
  IconClock,
  IconCopy,
  IconEye,
  IconFilm,
  IconFilter,
  IconGrid,
  IconHeart,
  IconHome,
  IconLink,
  IconList,
  IconLock,
  IconMoon,
  IconPhone,
  IconPin,
  IconPlay,
  IconPlus,
  IconSearch,
  IconSettings,
  IconShare,
  IconShield,
  IconSpark,
  IconStore,
  IconSun,
  IconTag,
  IconUser,
  IconVideo,
  IconWallet,
} from './components/Icons';

export default function Prototype() {
  /* ------------------------------ persisted state ------------------------------ */
  const [theme, setTheme] = useState<ThemeMode>(() => load<ThemeMode>('theme', 'gold'));
  const [profile, setProfile] = useState<Profile | null>(() => load<Profile | null>('profile', null));
  const [, setSession] = useState<Session | null>(() => load<Session | null>('session', null));
  const [profiles, setProfiles] = useState<Profile[]>(() => load<Profile[]>('profiles', []));
  const [saved, setSaved] = useState<string[]>(() => load<string[]>('saved', []));
  const [categories, setCategories] = useState<Category[]>(() => load<Category[]>('categories', CATEGORIES));
  const [sellers, setSellers] = useState<Seller[]>(() => load<Seller[]>('sellers', SELLERS));
  const [listings, setListings] = useState<Listing[]>(() => load<Listing[]>('listings', LISTINGS));
  const [ticker, setTicker] = useState<TickerConfig>(readTickerLocal);
  const [threads, setThreads] = useState<Thread[]>(() => readThreads());
  const [messages, setMessages] = useState<Message[]>(() => readMessages());
  const [quotes, setQuotes] = useState<DealerQuote[]>(() => load<DealerQuote[]>('quotes', []));
  const [events, setEvents] = useState<AdEvent[]>(() => load<AdEvent[]>('events', []));

  /* ------------------------------ ephemeral state ------------------------------ */
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string>();
  const [sellOpen, setSellOpen] = useState(false);
  const [checkoutPkg, setCheckoutPkg] = useState<Package | null>(null);
  const [fullscreen, setFullscreen] = useState<Listing | null>(null);
  const [share, setShare] = useState<SharePayload | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [pendingAction, setPendingAction] = useState<'sell' | 'save' | 'message' | null>(null);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);

  /* --------------------------------- effects --------------------------------- */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    save('theme', theme);
  }, [theme]);
  useEffect(() => save('profile', profile), [profile]);
  useEffect(() => save('profiles', profiles), [profiles]);
  useEffect(() => save('saved', saved), [saved]);
  useEffect(() => save('categories', categories), [categories]);
  useEffect(() => save('sellers', sellers), [sellers]);
  useEffect(() => save('listings', listings), [listings]);
  useEffect(() => save('quotes', quotes), [quotes]);
  useEffect(() => writeThreads(threads), [threads]);
  useEffect(() => writeMessages(messages), [messages]);
  useEffect(() => save('events', events), [events]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /**
   * Ticker live sync — hydrate from Supabase on mount, then listen for admin
   * edits (same tab), other tabs, and Realtime row changes so the live bar
   * updates instantly without a refresh.
   */
  useEffect(() => {
    let cancelled = false;
    void fetchTicker().then((remote) => {
      if (!cancelled && remote) setTicker(remote);
    });
    const unsubscribe = subscribeTicker((next) => setTicker(next));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  /** Single write path: local cache + broadcast + Supabase upsert. */
  const updateTicker = useCallback((next: TickerConfig) => {
    setTicker(next);
    void persistTicker(next);
  }, []);
  /* Module 2.1 — a Reel shared into EXY opens the Express Post Drawer. */
  useEffect(() => {
    if (!isShareLaunch()) return;
    const payload = readSharePayload();
    if (payload) setShare(payload);
  }, []);

  const toast = useCallback((text: string, kind: ToastMsg['kind'] = 'ok') => {
    const id = uid('t');
    setToasts((prev) => [...prev, { id, text, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 3400);
  }, []);

  /* --------------------------------- derived --------------------------------- */
  const sellerMap = useMemo(
    () => Object.fromEntries(sellers.map((seller) => [seller.id, seller])) as Record<string, Seller>,
    [sellers],
  );
  const listingMap = useMemo(
    () => Object.fromEntries(listings.map((listing) => [listing.id, listing])) as Record<string, Listing>,
    [listings],
  );
  const cities = useMemo(() => Array.from(new Set(listings.map((listing) => listing.city))).sort(), [listings]);
  const myListings = useMemo(
    () => (profile ? listings.filter((listing) => listing.sellerId === profile.id) : []),
    [listings, profile],
  );
  const savedListings = useMemo(() => saved.map((id) => listingMap[id]).filter(Boolean), [saved, listingMap]);
  const unread = profile ? unreadCount(threads, profile.id) : 0;
  const isAdmin = profile?.role === 'admin';

  const countFor = useCallback(
    (categoryId: string) => listings.filter((l) => l.categoryId === categoryId && l.status === 'active').length,
    [listings],
  );

  /* --------------------------------- actions --------------------------------- */
  /** In-app route history so the hardware back button can pop one step. */
  const historyRef = useRef<Route[]>([]);

  const go = useCallback((next: Route) => {
    setRoute((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        historyRef.current = [...historyRef.current, prev].slice(-30);
      }
      return next;
    });
  }, []);

  /** Pops one step. Returns false when already at the root home view. */
  const popRoute = useCallback(() => {
    const stack = historyRef.current;
    if (stack.length) {
      historyRef.current = stack.slice(0, -1);
      setRoute(stack[stack.length - 1]);
      return true;
    }
    if (route.name !== 'home') {
      setRoute({ name: 'home' });
      return true;
    }
    return false;
  }, [route.name]);

  /**
   * Android hardware back button — closes overlays first, then walks the route
   * stack, then asks for a confirming second press before exiting.
   */
  const backLayers = useMemo(
    () => [
      () => (fullscreen ? (setFullscreen(null), true) : false),
      () => (share ? (setShare(null), clearShareParams(), true) : false),
      () => (checkoutPkg ? (setCheckoutPkg(null), true) : false),
      () => (sellOpen ? (setSellOpen(false), true) : false),
      () => (authOpen ? (setAuthOpen(false), true) : false),
      () => (searchOpen ? (setSearchOpen(false), true) : false),
    ],
    [fullscreen, share, checkoutPkg, sellOpen, authOpen, searchOpen],
  );

  useAndroidBack({
    layers: backLayers,
    goBack: popRoute,
    onConfirmExit: (message) => toast(message, 'info'),
  });

  const requireAuth = useCallback(
    (reason: string, action: 'sell' | 'save' | 'message', target?: string) => {
      if (profile) return true;
      setAuthReason(reason);
      setPendingAction(action);
      setPendingTarget(target ?? null);
      setAuthOpen(true);
      return false;
    },
    [profile],
  );

  /** Module 6.6 — a click always counts; a view requires >10s dwell. */
  const recordEvent = useCallback(
    (listingId: string, kind: AdEvent['kind'], dwellSec?: number) => {
      const event = track(listingId, kind, profile?.id ?? null, dwellSec);
      setEvents((prev) => [...prev, event]);
    },
    [profile],
  );

  const openListing = useCallback(
    (id: string) => {
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, clickCount: l.clickCount + 1 } : l)));
      recordEvent(id, 'click');
      go({ name: 'listing', id });
    },
    [go, recordEvent],
  );

  const qualifiedView = useCallback(
    (id: string, dwellSec: number) => {
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, viewCount: l.viewCount + 1, todayViews: l.todayViews + 1 } : l)),
      );
      recordEvent(id, 'view', dwellSec);
    },
    [recordEvent],
  );

  const toggleSave = useCallback(
    (id: string) => {
      if (!requireAuth('Sign in to save ads to your profile.', 'save', id)) return;
      const isSaved = saved.includes(id);
      setSaved((prev) => (isSaved ? prev.filter((item) => item !== id) : [...prev, id]));
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, saveCount: Math.max(0, l.saveCount + (isSaved ? -1 : 1)) } : l)),
      );
      recordEvent(id, isSaved ? 'unsave' : 'save');
      toast(isSaved ? 'Removed from Saved Ads' : 'Saved to your profile', isSaved ? 'info' : 'ok');
    },
    [saved, requireAuth, recordEvent, toast],
  );

  /* ------------------------------- messaging -------------------------------- */
  const startThread = useCallback(
    (listingId: string) => {
      if (!requireAuth('Sign in to message the seller.', 'message', listingId)) return;
      const listing = listingMap[listingId];
      if (!listing || !profile) return;
      if (listing.sellerId === profile.id) return toast('This is your own listing.', 'info');

      const { thread, threads: next, created } = findOrCreateThread(threads, listingId, profile.id, listing.sellerId);
      let nextMessages = messages;

      if (created) {
        const intro = composeMessage({
          threadId: thread.id,
          senderId: profile.id,
          kind: 'system',
          body: `Conversation started about "${listing.title}"`,
        });
        nextMessages = [...messages, intro];
        setListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, leadCount: l.leadCount + 1 } : l)));
        recordEvent(listingId, 'lead');
      }

      setThreads(next);
      setMessages(nextMessages);
      go({ name: 'messages', threadId: thread.id });
    },
    [requireAuth, listingMap, profile, threads, messages, go, recordEvent, toast],
  );

  const sendMessage = useCallback(
    (threadId: string, body: string, imageSrc?: string) => {
      if (!profile) return;
      const thread = threads.find((item) => item.id === threadId);
      if (!thread) return;

      const message = composeMessage({
        threadId,
        senderId: profile.id,
        kind: imageSrc ? 'image' : 'text',
        body,
        imageSrc,
      });
      setMessages((prev) => [...prev, message]);
      setThreads((prev) => markRead(bumpThread(prev, threadId, thread.buyerId === profile.id), threadId, thread.buyerId === profile.id));

      // Demo counterparty reply keeps the thread feeling live.
      if (thread.sellerId !== profile.id) {
        const listing = listingMap[thread.listingId];
        setTimeout(() => {
          const reply = composeMessage({
            threadId,
            senderId: thread.sellerId,
            kind: 'text',
            body: autoReply(listing?.title ?? 'this listing'),
          });
          setMessages((prev) => [...prev, reply]);
          setThreads((prev) => bumpThread(prev, threadId, false));
        }, 1500);
      }
    },
    [profile, threads, listingMap],
  );

  const requestCallback = useCallback(
    (threadId: string, phone: string) => {
      if (!profile) return;
      const thread = threads.find((item) => item.id === threadId);
      if (!thread) return;
      const message = composeMessage({
        threadId,
        senderId: profile.id,
        kind: 'callback',
        body: 'Private callback request',
        callbackNumber: phone,
      });
      setMessages((prev) => [...prev, message]);
      setThreads((prev) => bumpThread(prev, threadId, thread.buyerId === profile.id));
      setListings((prev) => prev.map((l) => (l.id === thread.listingId ? { ...l, leadCount: l.leadCount + 1 } : l)));
      recordEvent(thread.listingId, 'lead');
      toast('Callback request sent — your number stays masked until approved.', 'ok');
    },
    [profile, threads, recordEvent, toast],
  );

  const approveCallback = useCallback(
    (messageId: string) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, callbackApproved: true } : m)));
      toast('Number revealed to the buyer', 'ok');
    },
    [toast],
  );

  /* --------------------------------- auth ----------------------------------- */
  const onAuth = useCallback(
    (next: Profile, session: Session) => {
      setProfile(next);
      setSession(session);
      save('session', session);
      setProfiles((prev) => (prev.some((item) => item.id === next.id) ? prev.map((item) => (item.id === next.id ? next : item)) : [next, ...prev]));
      setSellers((prev) => (prev.some((seller) => seller.id === next.id) ? prev : [profileToSeller(next), ...prev]));
      toast(`Welcome, ${next.fullName.split(' ')[0]}`, 'ok');

      const action = pendingAction;
      const target = pendingTarget;
      setPendingAction(null);
      setPendingTarget(null);

      if (action === 'sell') setTimeout(() => setSellOpen(true), 320);
      if (action === 'save' && target) {
        setSaved((prev) => (prev.includes(target) ? prev : [...prev, target]));
        setListings((prev) => prev.map((l) => (l.id === target ? { ...l, saveCount: l.saveCount + 1 } : l)));
      }
      if (action === 'message' && target) setTimeout(() => startThread(target), 320);
    },
    [pendingAction, pendingTarget, toast, startThread],
  );

  const onPendingProfile = useCallback((next: Profile) => {
    setProfiles((prev) => (prev.some((item) => item.id === next.id) ? prev : [next, ...prev]));
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      persistProfile(next);
      return next;
    });
    setProfiles((prev) => prev.map((item) => (profile && item.id === profile.id ? { ...item, ...patch } : item)));
  }, [profile]);

  /* ------------------------------- monetisation ------------------------------ */
  const onPaid = useCallback(
    (tier: Tier, result: PaymentResult) => {
      updateProfile({ tier, tierExpiry: tierExpiry(tier) });
      toast(`${tier} plan activated · ${result.paymentId}`, 'ok');
    },
    [updateProfile, toast],
  );

  const onPublish = useCallback(
    (listing: Listing) => {
      setListings((prev) => [listing, ...prev]);
      toast('Listing published and live', 'ok');
      go({ name: 'profile', tab: 'ads' });
    },
    [go, toast],
  );

  function handleSellClick() {
    if (!requireAuth('Sign in to post a listing on EXY.', 'sell')) return;
    setSellOpen(true);
  }

  function pickPackage(pkg: Package) {
    if (pkg.adminPriced) {
      const quote = quotes.find((item) => item.profileId === profile?.id);
      toast(
        quote
          ? `Your dealer quote: ${inr(quote.price)} ${quote.cadence}. Contact admin to activate.`
          : 'Our team will contact you with custom storefront pricing.',
        'info',
      );
      return;
    }
    if (!profile) {
      setAuthReason('Sign in to choose a package.');
      setAuthOpen(true);
      return;
    }
    if (pkg.id === 'free') {
      updateProfile({ tier: 'free', tierExpiry: null });
      toast('Free plan active', 'ok');
      return;
    }
    setCheckoutPkg(pkg);
  }

  /* ---------------------------------- render --------------------------------- */
  return (
    <div className="app">
      <Header
        route={route}
        profile={profile}
        savedCount={saved.length}
        unread={unread}
        theme={theme}
        isAdmin={isAdmin}
        onTheme={() => setTheme(theme === 'airy' ? 'gold' : 'airy')}
        onSearch={() => setSearchOpen(true)}
        onGo={go}
        onSell={handleSellClick}
        onSignIn={() => {
          setAuthReason(undefined);
          setAuthOpen(true);
        }}
      />

      {/* Global Ticker Tape — mounted unconditionally between the header and
          the main hero wrapper. Visibility is owned solely by the admin
          `enabled` flag inside TickerTape; no storage/session state can gate
          the mount itself. */}
      <TickerTape config={ticker} listings={listings} onOpenListing={openListing} />

      <main className="main">
        {route.name === 'home' && (
          <HomeView
            categories={categories}
            listings={listings}
            sellerMap={sellerMap}
            saved={saved}
            countFor={countFor}
            onOpenListing={openListing}
            onToggleSave={toggleSave}
            onGo={go}
            onSearch={() => setSearchOpen(true)}
            onSell={handleSellClick}
          />
        )}

        {route.name === 'feed' && (
          <div className="shell">
            <div className="feed-bar">
              <h2 className="feed-bar__title">Visual Feed</h2>
              <button className="btn btn--ghost btn--sm" onClick={() => go({ name: 'browse' })}>
                <IconGrid size={15} /> Grid view
              </button>
            </div>
            <VisualFeed
              listings={listings}
              sellerMap={sellerMap}
              saved={saved}
              startId={route.startId}
              onToggleSave={toggleSave}
              onOpenListing={openListing}
              onContact={startThread}
              onQualifiedView={qualifiedView}
              onImpression={(id) => recordEvent(id, 'impression')}
              onExpand={setFullscreen}
            />
          </div>
        )}

        {route.name === 'browse' && (
          <BrowseView
            categories={categories}
            listings={listings}
            sellerMap={sellerMap}
            saved={saved}
            filters={filters}
            onFilters={setFilters}
            route={route}
            onGo={go}
            onOpenListing={openListing}
            onToggleSave={toggleSave}
            onOpenSearch={() => setSearchOpen(true)}
          />
        )}

        {route.name === 'listing' && (
          <ListingView
            listing={listingMap[route.id]}
            seller={listingMap[route.id] ? sellerMap[listingMap[route.id].sellerId] : undefined}
            categories={categories}
            listings={listings}
            sellerMap={sellerMap}
            saved={saved}
            onToggleSave={toggleSave}
            onOpenListing={openListing}
            onGo={go}
            onMessage={startThread}
            onQualifiedView={qualifiedView}
            onFullscreen={setFullscreen}
            onToast={toast}
          />
        )}

        {route.name === 'store' && (
          <StoreView
            seller={sellers.find((item) => item.handle === route.handle)}
            listings={listings}
            saved={saved}
            sellerMap={sellerMap}
            onOpenListing={openListing}
            onToggleSave={toggleSave}
            onGo={go}
            onToast={toast}
          />
        )}

        {route.name === 'messages' && (
          <div className="shell">
            <div className="section__head" style={{ paddingTop: 22 }}>
              <div>
                <h2 className="section__title">Messages</h2>
                <p className="section__sub">
                  Buyer and seller leads. Callback requests keep both numbers masked until the seller approves.
                </p>
              </div>
            </div>
            {profile ? (
              <Messenger
                me={profile}
                threads={threads}
                messages={messages}
                listingMap={listingMap}
                sellerMap={sellerMap}
                activeThreadId={route.threadId}
                onSelectThread={(id) => {
                  const thread = threads.find((item) => item.id === id);
                  if (thread) setThreads((prev) => markRead(prev, id, thread.buyerId === profile.id));
                  go({ name: 'messages', threadId: id });
                }}
                onSend={sendMessage}
                onRequestCallback={requestCallback}
                onApproveCallback={approveCallback}
                onOpenListing={openListing}
              />
            ) : (
              <Empty
                icon={<IconChat size={28} />}
                title="Sign in to view messages"
                message="Your buyer and seller conversations live here."
                action={
                  <button
                    className="btn btn--primary"
                    onClick={() => {
                      setAuthReason('Sign in to open your inbox.');
                      setAuthOpen(true);
                    }}
                  >
                    Sign in
                  </button>
                }
              />
            )}
          </div>
        )}

        {route.name === 'packages' && (
          <PackagesView profile={profile} quotes={quotes} onPick={pickPackage} />
        )}

        {route.name === 'profile' && (
          <ProfileView
            profile={profile}
            tab={route.tab ?? 'saved'}
            savedListings={savedListings}
            myListings={myListings}
            sellerMap={sellerMap}
            sellers={sellers}
            threads={threads}
            saved={saved}
            theme={theme}
            onTheme={setTheme}
            onGo={go}
            onOpenListing={openListing}
            onToggleSave={toggleSave}
            onSignIn={() => {
              setAuthReason(undefined);
              setAuthOpen(true);
            }}
            onSignOut={() => {
              void authSignOut();
              setProfile(null);
              setSession(null);
              save('session', null);
              toast('Signed out', 'info');
              go({ name: 'home' });
            }}
            onSell={handleSellClick}
            onUpdateListings={setListings}
            onUpdateSellers={setSellers}
            onUpdateProfile={updateProfile}
            onToast={toast}
          />
        )}

        {route.name === 'admin' &&
          (isAdmin ? (
            <AdminPanel
              ticker={ticker}
              onTicker={updateTicker}
              categories={categories}
              onCategories={setCategories}
              sellers={sellers}
              onSellers={setSellers}
              profiles={profiles.length ? profiles : allLocalProfiles()}
              onProfiles={setProfiles}
              listings={listings}
              onListings={setListings}
              quotes={quotes}
              onQuotes={setQuotes}
              onToast={toast}
              onOpenListing={openListing}
            />
          ) : (
            <div className="shell">
              <Empty
                icon={<IconLock size={28} />}
                title="Super-Admin access required"
                message="Sign in with an admin@ email address to open the EXY operations portal."
                action={
                  <button
                    className="btn btn--primary"
                    onClick={() => {
                      setAuthReason('Admin portal requires an admin@ account.');
                      setAuthOpen(true);
                    }}
                  >
                    Sign in as admin
                  </button>
                }
              />
            </div>
          ))}
      </main>

      <Footer onGo={go} isAdmin={isAdmin} categories={categories} />

      <BottomNav route={route} savedCount={saved.length} unread={unread} onGo={go} onSell={handleSellClick} />

      {/* ------------------------------- overlays ------------------------------- */}
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        listings={listings}
        sellerMap={sellerMap}
        cities={cities}
        filters={filters}
        onFilters={setFilters}
        onOpenListing={openListing}
        onSeeAll={() => go({ name: 'browse' })}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuth={onAuth}
        onPendingProfile={onPendingProfile}
        reason={authReason}
      />

      {profile && (
        <SellFlow
          open={sellOpen}
          onClose={() => setSellOpen(false)}
          profile={profile}
          activeAdCount={myListings.filter((l) => l.status === 'active').length}
          onPublish={onPublish}
          onUpgrade={() => {
            setSellOpen(false);
            go({ name: 'packages' });
          }}
          onToast={toast}
        />
      )}

      <CheckoutModal open={!!checkoutPkg} onClose={() => setCheckoutPkg(null)} pkg={checkoutPkg} onPaid={onPaid} />

      {fullscreen && (
        <LiveClassifiedsOverlay
          listing={fullscreen}
          seller={sellerMap[fullscreen.sellerId]}
          saved={saved.includes(fullscreen.id)}
          onClose={() => setFullscreen(null)}
          onMessage={(id) => {
            setFullscreen(null);
            startThread(id);
          }}
          onCallback={(id) => {
            setFullscreen(null);
            startThread(id);
            toast('Opening chat - send a private callback request from here.', 'info');
          }}
          onToggleSave={toggleSave}
          onQualifiedView={qualifiedView}
        />
      )}

      <ExpressPostDrawer
        payload={share}
        profile={profile}
        onClose={() => {
          setShare(null);
          clearShareParams();
        }}
        onPublish={(listing) => {
          onPublish(listing);
          clearShareParams();
          toast('Published from shared reel', 'ok');
        }}
        onNeedAuth={() => {
          setAuthReason('Sign in to publish the reel you shared.');
          setAuthOpen(true);
        }}
      />

      <ToastStack toasts={toasts} />
    </div>
  );
}

/* ========================================================================== */
/* Header                                                                      */
/* ========================================================================== */
function Header({
  route,
  profile,
  savedCount,
  unread,
  theme,
  isAdmin,
  onTheme,
  onSearch,
  onGo,
  onSell,
  onSignIn,
}: {
  route: Route;
  profile: Profile | null;
  savedCount: number;
  unread: number;
  theme: Theme;
  isAdmin: boolean;
  onTheme: () => void;
  onSearch: () => void;
  onGo: (route: Route) => void;
  onSell: () => void;
  onSignIn: () => void;
}) {
  return (
    <header className="header">
      <div className="shell header__row">
        <button className="brand" onClick={() => onGo({ name: 'home' })}>
          <span className="brand__mark">EX</span>
          <span style={{ textAlign: 'left' }}>
            <span className="brand__name">EXY</span>
            <span className="brand__tag">Visual Classifieds</span>
          </span>
        </button>

        <nav className="header__nav">
          {[
            { id: 'home', label: 'Home' },
            { id: 'feed', label: 'Feed' },
            { id: 'browse', label: 'Browse' },
            { id: 'packages', label: 'Packages' },
          ].map((item) => (
            <button
              key={item.id}
              className={`header__link${route.name === item.id ? ' is-active' : ''}`}
              onClick={() => onGo({ name: item.id } as Route)}
            >
              {item.label}
            </button>
          ))}
          {isAdmin && (
            <button
              className={`header__link${route.name === 'admin' ? ' is-active' : ''}`}
              onClick={() => onGo({ name: 'admin' })}
            >
              Admin
            </button>
          )}
        </nav>

        <span className="header__spacer" />

        <button className="header__search" onClick={onSearch} aria-label="Open search">
          <IconSearch size={17} />
          <span>Search everything on EXY…</span>
          <kbd>Ctrl K</kbd>
        </button>

        <div className="header__actions">
          <button className="icon-btn" onClick={onTheme} aria-label="Toggle theme">
            {theme === 'airy' ? <IconMoon /> : <IconSun />}
          </button>
          <button className="icon-btn" onClick={() => onGo({ name: 'messages' })} aria-label="Messages">
            <IconChat size={19} />
            {unread > 0 && <span className="icon-btn__badge">{unread}</span>}
          </button>
          <button className="icon-btn" onClick={() => onGo({ name: 'profile', tab: 'saved' })} aria-label="Saved ads">
            <IconHeart size={19} />
            {savedCount > 0 && <span className="icon-btn__badge">{savedCount}</span>}
          </button>
          {profile ? (
            <button className="icon-btn" onClick={() => onGo({ name: 'profile', tab: 'ads' })} aria-label="Profile">
              <IconUser size={19} />
            </button>
          ) : (
            <button className="btn btn--ghost btn--sm" onClick={onSignIn}>
              Sign in
            </button>
          )}
          <button className="btn btn--primary btn--sm" onClick={onSell}>
            <IconPlus size={16} /> Sell
          </button>
        </div>
      </div>
    </header>
  );
}

/* ========================================================================== */
/* Home                                                                        */
/* ========================================================================== */
function HomeView({
  categories,
  listings,
  sellerMap,
  saved,
  countFor,
  onOpenListing,
  onToggleSave,
  onGo,
  onSearch,
  onSell,
}: {
  categories: Category[];
  listings: Listing[];
  sellerMap: Record<string, Seller>;
  saved: string[];
  countFor: (id: string) => number;
  onOpenListing: (id: string) => void;
  onToggleSave: (id: string) => void;
  onGo: (route: Route) => void;
  onSearch: () => void;
  onSell: () => void;
}) {
  const active = listings.filter((l) => l.status === 'active');
  const featured = active.filter((l) => l.featured).slice(0, 8);
  const withVideo = active.filter((l) => l.video);
  const recent = [...active].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 8);
  const trending = [...active].sort((a, b) => b.todayViews - a.todayViews).slice(0, 8);
  const totalViews = active.reduce((sum, l) => sum + l.viewCount, 0);
  // 10 featured reels for the swipeable hero carousel.
  const reelRail = [...withVideo]
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.viewCount - a.viewCount)
    .slice(0, 10);

  return (
    <>
      <section className="hero">
        <div className="shell hero__grid">
          <div>
            <span className="hero__eyebrow">
              <b>New</b> Video-first classifieds for India
            </span>
            <h1 className="hero__title">
              Everything sold on <em>Reels</em>, indexed in one marketplace.
            </h1>
            <p className="hero__sub">
              EXY aggregates goods, services, materials and businesses advertised across Instagram Reels, YouTube
              Shorts and Facebook video — with real prices, verified sellers and in-app messaging.
            </p>
            {/* Inline action bar — all three fit one row on mobile. */}
            <div className="hero__cta">
              <button className="btn btn--primary btn--lg hero__act" onClick={() => onGo({ name: 'feed' })}>
                <IconFilm size={17} />
                <span className="hero__act-full">Open visual feed</span>
                <span className="hero__act-short">Feed</span>
              </button>
              <button className="btn btn--ghost btn--lg hero__act" onClick={onSearch}>
                <IconSearch size={17} />
                <span className="hero__act-full">Search marketplace</span>
                <span className="hero__act-short">Search</span>
              </button>
              <button className="btn btn--ghost btn--lg hero__act" onClick={onSell}>
                <IconPlus size={17} />
                <span className="hero__act-full">Post listing</span>
                <span className="hero__act-short">Sell</span>
              </button>
            </div>

            {/* Swipeable reel carousel */}
            {reelRail.length > 0 && (
              <div className="reel-rail swipe-x">
                {reelRail.map((listing) => (
                  <button
                    key={listing.id}
                    className="reel-card"
                    onClick={() => onGo({ name: 'feed', startId: listing.id })}
                  >
                    <span
                      className="reel-card__media"
                      style={
                        listing.video?.poster
                          ? { backgroundImage: `url(${listing.video.poster})` }
                          : { background: listing.photos[0] }
                      }
                    />
                    <span className="reel-card__plays">
                      <IconPlay size={9} /> {compact(listing.viewCount)}
                    </span>
                    <span className="reel-card__foot">
                      <b>{inr(listing.price)}</b>
                      <span>{listing.city}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="hero__stats">
              <div className="hero__stat">
                <b>{active.length}</b>
                <span>Live listings</span>
              </div>
              <div className="hero__stat">
                <b>{withVideo.length}</b>
                <span>With video</span>
              </div>
              <div className="hero__stat">
                <b>{categories.length}</b>
                <span>Categories</span>
              </div>
              <div className="hero__stat">
                <b>{compact(totalViews)}</b>
                <span>Buyer views</span>
              </div>
            </div>
          </div>

          <div className="hero__media">
            {withVideo.slice(0, 2).map((listing) => (
              <button key={listing.id} className="hero__card" onClick={() => onGo({ name: 'feed', startId: listing.id })}>
                <span
                  className="hero__card-media"
                  style={
                    listing.video?.poster
                      ? { backgroundImage: `url(${listing.video.poster})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: listing.photos[0] }
                  }
                />
                <span className="hero__play">
                  <IconVideo size={12} /> Reel
                </span>
                <span className="hero__card-body">
                  <b>{listing.title}</b>
                  <span>{inr(listing.price)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="shell">
        <section className="section">
          <div className="section__head">
            <div>
              <h2 className="section__title">Browse categories</h2>
              <p className="section__sub">
                Every category is video-indexed — tap through to see reels, prices and verified sellers.
              </p>
            </div>
            <button className="section__link" onClick={() => onGo({ name: 'browse' })}>
              View all <IconArrow size={15} />
            </button>
          </div>
          <div className="cat-grid">
            {categories.map((category) => (
              <button key={category.id} className="cat-card" onClick={() => onGo({ name: 'browse', categoryId: category.id })}>
                <CategoryOrb category={category} />
                <span className="cat-card__name">{category.name}</span>
                <span className="cat-card__count">{countFor(category.id)} live ads</span>
              </button>
            ))}
          </div>
        </section>

        {featured.length > 0 && (
          <section className="section">
            <div className="section__head">
              <div>
                <h2 className="section__title">Featured storefront picks</h2>
                <p className="section__sub">Paid placements from Comprehensive and Dealer tier sellers.</p>
              </div>
            </div>
            <div className="listing-grid">
              {featured.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  seller={sellerMap[listing.sellerId]}
                  saved={saved.includes(listing.id)}
                  onOpen={onOpenListing}
                  onToggleSave={onToggleSave}
                />
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <div className="section__head">
            <div>
              <h2 className="section__title">Trending today</h2>
              <p className="section__sub">Ranked by qualified buyer views in the last 24 hours.</p>
            </div>
          </div>
          <div className="listing-grid">
            {trending.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                seller={sellerMap[listing.sellerId]}
                saved={saved.includes(listing.id)}
                onOpen={onOpenListing}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section__head">
            <div>
              <h2 className="section__title">Fresh on EXY</h2>
              <p className="section__sub">The newest reels and photo listings across every category.</p>
            </div>
            <button className="section__link" onClick={() => onGo({ name: 'browse' })}>
              See everything <IconArrow size={15} />
            </button>
          </div>
          <div className="listing-grid">
            {recent.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                seller={sellerMap[listing.sellerId]}
                saved={saved.includes(listing.id)}
                onOpen={onOpenListing}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

/* ========================================================================== */
/* Browse                                                                      */
/* ========================================================================== */
function BrowseView({
  categories,
  listings,
  sellerMap,
  saved,
  filters,
  onFilters,
  route,
  onGo,
  onOpenListing,
  onToggleSave,
  onOpenSearch,
}: {
  categories: Category[];
  listings: Listing[];
  sellerMap: Record<string, Seller>;
  saved: string[];
  filters: SearchFilters;
  onFilters: (filters: SearchFilters) => void;
  route: Extract<Route, { name: 'browse' }>;
  onGo: (route: Route) => void;
  onOpenListing: (id: string) => void;
  onToggleSave: (id: string) => void;
  onOpenSearch: () => void;
}) {
  const categoryId = route.categoryId ?? filters.categoryId;
  const subCategoryId = route.subCategoryId ?? filters.subCategoryId;
  const category = categories.find((c) => c.id === categoryId);

  const results = useMemo(
    () =>
      applyFilters(listings, { ...filters, categoryId: categoryId ?? '', subCategoryId: subCategoryId ?? '' }, sellerMap),
    [listings, filters, categoryId, subCategoryId, sellerMap],
  );

  return (
    <div className="shell">
      <div className="breadcrumb">
        <button onClick={() => onGo({ name: 'home' })}>Home</button>
        <IconChevron size={12} />
        <button onClick={() => onGo({ name: 'browse' })}>Browse</button>
        {category && (
          <>
            <IconChevron size={12} />
            <span style={{ color: 'var(--ink)' }}>{category.name}</span>
          </>
        )}
      </div>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="section__head">
          <div>
            <h2 className="section__title">{category ? category.name : 'All listings'}</h2>
            <p className="section__sub">
              {category?.blurb ?? 'Everything indexed on EXY across goods, services, materials and businesses.'}
            </p>
          </div>
          <div className="pill-row">
            <button className="btn btn--ghost btn--sm" onClick={() => onGo({ name: 'feed' })}>
              <IconFilm size={15} /> Feed view
            </button>
            <button className="btn btn--ghost btn--sm" onClick={onOpenSearch}>
              <IconFilter size={15} /> Filters
            </button>
          </div>
        </div>

        <div className="cat-rail">
          <button
            className="cat-rail__item"
            onClick={() => {
              onFilters({ ...filters, categoryId: '', subCategoryId: '' });
              onGo({ name: 'browse' });
            }}
          >
            <span className="cat-orb" style={{ background: 'var(--surface-3)', borderColor: 'var(--line-2)' }}>
              <span className="cat-orb__glyph">
                <IconGrid size={22} />
              </span>
            </span>
            <span>All</span>
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              className="cat-rail__item"
              onClick={() => {
                onFilters({ ...filters, categoryId: item.id, subCategoryId: '' });
                onGo({ name: 'browse', categoryId: item.id });
              }}
            >
              <CategoryOrb category={item} size={20} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        {category && category.children.length > 0 && (
          <div className="chips" style={{ margin: '4px 0 22px' }}>
            <button
              className={`chip chip--sm${!subCategoryId ? ' is-on' : ''}`}
              onClick={() => onGo({ name: 'browse', categoryId: category.id })}
            >
              All {category.name}
            </button>
            {category.children.map((child) => (
              <button
                key={child.id}
                className={`chip chip--sm${subCategoryId === child.id ? ' is-on' : ''}`}
                onClick={() => onGo({ name: 'browse', categoryId: category.id, subCategoryId: child.id })}
              >
                {child.name}
              </button>
            ))}
          </div>
        )}

        <div className="toolbar">
          <b style={{ fontSize: 14 }}>{results.length} listings</b>
          <span className="toolbar__spacer" />
          <button
            className={`chip chip--sm${filters.mustHaveVideo ? ' is-on' : ''}`}
            onClick={() => onFilters({ ...filters, mustHaveVideo: !filters.mustHaveVideo })}
          >
            <IconVideo size={12} /> Has video
          </button>
          <button
            className={`chip chip--sm${filters.verifiedOnly ? ' is-on' : ''}`}
            onClick={() => onFilters({ ...filters, verifiedOnly: !filters.verifiedOnly })}
          >
            <IconShield size={12} /> Verified
          </button>
          <select
            className="select"
            style={{ width: 'auto', height: 36, fontSize: 13 }}
            value={filters.sort}
            onChange={(event) => onFilters({ ...filters, sort: event.target.value as SearchFilters['sort'] })}
          >
            <option value="recent">Most recent</option>
            <option value="popular">Most popular</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
          </select>
        </div>

        {results.length === 0 ? (
          <Empty
            title="No listings here yet"
            message="Try clearing filters or exploring a different category. New reels are indexed every hour."
            action={
              <button className="btn btn--primary" onClick={() => onFilters(EMPTY_FILTERS)}>
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="listing-grid">
            {results.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                seller={sellerMap[listing.sellerId]}
                saved={saved.includes(listing.id)}
                onOpen={onOpenListing}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ========================================================================== */
/* Listing detail                                                              */
/* ========================================================================== */
function ListingView({
  listing,
  seller,
  categories,
  listings,
  sellerMap,
  saved,
  onToggleSave,
  onOpenListing,
  onGo,
  onMessage,
  onQualifiedView,
  onFullscreen,
  onToast,
}: {
  listing?: Listing;
  seller?: Seller;
  categories: Category[];
  listings: Listing[];
  sellerMap: Record<string, Seller>;
  saved: string[];
  onToggleSave: (id: string) => void;
  onOpenListing: (id: string) => void;
  onGo: (route: Route) => void;
  onMessage: (id: string) => void;
  onQualifiedView: (id: string, dwellSec: number) => void;
  onFullscreen: (listing: Listing) => void;
  onToast: (text: string, kind?: ToastMsg['kind']) => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const dwellRef = useRef<number>(0);
  const countedRef = useRef(false);

  /* Module 6.6 — only count a view after 10 seconds on the page. */
  useEffect(() => {
    if (!listing) return;
    setPhotoIndex(0);
    setRevealed(false);
    countedRef.current = false;
    dwellRef.current = Date.now();

    const timer = window.setTimeout(() => {
      if (!countedRef.current) {
        countedRef.current = true;
        onQualifiedView(listing.id, VIEW_DWELL_SECONDS);
      }
    }, VIEW_DWELL_SECONDS * 1000);

    return () => window.clearTimeout(timer);
  }, [listing, onQualifiedView]);

  if (!listing) {
    return (
      <div className="shell">
        <Empty title="Listing not found" message="This ad may have been sold or removed by the seller." />
      </div>
    );
  }

  const category = categories.find((c) => c.id === listing.categoryId);
  const sub = category?.children.find((c) => c.id === listing.subCategoryId);
  const isSaved = saved.includes(listing.id);
  const hot = isUrgent(listing.todayViews);
  const similar = listings
    .filter((item) => item.id !== listing.id && item.categoryId === listing.categoryId && item.status === 'active')
    .slice(0, 4);
  const phoneHidden = listing.hidePhone || seller?.hidePhone;
  const nativeVideo = listing.media?.find((item) => item.kind === 'video');
  const nativeAudio = listing.media?.find((item) => item.kind === 'audio');

  return (
    <div className="shell">
      <div className="breadcrumb">
        <button onClick={() => onGo({ name: 'home' })}>Home</button>
        <IconChevron size={12} />
        <button onClick={() => onGo({ name: 'browse', categoryId: listing.categoryId })}>{category?.name}</button>
        {sub && (
          <>
            <IconChevron size={12} />
            <button onClick={() => onGo({ name: 'browse', categoryId: listing.categoryId, subCategoryId: sub.id })}>
              {sub.name}
            </button>
          </>
        )}
      </div>

      <div className="detail">
        <div>
          <div style={{ maxWidth: listing.video || nativeVideo ? 420 : '100%' }}>
            {nativeVideo ? (
              <div className="video video--vertical">
                <video
                  src={nativeVideo.src}
                  poster={nativeVideo.poster}
                  controls
                  playsInline
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : listing.video ? (
              <VideoEmbed video={listing.video} title={listing.title} fallback={listing.photos[0]} />
            ) : (
              <div className="video" style={{ aspectRatio: '4 / 3' }}>
                <div style={{ position: 'absolute', inset: 0, background: listing.photos[photoIndex] }} />
              </div>
            )}
            {(listing.video || nativeVideo) && (
              <button
                className="btn btn--ghost btn--sm btn--block"
                style={{ marginTop: 10 }}
                onClick={() => onFullscreen(listing)}
              >
                <IconFilm size={15} /> Open immersive 9:16 player
              </button>
            )}
          </div>

          {nativeAudio && (
            <div className="audio-banner" style={{ marginTop: 14, backgroundImage: undefined }}>
              <div className="audio-banner__body">
                <b>Audio banner</b>
                <audio src={nativeAudio.src} controls />
              </div>
            </div>
          )}

          {listing.photos.length > 1 && (
            <div className="detail__gallery">
              {listing.photos.map((photo, index) => (
                <button
                  key={index}
                  className={`detail__thumb${photoIndex === index ? ' is-on' : ''}`}
                  style={{ background: photo }}
                  onClick={() => setPhotoIndex(index)}
                  aria-label={`Photo ${index + 1}`}
                />
              ))}
            </div>
          )}

          {hot && (
            <div className="urgency" style={{ marginTop: 16 }}>
              <span className="urgency__flame">🔥</span>
              <span>{urgencyText(listing.todayViews)}</span>
            </div>
          )}

          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panel__title">Description</div>
            <p className="prose">{listing.description}</p>
          </div>

          {listing.features.length > 0 && (
            <div className="panel">
              <div className="panel__title">What's included</div>
              <ul className="feature-list">
                {listing.features.map((feature) => (
                  <li key={feature}>
                    <IconCheck size={15} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="panel">
            <div className="panel__title">Listing details</div>
            <div className="meta-list">
              <div className="meta-item">
                <span>Category</span>
                <b>{category?.name}</b>
              </div>
              <div className="meta-item">
                <span>Subcategory</span>
                <b>{sub?.name ?? '—'}</b>
              </div>
              <div className="meta-item">
                <span>Condition</span>
                <b style={{ textTransform: 'capitalize' }}>{listing.condition.replace('-', ' ')}</b>
              </div>
              <div className="meta-item">
                <span>Location</span>
                <b>{listing.location}</b>
              </div>
              <div className="meta-item">
                <span>Posted</span>
                <b>{timeAgo(listing.createdAt)}</b>
              </div>
              <div className="meta-item">
                <span>Ad ID</span>
                <b style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{listing.id}</b>
              </div>
            </div>
            {listing.tags.length > 0 && (
              <div className="pill-row" style={{ marginTop: 16 }}>
                {listing.tags.map((tag) => (
                  <span key={tag} className="badge badge--soft">
                    <IconTag size={11} /> {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside>
          <div className="panel">
            <div className="price-row">
              <b>{inr(listing.price)}</b>
              {listing.priceUnit && <span style={{ color: 'var(--ink-3)', fontSize: 14 }}>{listing.priceUnit}</span>}
              {listing.negotiable && <span className="badge badge--soft">Negotiable</span>}
            </div>
            <h1 className="detail__title">{listing.title}</h1>
            <div className="pill-row">
              <span className="badge badge--soft">
                <IconPin size={11} /> {listing.city}
              </span>
              <span className="badge badge--soft">
                <IconClock size={11} /> {timeAgo(listing.createdAt)}
              </span>
              {listing.video && (
                <span className="badge badge--soft">
                  <IconVideo size={11} /> Video listing
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
              <button className="btn btn--primary" style={{ flex: 1 }} onClick={() => onMessage(listing.id)}>
                <IconChat size={16} /> Message seller
              </button>
              <button
                className={`btn ${isSaved ? 'btn--soft' : 'btn--ghost'}`}
                onClick={() => onToggleSave(listing.id)}
                aria-label="Save"
              >
                <IconHeart size={17} filled={isSaved} />
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/listing/${listing.id}`);
                  onToast('Listing link copied', 'ok');
                }}
                aria-label="Share"
              >
                <IconShare size={17} />
              </button>
            </div>

            {/* Module 6.4 — phone privacy */}
            <div className="phone-box">
              <div>
                <div className="phone-box__num">
                  {phoneHidden ? '•••• ••••' : revealed ? (seller?.phone ?? '—') : maskPhone(seller?.phone ?? '')}
                </div>
                <div className="phone-box__note">
                  {phoneHidden
                    ? 'Seller enabled phone privacy — leads route through in-app messaging'
                    : revealed
                      ? 'Mention EXY when you call'
                      : 'Number partially hidden'}
                </div>
              </div>
              {phoneHidden ? (
                <button className="btn btn--soft btn--sm" onClick={() => onMessage(listing.id)}>
                  <IconLock size={14} /> Message to contact
                </button>
              ) : revealed ? (
                <a className="btn btn--soft btn--sm" href={`tel:${(seller?.phone ?? '').replace(/\s/g, '')}`}>
                  <IconPhone size={14} /> Call now
                </a>
              ) : (
                <button className="btn btn--soft btn--sm" onClick={() => setRevealed(true)}>
                  <IconPhone size={14} /> Show number
                </button>
              )}
            </div>
          </div>

          {seller && (
            <div className="panel">
              <div className="panel__title">Seller</div>
              <div className="seller">
                <div className="avatar" style={{ background: seller.avatarColor }}>
                  {seller.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="seller__main">
                  <b>
                    {seller.name}
                    {seller.verification !== 'none' && <IconShield size={14} />}
                  </b>
                  <span>
                    ★ {seller.rating.toFixed(1)} · {seller.responseTime}
                  </span>
                </div>
              </div>
              <div className="pill-row" style={{ marginTop: 12 }}>
                <VerifyBadge level={seller.verification} />
              </div>
              <p className="prose" style={{ fontSize: 13, marginTop: 12 }}>
                {seller.bio}
              </p>
              <button
                className="btn btn--ghost btn--sm btn--block"
                style={{ marginTop: 14 }}
                onClick={() => onGo({ name: 'store', handle: seller.handle })}
              >
                <IconStore size={15} /> Visit storefront
              </button>
            </div>
          )}

          <div className="panel">
            <div className="panel__title">
              <IconChart size={15} /> Ad performance
            </div>
            <div className="stat-grid">
              <div className="stat-tile">
                <span>
                  <IconEye size={12} /> Views
                </span>
                <b>{compact(listing.viewCount)}</b>
              </div>
              <div className="stat-tile">
                <span>
                  <IconHeart size={12} /> Saves
                </span>
                <b>{compact(listing.saveCount)}</b>
              </div>
              <div className="stat-tile">
                <span>
                  <IconChat size={12} /> Leads
                </span>
                <b>{compact(listing.leadCount)}</b>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel__title">
              <IconShield size={15} /> Safety on EXY
            </div>
            <ul className="feature-list">
              <li>
                <IconCheck size={14} /> Meet in a public place and inspect goods before paying.
              </li>
              <li>
                <IconCheck size={14} /> Never send advance payment to unverified sellers.
              </li>
              <li>
                <IconCheck size={14} /> Keep conversations in EXY messaging so we can help if something goes wrong.
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">Similar in {category?.name}</h2>
          </div>
          <div className="listing-grid">
            {similar.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                seller={sellerMap[item.sellerId]}
                saved={saved.includes(item.id)}
                onOpen={onOpenListing}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        </section>
      )}

      <div className="contact-bar">
        <button className="btn btn--ghost" onClick={() => onToggleSave(listing.id)}>
          <IconHeart size={17} filled={isSaved} />
        </button>
        <button className="btn btn--primary" onClick={() => onMessage(listing.id)}>
          <IconChat size={16} /> Message seller
        </button>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* Storefront                                                                  */
/* ========================================================================== */
function StoreView({
  seller,
  listings,
  saved,
  sellerMap,
  onOpenListing,
  onToggleSave,
  onGo,
  onToast,
}: {
  seller?: Seller;
  listings: Listing[];
  saved: string[];
  sellerMap: Record<string, Seller>;
  onOpenListing: (id: string) => void;
  onToggleSave: (id: string) => void;
  onGo: (route: Route) => void;
  onToast: (text: string, kind?: ToastMsg['kind']) => void;
}) {
  if (!seller) {
    return (
      <div className="shell">
        <Empty title="Storefront not found" message="This business may have changed its handle or closed its shop." />
      </div>
    );
  }

  const items = listings.filter((listing) => listing.sellerId === seller.id && listing.status === 'active');
  const views = items.reduce((sum, item) => sum + item.viewCount, 0);
  const saves = items.reduce((sum, item) => sum + item.saveCount, 0);

  return (
    <div className="shell">
      <div className="store-hero">
        <div
          className="store-hero__cover"
          style={{
            background: `linear-gradient(120deg, ${seller.avatarColor}, color-mix(in srgb, ${seller.avatarColor} 40%, #111))`,
          }}
        />
        <div className="store-hero__body">
          <div className="avatar avatar--lg store-hero__avatar" style={{ background: seller.avatarColor }}>
            {seller.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="store-hero__main">
            <h1 className="store-hero__name">
              {seller.name}
              <VerifyBadge level={seller.verification} />
            </h1>
            <p className="prose" style={{ fontSize: 13.5, marginTop: 8, maxWidth: '62ch' }}>
              {seller.bio}
            </p>
            <button
              className="store-url"
              onClick={() => {
                navigator.clipboard?.writeText(`https://${seller.storefrontUrl}`);
                onToast('Storefront URL copied', 'ok');
              }}
            >
              <IconLink size={13} /> {seller.storefrontUrl} <IconCopy size={13} />
            </button>
          </div>
          <div className="stat-grid" style={{ minWidth: 240 }}>
            <div className="stat-tile">
              <span>Live ads</span>
              <b>{items.length}</b>
            </div>
            <div className="stat-tile">
              <span>Views</span>
              <b>{compact(views)}</b>
            </div>
            <div className="stat-tile">
              <span>Saves</span>
              <b>{compact(saves)}</b>
            </div>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="section__head">
          <div>
            <h2 className="section__title">Inventory</h2>
            <p className="section__sub">
              {seller.location} · Member since {seller.memberSince} · ★ {seller.rating.toFixed(1)}
            </p>
          </div>
          <button className="section__link" onClick={() => onGo({ name: 'browse' })}>
            Browse marketplace <IconArrow size={15} />
          </button>
        </div>

        {items.length === 0 ? (
          <Empty title="No live listings" message="This storefront hasn't published anything yet." />
        ) : (
          <div className="listing-grid">
            {items.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                seller={sellerMap[listing.sellerId]}
                saved={saved.includes(listing.id)}
                onOpen={onOpenListing}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ========================================================================== */
/* Packages                                                                    */
/* ========================================================================== */
function PackagesView({
  profile,
  quotes,
  onPick,
}: {
  profile: Profile | null;
  quotes: DealerQuote[];
  onPick: (pkg: Package) => void;
}) {
  const myQuote = quotes.find((quote) => quote.profileId === profile?.id);

  return (
    <div className="shell">
      <section className="section">
        <div className="section__head">
          <div>
            <h2 className="section__title">Seller packages</h2>
            <p className="section__sub">
              Pay by UPI, net banking or card. GST invoice issued instantly. Cancel or upgrade anytime.
            </p>
          </div>
          {profile && (
            <span className="badge badge--soft">
              <IconWallet size={12} /> Current plan: {profile.tier}
            </span>
          )}
        </div>

        <div className="pkg-grid">
          {PACKAGES.map((pkg) => {
            const dealerPrice = pkg.adminPriced && myQuote ? myQuote.price : null;
            return (
              <div key={pkg.id} className={`pkg${pkg.highlight ? ' is-featured' : ''}`}>
                {pkg.highlight && <span className="pkg__ribbon">Most popular</span>}
                <div className="pkg__name">{pkg.name}</div>
                <div className="pkg__price">
                  {dealerPrice != null ? inr(dealerPrice) : pkg.price < 0 ? 'Custom' : pkg.price === 0 ? 'Free' : inr(pkg.price)}
                  {(pkg.price > 0 || dealerPrice != null) && (
                    <small>{dealerPrice != null ? myQuote?.cadence : pkg.cadence}</small>
                  )}
                </div>
                <ul className="pkg__list">
                  <li>
                    <IconCheck size={14} /> {pkg.ads}
                  </li>
                  <li>
                    <IconCheck size={14} /> {pkg.photos}
                  </li>
                  <li>
                    <IconCheck size={14} /> {pkg.video}
                  </li>
                  {pkg.perks.map((perk) => (
                    <li key={perk}>
                      <IconCheck size={14} /> {perk}
                    </li>
                  ))}
                </ul>
                <button
                  className={`btn ${pkg.highlight ? 'btn--primary' : 'btn--ghost'} btn--block`}
                  onClick={() => onPick(pkg)}
                  disabled={profile?.tier === pkg.id && !pkg.adminPriced}
                >
                  {profile?.tier === pkg.id && !pkg.adminPriced
                    ? 'Current plan'
                    : dealerPrice != null
                      ? 'Accept quote'
                      : pkg.cta}
                </button>
              </div>
            );
          })}
        </div>

        <div className="panel" style={{ marginTop: 26 }}>
          <div className="panel__title">
            <IconSpark size={15} /> What every plan includes
          </div>
          <ul className="feature-list">
            <li>
              <IconCheck size={14} /> Phone privacy masking with in-app messaging and private callback routing.
            </li>
            <li>
              <IconCheck size={14} /> Impression, save and lead counters on every ad — views require 10s of dwell.
            </li>
            <li>
              <IconCheck size={14} /> Instant indexing across the EXY universal search engine.
            </li>
            <li>
              <IconCheck size={14} /> Installable PWA storefront for buyers on iOS and Android.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

/* ========================================================================== */
/* Profile                                                                     */
/* ========================================================================== */
function ProfileView({
  profile,
  tab,
  savedListings,
  myListings,
  sellerMap,
  sellers,
  threads,
  saved,
  theme,
  onTheme,
  onGo,
  onOpenListing,
  onToggleSave,
  onSignIn,
  onSignOut,
  onSell,
  onUpdateListings,
  onUpdateSellers,
  onUpdateProfile,
  onToast,
}: {
  profile: Profile | null;
  tab: 'saved' | 'ads' | 'analytics' | 'settings';
  savedListings: Listing[];
  myListings: Listing[];
  sellerMap: Record<string, Seller>;
  sellers: Seller[];
  threads: Thread[];
  saved: string[];
  theme: Theme;
  onTheme: (theme: Theme) => void;
  onGo: (route: Route) => void;
  onOpenListing: (id: string) => void;
  onToggleSave: (id: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onSell: () => void;
  onUpdateListings: React.Dispatch<React.SetStateAction<Listing[]>>;
  onUpdateSellers: React.Dispatch<React.SetStateAction<Seller[]>>;
  onUpdateProfile: (patch: Partial<Profile>) => void;
  onToast: (text: string, kind?: ToastMsg['kind']) => void;
}) {
  if (!profile) {
    return (
      <div className="shell">
        <Empty
          icon={<IconUser size={28} />}
          title="Sign in to EXY"
          message="Save ads, publish listings, message buyers and track your seller analytics in one place."
          action={
            <button className="btn btn--primary" onClick={onSignIn}>
              Sign in / Create account
            </button>
          }
        />
      </div>
    );
  }

  const mySeller = sellers.find((seller) => seller.id === profile.id);
  const totals = myListings.reduce(
    (acc, l) => ({
      views: acc.views + l.viewCount,
      saves: acc.saves + l.saveCount,
      clicks: acc.clicks + l.clickCount,
      leads: acc.leads + l.leadCount,
      today: acc.today + l.todayViews,
    }),
    { views: 0, saves: 0, clicks: 0, leads: 0, today: 0 },
  );
  const limits = TIER_LIMITS[profile.tier];
  const myThreads = threads.filter((thread) => thread.sellerId === profile.id).length;

  const tabs: Array<{ id: typeof tab; label: string; icon: React.ReactNode }> = [
    { id: 'saved', label: `Saved Ads (${savedListings.length})`, icon: <IconBookmark size={15} /> },
    { id: 'ads', label: `My Listed Ads (${myListings.length})`, icon: <IconList size={15} /> },
    { id: 'analytics', label: 'Analytics', icon: <IconChart size={15} /> },
    { id: 'settings', label: 'Settings', icon: <IconSettings size={15} /> },
  ];

  return (
    <div className="shell">
      <section className="section">
        <div className="panel" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="avatar avatar--lg" style={{ background: profile.avatarColor }}>
            {profile.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.8px' }}>{profile.fullName}</h2>
            <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 3 }}>
              @{profile.username} · {profile.email}
            </div>
            <div className="pill-row" style={{ marginTop: 10 }}>
              <span className="badge badge--soft">
                <IconWallet size={11} /> {profile.tier} plan
              </span>
              {profile.tierExpiry && (
                <span className="badge badge--soft">
                  <IconClock size={11} /> Renews {new Date(profile.tierExpiry).toLocaleDateString('en-IN')}
                </span>
              )}
              {profile.role === 'admin' && <span className="badge badge--gold">Super Admin</span>}
              {mySeller && <VerifyBadge level={mySeller.verification} />}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <button className="btn btn--primary btn--sm" onClick={onSell}>
              <IconPlus size={15} /> Post ad
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => onGo({ name: 'packages' })}>
              Upgrade
            </button>
            {mySeller && (
              <button className="btn btn--ghost btn--sm" onClick={() => onGo({ name: 'store', handle: mySeller.handle })}>
                <IconStore size={15} /> My storefront
              </button>
            )}
          </div>
        </div>

        <div className="tabs">
          {tabs.map((item) => (
            <button
              key={item.id}
              className={`tab${tab === item.id ? ' is-on' : ''}`}
              onClick={() => onGo({ name: 'profile', tab: item.id })}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        {tab === 'saved' &&
          (savedListings.length === 0 ? (
            <Empty
              icon={<IconHeart size={28} />}
              title="No saved ads yet"
              message="Tap the heart on any listing to keep it here for later."
              action={
                <button className="btn btn--primary" onClick={() => onGo({ name: 'browse' })}>
                  Browse listings
                </button>
              }
            />
          ) : (
            <div className="listing-grid">
              {savedListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  seller={sellerMap[listing.sellerId]}
                  saved={saved.includes(listing.id)}
                  onOpen={onOpenListing}
                  onToggleSave={onToggleSave}
                />
              ))}
            </div>
          ))}

        {tab === 'ads' && (
          <>
            <div className="toolbar">
              <span className="badge badge--soft">
                {myListings.filter((l) => l.status === 'active').length}/{limits.ads} active ad slots used
              </span>
              <span className="toolbar__spacer" />
              <button className="btn btn--primary btn--sm" onClick={onSell}>
                <IconPlus size={15} /> New listing
              </button>
            </div>

            {myListings.length === 0 ? (
              <Empty
                icon={<IconList size={28} />}
                title="You haven't listed anything yet"
                message="Post your first ad with a Reel or Short as the hero video."
                action={
                  <button className="btn btn--primary" onClick={onSell}>
                    Post your first ad
                  </button>
                }
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Listing</th>
                      <th>Status</th>
                      <th>Views</th>
                      <th>Clicks</th>
                      <th>Saves</th>
                      <th>Leads</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {myListings.map((listing) => (
                      <tr key={listing.id}>
                        <td style={{ maxWidth: 260 }}>
                          <button style={{ textAlign: 'left', fontWeight: 650 }} onClick={() => onOpenListing(listing.id)}>
                            {listing.title}
                          </button>
                          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                            {inr(listing.price)} · {timeAgo(listing.createdAt)}
                          </div>
                        </td>
                        <td>
                          <button
                            className={`chip chip--sm${listing.status === 'active' ? ' is-on' : ''}`}
                            onClick={() =>
                              onUpdateListings((prev) =>
                                prev.map((item) =>
                                  item.id === listing.id
                                    ? { ...item, status: item.status === 'active' ? 'paused' : 'active' }
                                    : item,
                                ),
                              )
                            }
                          >
                            {listing.status}
                          </button>
                        </td>
                        <td>{compact(listing.viewCount)}</td>
                        <td>{compact(listing.clickCount)}</td>
                        <td>{compact(listing.saveCount)}</td>
                        <td>{compact(listing.leadCount)}</td>
                        <td>
                          <button
                            className="btn btn--danger btn--sm"
                            onClick={() => {
                              onUpdateListings((prev) => prev.filter((item) => item.id !== listing.id));
                              onToast('Listing deleted', 'info');
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'analytics' && (
          <>
            <div className="stat-grid" style={{ marginBottom: 18 }}>
              <div className="stat-tile">
                <span>
                  <IconEye size={12} /> Impressions
                </span>
                <b>{compact(totals.clicks + totals.views)}</b>
                <em>{compact(totals.clicks)} clicks</em>
              </div>
              <div className="stat-tile">
                <span>
                  <IconEye size={12} /> Qualified views
                </span>
                <b>{compact(totals.views)}</b>
                <em>&gt;{VIEW_DWELL_SECONDS}s dwell</em>
              </div>
              <div className="stat-tile">
                <span>
                  <IconHeart size={12} /> Saves
                </span>
                <b>{compact(totals.saves)}</b>
                <em>{totals.views ? ((totals.saves / totals.views) * 100).toFixed(1) : '0.0'}% save rate</em>
              </div>
              <div className="stat-tile">
                <span>
                  <IconChat size={12} /> Leads
                </span>
                <b>{compact(totals.leads)}</b>
                <em>{myThreads} conversations</em>
              </div>
              <div className="stat-tile">
                <span>Active ads</span>
                <b>{myListings.filter((l) => l.status === 'active').length}</b>
                <em>of {limits.ads} allowed</em>
              </div>
              <div className="stat-tile">
                <span>Today's views</span>
                <b>{totals.today}</b>
              </div>
            </div>

            <div className="panel">
              <div className="panel__title">Per-ad performance</div>
              {myListings.length === 0 ? (
                <p className="prose" style={{ fontSize: 13.5 }}>
                  Publish a listing to start collecting impression data.
                </p>
              ) : (
                myListings.map((listing) => {
                  const max = Math.max(1, ...myListings.map((item) => item.viewCount));
                  return (
                    <div key={listing.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                        <b style={{ fontWeight: 650 }}>{listing.title}</b>
                        <span style={{ color: 'var(--ink-3)' }}>
                          {compact(listing.viewCount)} views · {compact(listing.saveCount)} saves ·{' '}
                          {compact(listing.leadCount)} leads
                        </span>
                      </div>
                      <div style={{ height: 8, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${(listing.viewCount / max) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg,var(--accent),var(--accent-2))',
                            borderRadius: 99,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {tab === 'settings' && (
          <>
            <div className="panel">
              <div className="panel__title">Appearance</div>
              <div className="chips">
                <button className={`chip${theme === 'airy' ? ' is-on' : ''}`} onClick={() => onTheme('airy')}>
                  <IconSun size={14} /> Bright &amp; Airy
                </button>
                <button className={`chip${theme === 'gold' ? ' is-on' : ''}`} onClick={() => onTheme('gold')}>
                  <IconMoon size={14} /> Gold Black
                </button>
              </div>
            </div>

            <div className="panel">
              <div className="panel__title">Account</div>
              <div className="form-grid">
                <div className="field">
                  <label className="field__label" htmlFor="ps-name">
                    Full name
                  </label>
                  <input
                    id="ps-name"
                    className="input"
                    value={profile.fullName}
                    onChange={(event) => onUpdateProfile({ fullName: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="ps-username">
                    Username
                  </label>
                  <input id="ps-username" className="input" value={profile.username} disabled />
                </div>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="ps-phone">
                  Phone number
                </label>
                <input
                  id="ps-phone"
                  className="input"
                  value={profile.phone ?? ''}
                  onChange={(event) => onUpdateProfile({ phone: event.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="field">
                <span className="field__label">Auth backend</span>
                <div className="clone-preview">
                  {isSupabaseLive ? 'Supabase Auth — live session' : 'Local demo driver (Supabase not configured)'}
                  <br />
                  Email verified: {profile.emailVerified ? 'yes' : 'pending'}
                  <br />
                  Role: {profile.role}
                </div>
              </div>
            </div>

            {mySeller && (
              <div className="panel">
                <div className="panel__title">Privacy &amp; storefront</div>
                <Switch
                  on={mySeller.hidePhone}
                  onChange={(value) => {
                    onUpdateSellers((prev) =>
                      prev.map((seller) => (seller.id === mySeller.id ? { ...seller, hidePhone: value } : seller)),
                    );
                    onUpdateProfile({ hidePhone: value });
                    onToast(value ? 'Phone masked — leads route to in-app messaging' : 'Phone number now visible', 'ok');
                  }}
                  label="Hide my phone number"
                  hint="All contact buttons route exclusively through EXY messaging."
                />
                <div className="divider" />
                <div className="field">
                  <label className="field__label" htmlFor="ps-bio">
                    Storefront bio
                  </label>
                  <textarea
                    id="ps-bio"
                    className="textarea"
                    value={mySeller.bio}
                    onChange={(event) =>
                      onUpdateSellers((prev) =>
                        prev.map((seller) => (seller.id === mySeller.id ? { ...seller, bio: event.target.value } : seller)),
                      )
                    }
                  />
                </div>
                <div className="store-url">
                  <IconLink size={13} /> {mySeller.storefrontUrl}
                </div>
              </div>
            )}

            <div className="panel">
              <div className="panel__title">Session</div>
              <button className="btn btn--danger" onClick={onSignOut}>
                Sign out
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* ========================================================================== */
/* Footer + bottom nav                                                         */
/* ========================================================================== */
function Footer({
  onGo,
  isAdmin,
  categories,
}: {
  onGo: (route: Route) => void;
  isAdmin: boolean;
  categories: Category[];
}) {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer__grid">
          <div className="footer__col">
            <div className="brand" style={{ marginBottom: 12 }}>
              <span className="brand__mark">EX</span>
              <span>
                <span className="brand__name">EXY</span>
              </span>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.65, maxWidth: '38ch' }}>
              The universal visual classifieds marketplace. Every reel, short and video ad indexed with real prices and
              verified sellers.
            </p>
          </div>

          <div className="footer__col">
            <h4>Categories</h4>
            <ul>
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <button onClick={() => onGo({ name: 'browse', categoryId: category.id })}>{category.name}</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <h4>Sellers</h4>
            <ul>
              <li>
                <button onClick={() => onGo({ name: 'packages' })}>Packages &amp; pricing</button>
              </li>
              <li>
                <button onClick={() => onGo({ name: 'profile', tab: 'ads' })}>My listed ads</button>
              </li>
              <li>
                <button onClick={() => onGo({ name: 'profile', tab: 'analytics' })}>Seller analytics</button>
              </li>
              <li>
                <button onClick={() => onGo({ name: 'messages' })}>Messages &amp; leads</button>
              </li>
            </ul>
          </div>

          <div className="footer__col">
            <h4>Company</h4>
            <ul>
              <li>
                <button onClick={() => onGo({ name: 'home' })}>About EXY</button>
              </li>
              <li>
                <button onClick={() => onGo({ name: 'profile', tab: 'settings' })}>Privacy &amp; safety</button>
              </li>
              <li>
                <button onClick={() => onGo({ name: 'feed' })}>Visual feed</button>
              </li>
              {isAdmin && (
                <li>
                  <button onClick={() => onGo({ name: 'admin' })}>Super-Admin portal</button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} EXY Classifieds. Built for India.</span>
          <span>Instagram · YouTube Shorts · Facebook Reels · TikTok indexing</span>
        </div>
      </div>
    </footer>
  );
}

function BottomNav({
  route,
  savedCount,
  unread,
  onGo,
  onSell,
}: {
  route: Route;
  savedCount: number;
  unread: number;
  onGo: (route: Route) => void;
  onSell: () => void;
}) {
  return (
    <nav className="bottom-nav">
      <button className={`bottom-nav__item${route.name === 'home' ? ' is-on' : ''}`} onClick={() => onGo({ name: 'home' })}>
        <IconHome size={21} />
        Home
      </button>
      <button className={`bottom-nav__item${route.name === 'feed' ? ' is-on' : ''}`} onClick={() => onGo({ name: 'feed' })}>
        <IconFilm size={21} />
        Feed
      </button>
      <button className="bottom-nav__item bottom-nav__sell" onClick={onSell} aria-label="Post a listing">
        <span className="bottom-nav__sell-orb">
          <IconPlus size={26} />
        </span>
      </button>
      <button
        className={`bottom-nav__item${route.name === 'messages' ? ' is-on' : ''}`}
        onClick={() => onGo({ name: 'messages' })}
      >
        <IconChat size={21} />
        Chats
        {unread > 0 && <span className="bottom-nav__badge">{unread}</span>}
      </button>
      <button
        className={`bottom-nav__item${route.name === 'profile' ? ' is-on' : ''}`}
        onClick={() => onGo({ name: 'profile', tab: 'saved' })}
      >
        <IconUser size={21} />
        Profile
        {savedCount > 0 && <span className="bottom-nav__badge">{savedCount}</span>}
      </button>
    </nav>
  );
}
