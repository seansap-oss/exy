import { readFileSync } from 'node:fs';

const css = readFileSync('src/prototype.css', 'utf8');
const embed = readFileSync('src/components/VideoEmbed.tsx', 'utf8');
const overlay = readFileSync('src/components/LiveClassifiedsOverlay.tsx', 'utf8');
const feed = readFileSync('src/components/VisualFeed.tsx', 'utf8');
const preview = readFileSync('src/components/MediaPreview.tsx', 'utf8');
const parser = readFileSync('src/lib/embeds.ts', 'utf8');
const store = readFileSync('src/lib/listingsStore.ts', 'utf8');
const oembed = readFileSync('src/lib/oembed.ts', 'utf8');
const playback = readFileSync('src/lib/playback.ts', 'utf8');
const scripts = readFileSync('src/lib/embedScripts.ts', 'utf8');
const api = readFileSync('api/oembed.ts', 'utf8');
const prototype = readFileSync('src/Prototype.tsx', 'utf8');
const drawer = readFileSync('src/components/ExpressPostDrawer.tsx', 'utf8');
const sellFlow = readFileSync('src/components/SellFlow.tsx', 'utf8');
const uploader = readFileSync('src/components/UnifiedUploader.tsx', 'utf8');
const smartCover = readFileSync('src/lib/smartCover.ts', 'utf8');
const coverApi = readFileSync('api/cover.ts', 'utf8');
const thumbnails = readFileSync('src/lib/thumbnails.ts', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(pkg.version === '1.5.40', `Expected EXY v1.5.40, found ${pkg.version}.`);

// Check 1 - runtime provider gate. Meta players mount only after oEmbed proves
// availability; provider self-navigation becomes an EXY fallback.
assert(parser.includes('https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}'), 'Facebook parser does not create the official plugin URL.');
assert(embed.includes("const socialEmbeddable = video?.provider === 'instagram' || video?.provider === 'facebook';"), 'Facebook is not enabled in the bounded social stage.');
assert(embed.includes('function resolvedEmbedSource(video: VideoEmbedType, resolvedSocialUrl: string): string'), 'Existing-record embed recovery is missing.');
assert(embed.includes('encodeURIComponent(resolvedSocialUrl || video.url)'), 'Canonical Facebook URLs are not rebuilt safely at render time.');
assert(embed.includes("video.provider !== 'instagram' && video.provider !== 'facebook'"), 'Both Meta providers are not protected by the availability gate.');
assert(embed.includes('fetchOEmbed(video.url)') && !embed.includes('controller.abort()'), 'The shared Meta availability request is not StrictMode-safe.');
assert(embed.includes('socialFrameLoads.current > 1') && embed.includes('setSocialNavigated(true)'), 'Meta iframe navigation is not converted to an EXY fallback.');
assert(embed.includes('sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"'), 'The Meta iframe sandbox is missing.');
assert(!embed.includes('allow-popups') && !embed.includes('allow-top-navigation'), 'The Meta iframe can still open a popup or navigate EXY.');
assert(playback.includes("video.provider === 'facebook' && original") && playback.includes("kind: 'embed'"), 'Facebook does not resolve to the EXY inline overlay.');
assert(playback.includes("listing.media?.find((item) => item.kind === 'video')"), 'EXY-hosted video does not retain playback priority.');
assert(feed.includes("playback.provider === 'youtube'") && feed.includes('onExpand();'), 'YouTube still requires an extra inline-card click before the EXY viewer opens.');
assert(oembed.includes("error.name === 'AbortError'") && !oembed.includes("catch {\n      memory.set(url, null);"), 'Aborted Meta checks can still poison the session cache.');
assert(api.includes("'http://127.0.0.1:5173'") && api.includes("'https://localhost'") && api.includes("'capacitor://localhost'"), 'Vite or Capacitor is missing from the oEmbed CORS allowlist.');
assert(api.includes("response.setHeader('Access-Control-Allow-Origin', origin)") && !api.includes("Access-Control-Allow-Origin', '*'"), 'The oEmbed API CORS policy is missing or unsafe.');
assert(api.includes("/^exy-[a-z0-9-]+-cj-school-s-projects\\.vercel\\.app$/i"), 'EXY Vercel previews are missing from the strict CORS origin gate.');
assert(api.includes('resolveFacebookUrl(candidate)') && api.includes("method: 'HEAD'") && api.includes("redirect: 'manual'"), 'Facebook share links are not resolved server-side.');
assert(api.includes("status: 'unresolved_redirect'") && api.includes('available: false'), 'Unresolved Facebook shares can still mount a provider error document.');
assert(embed.includes('setResolvedSocialUrl(result.normalizedUrl)'), 'The resolved Facebook URL is not handed to the iframe.');
console.log('PASS 1/4 - Meta availability and navigation are runtime-gated; native EXY video remains the guaranteed playback path.');
// Check 2 — geometry. All viewer surfaces retain one bounded 9:16 EXY frame,
// with the action rail above the media.
assert(css.includes('aspect-ratio: 9 / 16;'), 'The shared social stage does not enforce 9:16 geometry.');
assert(css.includes('.feed__slide {\n  aspect-ratio: 9 / 16;'), 'Feed cards do not use the shared 9:16 geometry.');
assert(css.includes('contain: layout paint;'), 'The social stage can still leak provider layout outside the player.');
assert(css.includes('isolation: isolate;'), 'The social stage does not isolate provider stacking.');
assert(css.includes('.lco__action-rail,'), 'Fullscreen action rail is not protected above media.');
assert(css.includes('.lco__video > .video,') && css.includes('.fs-player__frame > .video'), 'Live and fullscreen containers do not share bounded video rules.');
assert((prototype.match(/<CategoryRail categories={categories} onGo=/g) ?? []).length === 2, 'Home and Feed do not share the same category rail.');
assert(prototype.includes("routeScrollRef.current[route.name] = window.scrollY"), 'Home and Feed do not preserve their scroll positions.');
assert(!prototype.includes("window.scrollTo({ top: 0, behavior: 'smooth' })"), 'Route changes still force a visible scroll jump.');
assert(css.includes('flex: 0 0 min(74vw, 300px);') && css.includes('.home-c__hero-card') && css.includes('aspect-ratio: 9 / 16;'), 'The Home carousel cards are not reduced to the approved 10%-smaller 9:16 width.');
assert(css.includes('touch-action: pan-y;') && css.includes('scroll-snap-stop: always;'), 'The Home carousel does not retain native thumb-swiping and snap behaviour.');
assert(css.includes('.home-c__chevron-back') && !prototype.includes('className="home-c__chevron-flip"><IconChevron size={18} /></span></button>'), 'Home carousel arrows are not true left/right controls.');
assert(prototype.includes('onScroll={syncHeroIndex}') && prototype.includes('onClick={() => onExpand(listing)}'), 'Home carousel taps do not open the EXY video overlay directly.');
console.log('PASS 2/4 — all player surfaces retain a bounded 9:16 frame; the Home carousel is smaller, thumb-swipable and uses true left/right controls.');

// Check 3 - clean EXY-owned fallback. Restricted or unavailable Meta posts
// retain listing identity and an explicit original-provider action, while the
// normal play path never automatically hands control away from EXY.
assert(embed.includes('data-exy-provider-fallback={video.provider}'), 'EXY provider fallback is missing.');
assert(embed.includes('<IconLink size={15} /> Open original'), 'Explicit Open original fallback action is missing.');
assert(embed.includes('className="mp--fill"'), 'Fallback does not fill the player canvas.');
assert(preview.includes('mp__price') && preview.includes('mp__avatar-blur'), 'Fallback has lost listing identity or pricing.');
assert(!embed.includes('dangerouslySetInnerHTML'), 'Unsafe provider HTML injection remains.');
assert(!scripts.includes('connect.facebook.net') && !scripts.includes('loadFacebookSDK') && !scripts.includes('XFBML'), 'Facebook SDK injection remains.');
assert(playback.includes('fb://facewebmodal/f?href='), 'Explicit Facebook fallback handoff is missing.');
assert(!overlay.includes('handoffToProvider') && feed.includes("if (playback.kind === 'embed')") && feed.includes("playback.provider !== 'instagram' && playback.provider !== 'facebook'"), 'Meta playback is not isolated from automatic provider handoff.');
assert(embed.includes('Meta requires a login or redirected away from the embedded player.'), 'The Meta login/navigation fallback reason is missing.');
assert(drawer.includes("video.provider === 'instagram' || video.provider === 'facebook'"), 'Meta imports do not request a seller cover.');
assert(drawer.includes('Add one clear product cover'), 'The seller cover requirement is missing.');
assert(drawer.includes('video,') && !drawer.includes('poster: coverPhoto.src'), 'The uploaded cover is still coupled to the social video playback source.');
assert(drawer.includes('media: coverPhoto ? [coverPhoto] : undefined'), 'The uploaded cover is not persisted as hosted listing media.');
assert(uploader.includes('imageOnly') && uploader.includes('ACCEPT_IMAGES'), 'The cover picker is not restricted to still images.');
assert(thumbnails.includes("item.kind === 'image')?.src"), 'Hosted cover photos do not have preview priority.');
assert(overlay.includes('candidates={listingCandidates(listing)}'), 'The EXY player fallback does not receive the listing cover as a visual-only candidate.');
assert(parser.includes('export function isProviderPlaybackUrl'), 'Provider URL safety gate is missing.');
assert(store.includes('sourceUrls.find((url) => isProviderPlaybackUrl(storedProvider, url))'), 'Saved listings can still hydrate a cover as a provider URL.');
assert(store.includes('recoverVideoFromText(row.title, row.description)'), 'Legacy listings cannot recover a social URL after an image was stored as video.');
assert(!playback.includes("video.url?.startsWith('http')"), 'Playback can still promote any HTTPS image to an original URL.');
assert(embed.includes("setSocialAvailability('unavailable');") && embed.includes('A saved cover must never be requested'), 'The embed renderer can still request a cover image as a Reel.');
assert(sellFlow.includes("hosted.find((item) => item.kind === 'video')"), 'The manual listing publisher can still promote a thumbnail to native video.');
assert(!sellFlow.includes('url: hosted[0].src') && !sellFlow.includes('embedSrc: hosted[0].src'), 'The first uploaded image can still become the playback source.');
assert(embed.includes("video.provider === 'native' && isProviderPlaybackUrl('native', video.embedSrc)"), 'The player can still mount an image URL in a native video element.');
console.log('PASS 3/4 - unavailable Meta posts keep the clean EXY fallback; covers are visual-only and cannot become a playback URL.');

// Check 4 - Smart Cover Studio. One signed-in, server-side AI generation runs
// while the seller fills the form. Manual photos cancel/override it and every
// source is normalised into a compact 9:16 WebP before Supabase upload.
assert(drawer.includes('generateSmartCover') && drawer.includes('coverAttemptRef.current = attemptKey'), 'The one-shot background cover job is missing.');
assert(drawer.includes("source: 'ai-generated'") && drawer.includes('setCoverMedia([media])'), 'Generated covers are not uploaded and attached automatically.');
assert(drawer.includes('onUploadStart={beginManualCover}') && drawer.includes('coverJobRef.current?.abort()'), 'Manual covers do not override an in-flight AI cover.');
assert(uploader.includes('normalizeSmartCover') && uploader.includes('normalizeCover'), 'Seller covers are not normalised to EXY geometry.');
assert(smartCover.includes('const COVER_WIDTH = 576') && smartCover.includes('const COVER_HEIGHT = 1024'), 'Smart covers do not use the bounded 9:16 canvas.');
assert(smartCover.includes("'image/webp'") && smartCover.includes('0.78'), 'Smart covers are not compressed to lightweight WebP.');
assert(coverApi.includes('authenticatedUser(authorization)') && coverApi.includes("response.status(401)"), 'The cover API is not protected by the Supabase seller session.');
assert(coverApi.includes('CLOUDFLARE_ACCOUNT_ID') && coverApi.includes('CLOUDFLARE_AI_API_TOKEN'), 'Server-only AI provider configuration is missing.');
assert(!smartCover.includes('CLOUDFLARE_AI_API_TOKEN') && !smartCover.includes('CLOUDFLARE_API_TOKEN'), 'An AI provider token leaked into client source.');
assert(coverApi.includes('RATE_MAX = 3') && coverApi.includes('rateLimited(userId)'), 'AI cover abuse protection is missing.');
console.log('PASS 4/4 - one automatic AI cover is generated in the background; manual covers override it and all covers become lightweight 9:16 WebP.');
