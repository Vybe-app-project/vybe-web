import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourceFiles = [
  'public-site-index.html',
  'privacy-policy.html',
  'terms-and-conditions.html',
  'account-deletion.html',
  'open.html',
  'support.html',
  'support-client.js',
  'support-bootstrap.js',
];
const outputNames = new Map([['public-site-index.html', 'index.html']]);
const outputRoot = resolve('public-build');

const configuredApiUrl = process.env.VITE_API_URL?.trim();
if (!configuredApiUrl) throw new Error('VITE_API_URL is required to build the public site');

const parsedApiUrl = new URL(configuredApiUrl);
if (
  parsedApiUrl.protocol !== 'https:'
  || parsedApiUrl.username
  || parsedApiUrl.password
  || parsedApiUrl.search
  || parsedApiUrl.hash
  || parsedApiUrl.pathname.replace(/\/+$/, '') !== '/api'
) {
  throw new Error('VITE_API_URL must be an HTTPS origin ending in /api without credentials, query, or hash');
}
const normalizedApiUrl = parsedApiUrl.toString().replace(/\/+$/, '');
const escapeHtmlAttribute = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll("'", '&#39;');
const escapedApiUrl = escapeHtmlAttribute(normalizedApiUrl);
const escapedApiOrigin = escapeHtmlAttribute(parsedApiUrl.origin);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

let builtSupportHtml = '';
for (const source of sourceFiles) {
  let contents = await readFile(resolve(source), 'utf8');
  if (source === 'support.html') {
    const placeholder = '__VYBE_API_BASE_URL__';
    if (!contents.includes(placeholder)) {
      throw new Error('support.html is missing its API configuration placeholder');
    }
    contents = contents.replaceAll(placeholder, escapedApiUrl);
    contents = contents.replaceAll('__VYBE_API_ORIGIN__', escapedApiOrigin);
    builtSupportHtml = contents;
  }
  await writeFile(resolve(outputRoot, outputNames.get(source) || source), contents);
}

const supportRouteRoot = resolve(outputRoot, 'support');
await mkdir(supportRouteRoot, { recursive: true });
await writeFile(
  resolve(supportRouteRoot, 'index.html'),
  builtSupportHtml.replace(
    '    <title>Contact Vybe Support</title>',
    '    <base href="../" />\n    <title>Contact Vybe Support</title>',
  ),
);

console.log(`Public site build passed (${sourceFiles.length + 1} files generated).`);
