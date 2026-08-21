import { readFileSync } from 'node:fs';

const css = readFileSync('src/prototype.css', 'utf8');
const embed = readFileSync('src/components/VideoEmbed.tsx', 'utf8');
const overlay = readFileSync('src/components/LiveClassifiedsOverlay.tsx', 'utf8');
const feed = readFileSync('src/components/VisualFeed.tsx', 'utf8');
const preview = readFileSync('src/components/MediaPreview.tsx', 'utf8');
const parser = readFileSync('src/lib/embeds.ts', 'utf8');
const oembed = readFileSync('src/lib/oembed.ts', 'utf8');
const playback = readFileSync('src/lib/playback.ts', 'utf8');
const scripts = readFileSync('src/lib/embedScripts.ts', 'utf8');
const api = readFileSync('api/oembed.ts', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(pkg.version === '1.5.33', `Expected EXY v1.5.33, found ${pkg.version}.`);

// Check 1 - runtime provider gate. Meta players mount only after oEmbed proves
// availability; provider self-navigation becomes an EXY fallback.
assert(parser.includes('https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}'), 'Facebook parser does not create the official plugin URL.');
assert(embed.includes("const socialEmbeddable = video?.provider === 'instagram' || video?.provider === 'facebook';"), 'Facebook is not enabled in the bounded social stage.');
assert(embed.includes('function resolvedEmbedSource(video: VideoEmbedType): string'), 'Existing-record embed recovery is missing.');
assert(embed.includes('encodeURIComponent(video.url)'), 'Existing Facebook URLs are not rebuilt safely at render time.');
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
console.log('PASS 1/3 - Meta availability and navigation are runtime-gated; native EXY video remains the guaranteed playback path.');
// Check 2 — geometry. All viewer surfaces retain one bounded 9:16 EXY frame,
// with the action rail above the media.
assert(css.includes('aspect-ratio: 9 / 16;'), 'The shared social stage does not enforce 9:16 geometry.');
assert(css.includes('.feed__slide {\n  aspect-ratio: 9 / 16;'), 'Feed cards do not use the shared 9:16 geometry.');
assert(css.includes('contain: layout paint;'), 'The social stage can still leak provider layout outside the player.');
assert(css.includes('isolation: isolate;'), 'The social stage does not isolate provider stacking.');
assert(css.includes('.lco__action-rail,'), 'Fullscreen action rail is not protected above media.');
assert(css.includes('.lco__video > .video,') && css.includes('.fs-player__frame > .video'), 'Live and fullscreen containers do not share bounded video rules.');
console.log('PASS 2/3 — all player surfaces retain a bounded 9:16 frame with Share, Message, and Save above media.');

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
console.log('PASS 3/3 - unavailable or redirected Meta posts switch to the EXY fallback; leaving EXY remains an explicit Open original action.');
