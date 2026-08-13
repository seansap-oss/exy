# EXY v1.5.26 — Android test build

This release repairs the social-video player viewport. It does not alter the
approved header, footer, taxonomy, admin panel, or database schema.

## Build on Windows

Run these commands from `D:\exy` after extracting this release. Keep your
existing `.env.local`: it contains the production Supabase values and is not
included in the ZIP.

```powershell
npm install
npm run verify:social-player
npm run android:prepare
Set-Location D:\exy\android
.\gradlew.bat clean assembleDebug
```

## Verify before installing

```powershell
$apk = 'D:\exy\android\app\build\outputs\apk\debug\app-debug.apk'
$aapt = Get-ChildItem "$env:LOCALAPPDATA\Android\Sdk\build-tools" -Filter aapt.exe -Recurse |
  Sort-Object FullName -Descending | Select-Object -First 1
& $aapt.FullName dump badging $apk | Select-String 'package:'
Copy-Item $apk "$env:USERPROFILE\Downloads\EXY-v1.5.26-social-player-repair.apk" -Force
```

The command must report `versionName='1.5.26'`. Install only the named APK in
Downloads, not a previous generic `app-debug.apk` copy.
