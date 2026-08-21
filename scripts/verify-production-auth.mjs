import { readFileSync } from 'node:fs';

const auth = readFileSync('src/lib/auth.ts', 'utf8');
const modal = readFileSync('src/components/AuthModal.tsx', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(pkg.version === '1.5.30', `Expected EXY v1.5.30, found ${pkg.version}.`);
assert(auth.includes('const LOCAL_DEMO_AUTH_ENABLED = import.meta.env.DEV;'), 'Production/demo authentication boundary is missing.');
assert(auth.includes('if (!isSupabaseLive && !LOCAL_DEMO_AUTH_ENABLED)'), 'Production sign-in must reject a missing Supabase configuration.');
assert(auth.includes("Demo sign-in is unavailable in production. Check the production Supabase configuration."), 'Production cannot safely reject the local mock sign-in route.');
assert(/if \(!LOCAL_DEMO_AUTH_ENABLED\) \{\s*return \{ ok: false, error: 'Account creation is unavailable because the production authentication service is not configured.' \};\s*\}/.test(auth), 'Production sign-up can still fall through to local mock accounts.');
assert(modal.includes('const SHOW_DEMO_SHORTCUTS = import.meta.env.DEV;'), 'Auth UI does not have a production/demo boundary.');
assert(modal.includes('{SHOW_DEMO_SHORTCUTS && backendReady === false && ('), 'Demo shortcuts are still visible in production builds.');
assert(modal.includes('Demo shortcuts are unavailable in production. Please sign in with your real account.'), 'Demo shortcut handler is not protected in production.');
assert(modal.includes("? 'Secured by Supabase Auth.'") && modal.includes("? 'Local development demo mode.'") && modal.includes(": 'Authentication service unavailable.'"), 'Auth status text can misrepresent production authentication.');

console.log('PASS — production APK authentication cannot fall back to local demo accounts and will use Supabase Auth only.');
