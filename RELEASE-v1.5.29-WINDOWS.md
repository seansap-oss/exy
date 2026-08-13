# EXY v1.5.29 — Windows build and install

This release fixes two targeted issues:

- A production APK cannot use local demo accounts. It must authenticate with the configured Supabase project.
- Facebook Reels do not render inside EXY's WebView. EXY keeps the listing in its 9:16 card and hands the Reel to the Facebook app or browser, which is the only reliable way to let Facebook apply its own access, audio, and playback rules.

## Use two VS Code terminals

Keep the **left terminal** only for the local website preview. Use the **right terminal** for the Android build commands.

## 1. Extract into a fresh folder (right terminal)

```powershell
$zip = Get-ChildItem "$env:USERPROFILE\Downloads\EXY-v1.5.29-production-auth-facebook-handoff-source.zip" | Select-Object -First 1
$destination = 'D:\exy-v1.5.29'
New-Item -ItemType Directory -Path $destination -Force | Out-Null
Expand-Archive -LiteralPath $zip.FullName -DestinationPath $destination -Force
Set-Location $destination
```

## 2. Pull the connected Vercel environment (right terminal)

```powershell
npm install
npx vercel link
npx vercel env pull .env.local
```

If Vercel asks to overwrite `.env.local`, type `y`. Do not type or paste Supabase keys manually.

## 3. Build the production Android web bundle (right terminal)

```powershell
npm run verify:production-auth
npm run verify:social-player
npm run android:prepare
Get-Content .\android\app\src\main\assets\public\exy-build-info.json
```

The last command must show `"version": "1.5.29"` and the production Supabase host. Stop if it does not.

## 4. Build and verify the APK (right terminal)

```powershell
Set-Location .\android
.\gradlew.bat clean assembleDebug
$apk = (Resolve-Path .\app\build\outputs\apk\debug\app-debug.apk).Path
$aapt = Get-ChildItem "$env:LOCALAPPDATA\Android\Sdk\build-tools" -Filter aapt.exe -Recurse | Sort-Object FullName -Descending | Select-Object -First 1
& $aapt.FullName dump badging $apk | Select-String "package:"
Copy-Item $apk "$env:USERPROFILE\Downloads\EXY-v1.5.29-REAL-SUPABASE-FACEBOOK-HANDOFF.apk" -Force
```

The verification must contain `versionName='1.5.29'`. Install only the explicitly named copy from Downloads. Android will then replace an older EXY build because this release has a higher version code.

## 5. Optional: run the local website (left terminal)

```powershell
Set-Location D:\exy-v1.5.29
npm run dev -- --host 127.0.0.1
```

Open the exact `Local:` address shown by Vite.

## Expected behavior after installation

- Use the same real email account as the website. Do **not** create it again.
- You should no longer see the local-demo message `No account found with that email.` in the APK.
- A Facebook Reel opens Facebook (app first, browser second) rather than displaying an in-app black/translated provider-error screen.
- YouTube remains inline; eligible public Instagram embeds retain their official embedded player.
