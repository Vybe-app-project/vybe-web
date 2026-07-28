# Vybe web

Vybe's public legal pages, shared-content handoff, and authenticated admin console.

## Local development

Requirements: Node 20.19 or newer and a running Vybe API.

1. Copy `.env.example` to `.env.local`, set `VITE_API_URL` to the API origin
   including `/api`, and keep `VITE_BASE_PATH=/admin/` unless the site is hosted
   beneath a repository subpath.
2. Run `npm ci`.
3. Run `npm start`.
4. Open the `/admin/` route shown by Vite.

The admin console never receives cloud-provider credentials. Media uploads use a
short-lived destination returned by the authenticated `/upload/presign` API.
The public support form is generated from `support.html` with the validated
`VITE_API_URL`; it posts directly to `/support/message` without storing a
visitor's request in the browser. Administrators review those requests in the
authenticated `/admin/support` inbox.

## Release checks

```sh
npm audit --audit-level=high
npm test
npm run build
npm run build:public
npm run verify:build
```

Production builds require an HTTPS `VITE_API_URL`. `VITE_BASE_PATH` makes asset
and application routes follow the hosting path instead of assuming a root-domain
deployment. The Pages deployment combines the generated admin console with the
version-controlled privacy, terms, account-deletion, shared-content, and private
support pages. It publishes support at both `support.html` and the extensionless
`support` route used by the mobile app.
