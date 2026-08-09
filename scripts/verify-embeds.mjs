#!/usr/bin/env node
/**
 * Browser-only visual verification of the deployed Instagram / Facebook
 * embeds. Read-only: launches Chromium, mounts the exact embed HTML the
 * live /api/oembed proxy returns, loads the official provider script, and
 * reports whether an interactive iframe actually appears with real
 * dimensions. Nothing in the app is modified.
 *
 *   node scripts/verify-embeds.mjs
 */
import { chromium } from 'playwright';

const ORIGIN = process.env.EXY_ORIGIN || 'https://exy-green.vercel.app';

const TARGETS = [
  {
    provider: 'instagram',
    label: 'Instagram post/Reel',
    url: 'https://www.instagram.com/p/fA9uwTtkSN/',
    script: 'https://www.instagram.com/embed.js',
    selector: '.instagram-media',
  },
  {
    provider: 'facebook',
    label: 'Facebook video',
    url: 'https://www.facebook.com/facebook/videos/10153231379946729/',
    script: 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v26.0',
    selector: '.fb-video',
  },
];

const line = (s = '') => console.log(s);

async function main() {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
  });

  /* ---------------- 1. live site smoke test ---------------- */
  const site = await context.newPage();
  const siteErrors = [];
  const siteFailures = [];
  site.on('console', (m) => m.type() === 'error' && siteErrors.push(m.text().slice(0, 160)));
  site.on('requestfailed', (r) => siteFailures.push(`${r.url().slice(0, 90)} :: ${r.failure()?.errorText}`));

  await site.goto(ORIGIN, { waitUntil: 'networkidle', timeout: 60000 });
  const title = await site.title();
  const cards = await site.locator('.card, .feed-card').count();
  line(`LIVE SITE  ${ORIGIN}`);
  line(`  title        : ${title}`);
  line(`  listing cards: ${cards}`);
  line(`  console errs : ${siteErrors.length ? siteErrors.slice(0, 4).join(' | ') : 'none'}`);
  line(`  failed reqs  : ${siteFailures.length ? siteFailures.slice(0, 4).join(' | ') : 'none'}`);
  await site.close();

  /* ---------------- 2. per-provider embed render ---------------- */
  for (const target of TARGETS) {
    line();
    line(`=== ${target.label} ===`);

    // Fetch the exact payload the app receives.
    const api = await context.request.get(`${ORIGIN}/api/oembed?url=${encodeURIComponent(target.url)}`);
    const data = await api.json();
    line(`  API           : HTTP ${api.status()} status=${data.status} avail=${data.available}`);
    if (!data.embedHtml) {
      line('  RESULT        : NO EMBED HTML — cannot render');
      continue;
    }
    line(`  embed HTML    : ${data.embedHtml.length} chars`);

    const page = await context.newPage();
    const errors = [];
    const failed = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 140)));
    page.on('requestfailed', (r) => failed.push(`${r.url().slice(0, 80)} :: ${r.failure()?.errorText}`));

    // Mirror the app: inject embed HTML, then load the official script.
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"></head>
       <body style="margin:0;background:#0c0b09">
         <div id="mount" style="position:relative;width:640px;min-height:320px;overflow:hidden">
           ${data.embedHtml}
         </div>
       </body></html>`,
      { waitUntil: 'domcontentloaded' },
    );

    let scriptLoaded = true;
    try {
      await page.addScriptTag({ url: target.script });
    } catch (error) {
      scriptLoaded = false;
      line(`  script load   : FAILED (${String(error).slice(0, 80)})`);
    }
    if (scriptLoaded) line('  script load   : OK');

    // Give the provider script time to parse and inject its iframe.
    await page.waitForTimeout(9000);

    const report = await page.evaluate(() => {
      const iframe = document.querySelector('#mount iframe');
      const blockquote = document.querySelector('#mount blockquote, #mount .fb-video');
      const measure = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          w: Math.round(r.width),
          h: Math.round(r.height),
          display: cs.display,
          visibility: cs.visibility,
          opacity: cs.opacity,
          zIndex: cs.zIndex,
        };
      };
      return {
        iframeFound: Boolean(iframe),
        iframeSrc: iframe?.getAttribute('src')?.slice(0, 110) ?? null,
        iframe: measure(iframe),
        blockquoteStill: Boolean(blockquote) && !iframe,
        mountHeight: Math.round(document.querySelector('#mount')?.getBoundingClientRect().height ?? 0),
        bodyText: (document.body.innerText || '').slice(0, 120).replace(/\s+/g, ' '),
      };
    });

    line(`  iframe created: ${report.iframeFound}`);
    if (report.iframe) {
      const f = report.iframe;
      const visible = f.w > 0 && f.h > 0 && f.display !== 'none' && f.visibility !== 'hidden' && f.opacity !== '0';
      line(`  dimensions    : ${f.w}x${f.h}  display=${f.display} visibility=${f.visibility} opacity=${f.opacity} z=${f.zIndex}`);
      line(`  VISIBLE       : ${visible ? 'YES' : 'NO'}`);
      line(`  iframe src    : ${report.iframeSrc}`);
    } else {
      line(`  blockquote left unparsed: ${report.blockquoteStill}`);
      line(`  mount height  : ${report.mountHeight}px`);
      line(`  visible text  : ${report.bodyText || '(none)'}`);
    }
    line(`  console errs  : ${errors.length ? errors.slice(0, 3).join(' | ') : 'none'}`);
    line(`  failed reqs   : ${failed.length ? failed.slice(0, 3).join(' | ') : 'none'}`);
    line(`  RESULT        : ${report.iframeFound && report.iframe?.w > 0 ? 'RENDERED' : 'NOT RENDERED'}`);

    await page.close();
  }

  await browser.close();
}

main().catch((error) => {
  console.error('verification failed:', error);
  process.exit(1);
});
