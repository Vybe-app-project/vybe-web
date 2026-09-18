# Vybe web (retired Pages site)

This repository no longer contains an application. It publishes a set of
static redirect pages to GitHub Pages so that every URL ever handed out at
`https://vybe-app-project.github.io/vybe-web/` forwards to the live product.

The React admin console, the copies of the legal pages and the support form
that used to live here were removed on 2026-09-17. They were compiled against
an API host that does not exist, so the site looked functional while nothing
on it worked, and the admin sign-in form was a credential-harvesting risk. The
old code remains in git history before that date.

## Where things moved

`LIVE_ORIGIN` is currently `https://vybe.149.56.18.195.sslip.io` (an interim
hostname; it will become the product domain later).

| Old Pages path | Now |
| --- | --- |
| `/`, `/open.html`, anything unknown (`404.html`) | `LIVE_ORIGIN/` |
| `/admin/` and `/admin/{home,admins,users,workouts,reports,support,settings,audit-log,reset-password}/` | `LIVE_ORIGIN/admin/login` |
| `/forgot-password/` | `LIVE_ORIGIN/forgot-password` |
| `/privacy-policy.html`, `/terms-and-conditions.html`, `/account-deletion.html` | same file name on `LIVE_ORIGIN` |
| `/support.html`, `/support/` | `LIVE_ORIGIN/support` |

The mobile app still builds its share links as `…/open.html?type=…&id=…` on
this origin. A static page cannot forward a query string, so those links land
on the app's front page until the mobile `WEB_BASE_URL` is repointed at the
live site and that site learns to handle them.

## Changing the live origin

Edit the single `LIVE_ORIGIN` constant at the top of
`scripts/build-redirect-site.mjs`, run `npm test`, and commit. The Pages
workflow rebuilds and redeploys from `main`. The value must be a bare HTTPS
origin (no path, query or trailing slash); the generator refuses anything
else, because a wrong origin would send every visitor to the wrong place.

## How it works

`npm run build` writes `site/`: one HTML file per old path, each carrying a
`<meta http-equiv="refresh">` redirect, a `<link rel="canonical">` to the new
address, `noindex`, and a visible fallback link, in the product's mint-on-navy
style with no scripts. `.github/workflows/pages.yml` runs the tests and the
generator on every push to `main` and uploads `site/`.

## Checks

```sh
npm ci          # installs nothing; the repository has no dependencies
npm test        # supply-chain scan, then the node:test suite
npm run build   # generates site/
npm run lint    # syntax-checks the scripts
```

`scripts/scan-injected-code.mjs`, `.githooks/pre-commit` and
`.github/workflows/supply-chain.yml` are unchanged; see `SECURITY.md`.
