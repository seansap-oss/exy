# EXY v1.5.27 — Meta playback repair

## What changed

- Facebook no longer loads a Meta iframe, plugin, SDK, or WebView inside EXY. Each Facebook listing uses the existing fitted EXY 9:16 player canvas and a **Watch on Facebook** action that opens the original link in Facebook or the browser.
- Instagram remains eligible for its official in-app embed. If Meta blocks it or the post is restricted, EXY keeps the same 9:16 canvas and offers **Watch on Instagram** instead of showing a broken provider page.
- YouTube remains an inline player.
- All fallback cards fill the same 9:16 canvas and use the listing cover/candidate image when present. Without one, EXY generates a branded preview from seller, title, price, and provider metadata; the frame is never intentionally blank.
- Existing Share, Message, and Save actions remain above the player surface and are unchanged.
- The footer wording is now **Built for global use**.

## Verification completed

1. `npm run verify:social-player` — passed all three Facebook/Instagram/YouTube routing and 9:16 safeguards.
2. `npm run lint` — passed.
3. TypeScript production compilation and Vite production build — passed.
4. The Android version inputs are synchronized: `versionCode 1005027`, `versionName 1.5.27`, and release marker `EXY_RELEASE_VERSION:1.5.27`.

## Important provider behaviour

Facebook blocks reliable embedded playback for many public, regional, age-gated, and app-session videos. This release deliberately avoids the broken embedded screen. A Facebook listing must open in the Facebook app or browser after the user taps **Watch on Facebook**. This is the reliable and policy-safe path.

Instagram embeds also remain subject to the post being public and Meta permitting the embed. When that is not available, EXY displays the clean fallback and opens the original Instagram post on request.
