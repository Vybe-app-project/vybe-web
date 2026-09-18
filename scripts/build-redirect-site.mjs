#!/usr/bin/env node
/**
 * Builds the static redirect site that replaced this repository's GitHub
 * Pages deployment.
 *
 * The Pages site used to publish a React admin console compiled against an
 * API host that no longer exists, plus copies of the legal pages and a
 * support form that posted to the same dead host. Everything looked
 * functional and nothing worked; the console's sign-in form in particular was
 * a credential-harvesting risk. The product now lives on LIVE_ORIGIN, so
 * every URL the old site ever published is turned into an instant redirect to
 * its new home. The old code stays in git history before 2026-09-17.
 *
 * Every destination is derived from LIVE_ORIGIN so that moving the product to
 * its permanent domain is a one-line change here, followed by `npm test`.
 *
 * Usage:
 *   node scripts/build-redirect-site.mjs             # writes ./site
 *   node scripts/build-redirect-site.mjs <out-dir>   # writes somewhere else
 *
 * The generated pages contain no scripts: a <meta http-equiv="refresh">
 * performs the redirect, a canonical link and a noindex hint hand the old
 * URLs' search ranking to the live site, and a visible link is the fallback
 * for clients that ignore meta refresh.
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, parse, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';

/** Where the product lives. Change ONLY this line when the domain moves. */
export const LIVE_ORIGIN = 'https://vybeapp.fit';

/** Output directory when none is given on the command line. */
export const DEFAULT_OUTPUT_DIR = 'site';

/**
 * Routes the retired admin console registered beneath /admin/. The old Pages
 * workflow published an index.html for each so that a reload on a deep link
 * did not 404; each now forwards to the live console's sign-in page.
 */
export const LEGACY_ADMIN_ROUTES = [
  'home',
  'admins',
  'users',
  'workouts',
  'reports',
  'support',
  'settings',
  'audit-log',
  'reset-password',
];

/** Places on LIVE_ORIGIN that old URLs forward to, with the copy shown while the redirect fires. */
export const DESTINATIONS = {
  app: { path: '/', heading: 'Vybe has moved', cta: 'Continue to Vybe' },
  admin: { path: '/admin/login', heading: 'The admin console has moved', cta: 'Continue to the admin console' },
  reset: { path: '/forgot-password', heading: 'Password reset has moved', cta: 'Continue to password reset' },
  privacy: { path: '/privacy-policy.html', heading: 'The privacy policy has moved', cta: 'Continue to the privacy policy' },
  terms: { path: '/terms-and-conditions.html', heading: 'The terms have moved', cta: 'Continue to the terms and conditions' },
  deletion: { path: '/account-deletion.html', heading: 'Account deletion has moved', cta: 'Continue to account deletion' },
  support: { path: '/support', heading: 'Support has moved', cta: 'Continue to support' },
  share: { path: '/open.html', heading: 'This shared link has moved', cta: 'Continue to what was shared' },
};

/**
 * Every file the site publishes, as [path relative to the output directory,
 * DESTINATIONS key]. The paths mirror what the old deployment served so that
 * no URL that was ever handed out breaks.
 */
export const PAGES = [
  ['index.html', 'app'],
  // GitHub Pages serves this body (with a 404 status) for any path not listed here.
  ['404.html', 'app'],
  // The mobile app's share links point at open.html?type=...&id=... . The live
  // app answers the same path, so this one page forwards its query string with
  // a hash-allowed one-line script (see renderPage); meta refresh cannot.
  ['open.html', 'share'],
  ['admin/index.html', 'admin'],
  ...LEGACY_ADMIN_ROUTES.map((route) => [`admin/${route}/index.html`, 'admin']),
  // The mobile app builds its "forgot password" link on the old web origin.
  ['forgot-password/index.html', 'reset'],
  ['privacy-policy.html', 'privacy'],
  ['terms-and-conditions.html', 'terms'],
  ['account-deletion.html', 'deletion'],
  ['support.html', 'support'],
  // The mobile app links to the extensionless support route.
  ['support/index.html', 'support'],
];

/**
 * A wrong origin is worse than a broken page, because every visitor is sent
 * there. Insist on a bare HTTPS origin so a stray path, query, fragment or
 * trailing slash cannot double up inside the generated URLs.
 */
export function assertLiveOrigin(origin) {
  let url;
  try {
    url = new URL(origin);
  } catch {
    throw new Error(`LIVE_ORIGIN is not a valid URL: ${JSON.stringify(origin)}`);
  }
  if (url.protocol !== 'https:') {
    throw new Error(`LIVE_ORIGIN must use https, got ${url.protocol}`);
  }
  if (url.username || url.password) {
    throw new Error('LIVE_ORIGIN must not contain credentials');
  }
  if (url.origin !== origin) {
    throw new Error(
      `LIVE_ORIGIN must be a bare origin without path, query, fragment or trailing slash; `
      + `got ${origin}, expected ${url.origin}`,
    );
  }
  return url;
}

/**
 * The build empties its output directory first, so make sure that directory
 * can never be the working tree, one of its ancestors, or the filesystem
 * root. Both arguments must be absolute paths.
 */
export function assertSafeOutputDir(root, cwd = process.cwd()) {
  const isFilesystemRoot = root === parse(root).root;
  const containsCwd = root === cwd || cwd.startsWith(root.endsWith(sep) ? root : root + sep);
  if (isFilesystemRoot || containsCwd) {
    throw new Error(`Refusing to empty ${root}: it is the working directory or contains it`);
  }
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

/*
 * Visual language: the product's "Deep Water" tokens (mint on navy, with a
 * mint-tinted off-white light theme) reduced to what a one-card page needs.
 * Values are copied from the live app's stylesheet rather than invented, so
 * the interstitial reads as the same product the visitor is about to land on.
 */
const STYLE = `
      :root {
        color-scheme: light dark;
        --bg: #f6f9f8;
        --surface: #ffffff;
        --line: #dce5e1;
        --text-1: #0b1e2b;
        --text-2: #4b6470;
        --brand: #00b08e;
        --brand-hover: #008a71;
        --on-brand: #04101b;
        --focus: #00b08e;
        --shadow: 0 8px 24px -12px rgba(11, 30, 43, 0.16);
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #04101b;
          --surface: #071a2a;
          --line: rgba(255, 255, 255, 0.08);
          --text-1: #f2f7f5;
          --text-2: #a9bcc6;
          --brand: #00d4aa;
          --brand-hover: #1de5b6;
          --focus: #1de5b6;
          --shadow: 0 8px 24px -12px rgba(0, 0, 0, 0.7);
        }
      }
      * { box-sizing: border-box; }
      body {
        display: grid;
        min-height: 100vh;
        margin: 0;
        padding: 24px;
        place-items: center;
        background: var(--bg);
        color: var(--text-1);
        font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      main {
        width: min(100%, 420px);
        padding: 32px 28px;
        border: 1px solid var(--line);
        border-radius: 20px;
        background: var(--surface);
        box-shadow: var(--shadow);
        text-align: center;
      }
      .mark {
        display: block;
        width: 48px;
        height: 48px;
        margin: 0 auto 16px;
        color: var(--brand);
      }
      h1 {
        margin: 0 0 8px;
        font-size: 1.5rem;
        line-height: 1.25;
        letter-spacing: -0.02em;
        text-wrap: balance;
      }
      p {
        margin: 0 0 20px;
        color: var(--text-2);
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: min(220px, 100%);
        min-height: 44px;
        padding: 10px 20px;
        border-radius: 10px;
        background: var(--brand);
        color: var(--on-brand);
        font-weight: 700;
        text-decoration: none;
      }
      .button:hover { background: var(--brand-hover); }
      .button:focus-visible {
        outline: 3px solid var(--focus);
        outline-offset: 2px;
      }
      .destination {
        margin: 16px 0 0;
        font-size: 0.8125rem;
        overflow-wrap: anywhere;
      }
`;

/** The Vybe mark (two figures whose raised arms form the V), drawn in currentColor. */
const MARK = `
      <svg class="mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="6.3" cy="4.9" r="1.9" fill="currentColor" />
        <circle cx="17.7" cy="4.9" r="1.9" fill="currentColor" />
        <path d="M3.9 9.2 12 20.6l8.1-11.4" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M9.1 16.5 12 9.1l2.9 7.4" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>`;

/** Same favicon the live app ships, so the tab looks identical before and after the hop. */
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
  <rect width="24" height="24" rx="5.5" fill="#04101B"/>
  <g transform="translate(12 12) scale(0.82) translate(-12 -12)">
    <circle cx="6.3" cy="4.9" r="1.9" fill="#00D4AA"/>
    <circle cx="17.7" cy="4.9" r="1.9" fill="#00D4AA"/>
    <path d="M 3.9 9.2 L 12 20.6 L 20.1 9.2" fill="none" stroke="#00D4AA" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 9.1 16.5 L 12 9.1 L 14.9 16.5" fill="none" stroke="#00D4AA" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;

/* Crawlers must be able to fetch these pages to see the noindex and canonical
 * hints that hand the old URLs' ranking to the live site, so nothing is
 * disallowed. */
const ROBOTS = `User-agent: *
Allow: /
`;

/**
 * Renders one redirect page.
 *
 * @param {string} file             path relative to the output directory, e.g. "admin/users/index.html"
 * @param {keyof DESTINATIONS} key  which place on LIVE_ORIGIN the page forwards to
 * @param {string} origin           the live origin; defaults to LIVE_ORIGIN
 */
export function renderPage(file, key, origin = LIVE_ORIGIN) {
  const destination = DESTINATIONS[key];
  if (!destination) {
    throw new Error(`Unknown destination ${JSON.stringify(key)} for ${file}`);
  }
  assertLiveOrigin(origin);
  const target = escapeHtml(`${origin}${destination.path}`);
  // open.html is the only page whose query string matters (type + id of the
  // shared content). A meta refresh drops it, so that page alone carries a
  // one-line forwarder, allowed by CSP hash rather than 'unsafe-inline'.
  const forwarder = file === 'open.html'
    ? `location.replace(${JSON.stringify(`${origin}${destination.path}`)} + location.search + location.hash);`
    : null;
  const scriptPolicy = forwarder
    ? ` script-src 'sha256-${createHash('sha256').update(forwarder).digest('base64')}';`
    : '';
  // Nested pages reach the shared favicon relatively, so the site works under
  // any Pages project path (/vybe-web/ today) or a root custom domain later.
  const depth = file.split('/').length - 1;
  const assetPrefix = '../'.repeat(depth);
  const title = destination.heading === 'Vybe has moved'
    ? destination.heading
    : `${destination.heading} · Vybe`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="0; url=${target}">${forwarder ? `
    <script>${forwarder}</script>` : ''}
    <link rel="canonical" href="${target}">
    <meta name="robots" content="noindex">
    <meta name="referrer" content="no-referrer">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none';${scriptPolicy} style-src 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'">
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f6f9f8">
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#04101b">
    <link rel="icon" type="image/svg+xml" href="${assetPrefix}favicon.svg">
    <title>${escapeHtml(title)}</title>
    <style>${STYLE}    </style>
  </head>
  <body>
    <main>${MARK}
      <h1>${escapeHtml(destination.heading)}</h1>
      <p>This address is no longer in use. You’re being sent to the new Vybe site.</p>
      <a class="button" href="${target}">${escapeHtml(destination.cta)}</a>
      <p class="destination">Destination: ${target}</p>
    </main>
  </body>
</html>
`;
}

/**
 * Writes the whole site into outputDir, replacing whatever was there so a
 * page removed from PAGES cannot linger into the next deploy.
 *
 * @returns {Promise<string[]>} the files written, relative to outputDir
 */
export async function buildSite(outputDir = DEFAULT_OUTPUT_DIR, origin = LIVE_ORIGIN) {
  assertLiveOrigin(origin);
  const root = resolve(outputDir);
  assertSafeOutputDir(root, process.cwd());

  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });

  const written = [];
  for (const [file, key] of PAGES) {
    const path = join(root, file);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, renderPage(file, key, origin));
    written.push(file);
  }
  await writeFile(join(root, 'favicon.svg'), FAVICON);
  await writeFile(join(root, 'robots.txt'), ROBOTS);
  written.push('favicon.svg', 'robots.txt');
  return written;
}

// Compare real paths: npm and some shells hand over a relative or symlinked
// argv[1], and a plain string comparison would silently skip the build.
const realPath = (p) => {
  try {
    return realpathSync(p);
  } catch {
    return resolve(p);
  }
};
const invokedDirectly = Boolean(process.argv[1])
  && realPath(new URL(import.meta.url).pathname) === realPath(process.argv[1]);

if (invokedDirectly) {
  const outputDir = process.argv[2] ?? DEFAULT_OUTPUT_DIR;
  const written = await buildSite(outputDir, LIVE_ORIGIN);
  console.log(`Redirect site built: ${written.length} files in ${outputDir}/ -> ${LIVE_ORIGIN}`);
}
