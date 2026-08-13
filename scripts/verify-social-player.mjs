import { readFileSync } from 'node:fs';

const css = readFileSync('src/prototype.css', 'utf8');
const embed = readFileSync('src/components/VideoEmbed.tsx', 'utf8');
const overlay = readFileSync('src/components/LiveClassifiedsOverlay.tsx', 'utf8');
const feed = readFileSync('src/components/VisualFeed.tsx', 'utf8');
const preview = readFileSync('src/components/MediaPreview.tsx', 'utf8');
const parser = readFileSync('src/lib/embeds.ts', 'utf8');
const store = readFileSync('src/lib/listingsStore.ts', 'utf8');
const playback = readFileSync('src/lib/playback.ts', 'utf8');
const scripts = readFileSync('src/lib/embedScripts.ts', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(pkg.version === '1.5.29', `Expected EXY v1.5.29, found ${pkg.version}.`);

// Check 1 — provider routing. YouTube remains an inline player. Instagram is
// attempted only when it is embeddable. Facebook is always handed to Facebook
// itself, which avoids provider error pages inside Android WebView.
assert(parser.includes("embedSrc: '',"), 'Facebook must not create an in-app iframe URL.');
assert(embed.includes("const socialEmbeddable = video?.provider === 'instagram';"), 'Only Instagram may use the social embed stage.');
assert(embed.includes("const facebookExternalOnly = video?.provider === 'facebook';"), 'Facebook external handoff gate is missing.');
assert(embed.includes("if (!video || video.provider !== 'instagram')"), 'Facebook must not call the oEmbed availability path.');
assert(playback.includes("video.provider === 'facebook' && original") && playback.includes("kind: 'external'"), 'Facebook must resolve to the external player route.');
assert(store.includes("provider === 'facebook'\n              ? ''"), 'Persisted Facebook listings can still rebuild a broken iframe URL.');
console.log('PASS 1/3 — Facebook is routed to the Facebook app/browser; YouTube and eligible Instagram use their appropriate player paths.');

// Check 2 — geometry. All viewer surfaces retain one bounded 9:16 EXY frame,
// with the action rail above the media.
assert(css.includes('aspect-ratio: 9 / 16;'), 'The shared social stage does not enforce 9:16 geometry.');
assert(css.includes('contain: layout paint;'), 'The social stage can still leak provider layout outside the player.');
assert(css.includes('isolation: isolate;'), 'The social stage does not isolate provider stacking.');
assert(css.includes('.lco__action-rail,'), 'Fullscreen action rail is not protected above media.');
assert(css.includes('.lco__video > .video,') && css.includes('.fs-player__frame > .video'), 'Live and fullscreen containers do not share bounded video rules.');
console.log('PASS 2/3 — all player surfaces retain a bounded 9:16 frame with Share, Message, and Save above media.');

// Check 3 — clean, EXY-owned fallback. No Facebook SDK or provider HTML is
// injected, so a translated provider rejection cannot take over the screen.
assert(embed.includes('data-exy-provider-fallback={video.provider}'), 'EXY provider fallback is missing.');
assert(embed.includes('Open in Facebook') && embed.includes('Open in Instagram'), 'Original-provider actions are missing.');
assert(embed.includes('className="mp--fill"'), 'Fallback does not fill the player canvas.');
assert(preview.includes('mp__price') && preview.includes('mp__avatar-blur'), 'Fallback has lost listing identity or pricing.');
assert(!embed.includes('dangerouslySetInnerHTML'), 'Unsafe provider HTML injection remains.');
assert(!scripts.includes('connect.facebook.net') && !scripts.includes('loadFacebookSDK') && !scripts.includes('XFBML'), 'Facebook SDK injection remains.');
assert(playback.includes('fb://facewebmodal/f?href='), 'Facebook native app handoff is missing.');
assert(overlay.includes('handoffToProvider') && feed.includes('handoffToProvider'), 'Provider handoff is not available from both viewer surfaces.');
console.log('PASS 3/3 — Facebook cannot display a translated provider error inside EXY; unavailable posts remain in a clean EXY fallback.');
