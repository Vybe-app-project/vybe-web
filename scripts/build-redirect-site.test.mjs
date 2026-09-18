import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

import {
  DESTINATIONS,
  LIVE_ORIGIN,
  PAGES,
  assertLiveOrigin,
  assertSafeOutputDir,
  buildSite,
  renderPage,
} from './build-redirect-site.mjs';

/**
 * Every URL the retired Pages site published, and the path on LIVE_ORIGIN it
 * must forward to. Spelled out rather than derived from PAGES so that
 * dropping a page from the generator fails here instead of quietly 404-ing a
 * link that the mobile app, an app-store listing or a search result still
 * uses.
 */
const EXPECTED = new Map([
  ['index.html', '/'],
  ['404.html', '/'],
  ['open.html', '/open.html'],
  ['admin/index.html', '/admin/login'],
  ...['home', 'admins', 'users', 'workouts', 'reports', 'support', 'settings', 'audit-log', 'reset-password']
    .map((route) => [`admin/${route}/index.html`, '/admin/login']),
  ['forgot-password/index.html', '/forgot-password'],
  ['privacy-policy.html', '/privacy-policy.html'],
  ['terms-and-conditions.html', '/terms-and-conditions.html'],
  ['account-deletion.html', '/account-deletion.html'],
  ['support.html', '/support'],
  ['support/index.html', '/support'],
]);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('LIVE_ORIGIN', () => {
  it('is a bare https origin', () => {
    assert.doesNotThrow(() => assertLiveOrigin(LIVE_ORIGIN));
    assert.equal(new URL(LIVE_ORIGIN).origin, LIVE_ORIGIN);
  });

  it('rejects values that would corrupt every generated URL', () => {
    const bad = [
      'http://vybe.example',
      'https://vybe.example/',
      'https://vybe.example/app',
      'https://vybe.example?utm=1',
      'https://vybe.example#top',
      'https://user:secret@vybe.example',
      'vybe.example',
      '',
    ];
    for (const value of bad) {
      assert.throws(() => assertLiveOrigin(value), undefined, `accepted ${JSON.stringify(value)}`);
    }
  });
});

describe('PAGES', () => {
  it('publishes exactly the URLs of the retired site', () => {
    const actual = PAGES.map(([file, key]) => [file, DESTINATIONS[key].path]).sort();
    assert.deepEqual(actual, [...EXPECTED.entries()].sort());
  });

  it('uses plain relative file paths and absolute destination paths', () => {
    for (const [file, key] of PAGES) {
      assert.match(file, /^[a-z0-9-]+(?:\/[a-z0-9-]+)*\.html$/, file);
      assert.ok(DESTINATIONS[key].path.startsWith('/'), `${key} must be an absolute path`);
    }
  });
});

describe('renderPage', () => {
  it('refuses an unknown destination', () => {
    assert.throws(() => renderPage('x.html', 'nowhere'), /Unknown destination/);
  });

  it('refuses a bad origin', () => {
    assert.throws(() => renderPage('index.html', 'app', 'http://vybe.example'));
  });

  it('reaches the shared favicon relatively from nested pages', () => {
    assert.match(renderPage('index.html', 'app'), /href="favicon\.svg"/);
    assert.match(renderPage('support/index.html', 'support'), /href="\.\.\/favicon\.svg"/);
    assert.match(renderPage('admin/users/index.html', 'admin'), /href="\.\.\/\.\.\/favicon\.svg"/);
  });

  it('escapes what it interpolates', () => {
    // The origin validator rejects quotes, so exercise the escaper through the
    // copy instead: a heading with markup must not become markup.
    DESTINATIONS.__probe = { path: '/', heading: 'a <b> & "c"', cta: "d'e" };
    try {
      const html = renderPage('probe.html', '__probe');
      assert.ok(html.includes('<h1>a &lt;b&gt; &amp; &quot;c&quot;</h1>'));
      assert.ok(html.includes('>d&#39;e</a>'));
    } finally {
      delete DESTINATIONS.__probe;
    }
  });
});

describe('assertSafeOutputDir', () => {
  it('refuses the working directory, its ancestors and the filesystem root', () => {
    assert.throws(() => assertSafeOutputDir('/repo', '/repo'));
    assert.throws(() => assertSafeOutputDir('/repo', '/repo/site'));
    assert.throws(() => assertSafeOutputDir('/', '/repo'));
  });

  it('allows a sibling or a child directory', () => {
    assert.doesNotThrow(() => assertSafeOutputDir('/repo/site', '/repo'));
    assert.doesNotThrow(() => assertSafeOutputDir('/repo-other', '/repo'));
    assert.doesNotThrow(() => assertSafeOutputDir('/tmp/out', '/repo'));
  });
});

describe('buildSite', () => {
  let out;

  before(async () => {
    out = await mkdtemp(join(tmpdir(), 'vybe-redirect-site-'));
    await writeFile(join(out, 'stale.html'), 'left over from an earlier build');
    await buildSite(out, LIVE_ORIGIN);
  });

  after(async () => {
    await rm(out, { recursive: true, force: true });
  });

  it('removes files from a previous build', async () => {
    await assert.rejects(stat(join(out, 'stale.html')));
  });

  it('writes the shared favicon and an allow-all robots.txt', async () => {
    const favicon = await readFile(join(out, 'favicon.svg'), 'utf8');
    assert.ok(favicon.startsWith('<svg'));
    const robots = await readFile(join(out, 'robots.txt'), 'utf8');
    assert.match(robots, /^User-agent: \*\nAllow: \/\n$/);
  });

  for (const [file, path] of EXPECTED) {
    const target = `${LIVE_ORIGIN}${path}`;

    it(`${file} redirects to ${target}`, async () => {
      const html = await readFile(join(out, file), 'utf8');

      assert.ok(html.includes(`<meta http-equiv="refresh" content="0; url=${target}">`), 'meta refresh');
      assert.ok(html.includes(`<link rel="canonical" href="${target}">`), 'canonical');
      assert.ok(html.includes('<meta name="robots" content="noindex">'), 'noindex');
      assert.match(
        html,
        new RegExp(`<a class="button" href="${escapeRegExp(target)}">[^<]+</a>`),
        'visible fallback link',
      );
      if (file === 'open.html') {
        // The one page that forwards its query string: a single hash-allowed script.
        const script = html.match(/<script>([^<]+)<\/script>/);
        assert.ok(script, 'open.html carries the forwarder');
        assert.ok(script[1].includes(`${target}" + location.search`), 'forwarder keeps the query string');
        const hash = createHash('sha256').update(script[1]).digest('base64');
        assert.ok(html.includes(`script-src 'sha256-${hash}'`), 'CSP allows exactly that script');
        assert.strictEqual((html.match(/<script/gi) ?? []).length, 1, 'exactly one script');
      } else {
        assert.doesNotMatch(html, /<script/i, 'no scripts');
      }

      const absoluteUrls = html.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
      assert.ok(absoluteUrls.length >= 3, 'refresh, canonical and link all carry the target');
      for (const url of absoluteUrls) {
        assert.ok(url.startsWith(`${LIVE_ORIGIN}/`) || url === LIVE_ORIGIN, `${file} links off-site: ${url}`);
      }
    });
  }
});
