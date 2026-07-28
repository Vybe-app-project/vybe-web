import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const adminBuildRoot = resolve('build');
const publicBuildRoot = resolve('public-build');
const buildRoots = [adminBuildRoot, publicBuildRoot];
const forbidden = [
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ['private key material', /BEGIN (?:RSA |EC )?PRIVATE KEY/],
  ['browser-side AWS credential config', /S3_(?:ACCESS|SECRET)_KEY/],
  ['legacy Create React App config', /REACT_APP_[A-Z0-9_]+/],
  ['legacy Create React App branding', /Create React App|React App Sample/],
  ['development loopback API URL', /(?:localhost|127\.0\.0\.1)(?::\d+|\/api)/],
  ['legacy five-minute timeout', /\b300000\b/],
  ['direct provider endpoint', /(?:maps\.googleapis\.com|api\.tenor\.com|api\.nal\.usda\.gov)/],
  ['unexpanded public configuration', /__VYBE_[A-Z0-9_]+__/],
  ['legacy email support fallback', /mailto:(?:support|privacy)@vybeapp\.io/i],
  ['public issue tracker support fallback', /github\.com\/Vybe-app-project\/vybe-web\/issues/i],
];

const files = [];
const walk = async (root, directory = root) => {
  for (const entry of await readdir(directory)) {
    const path = join(directory, entry);
    if ((await stat(path)).isDirectory()) await walk(root, path);
    else files.push({ path, root });
  }
};

for (const root of buildRoots) await walk(root);
const findings = [];
const adminSearchableContents = [];
for (const file of files) {
  if (!/\.(?:html|css|js|json|map|txt)$/i.test(file.path)) continue;
  const contents = await readFile(file.path, 'utf8');
  if (file.root === adminBuildRoot) adminSearchableContents.push(contents);
  for (const [label, pattern] of forbidden) {
    if (pattern.test(contents)) {
      findings.push(`${relative(resolve('.'), file.root)}/${relative(file.root, file.path)}: ${label}`);
    }
  }
}

const expectedBasePath = process.env.VITE_BASE_PATH?.trim();
if (expectedBasePath) {
  const indexHtml = await readFile(join(adminBuildRoot, 'index.html'), 'utf8');
  if (!indexHtml.includes(`${expectedBasePath}assets/`)) {
    findings.push(`index.html: assets do not use configured VITE_BASE_PATH ${expectedBasePath}`);
  }
}

const expectedApiUrl = process.env.VITE_API_URL?.trim().replace(/\/+$/, '');
const adminIndexHtml = await readFile(join(adminBuildRoot, 'index.html'), 'utf8');
if (
  !adminIndexHtml.includes('http-equiv="Content-Security-Policy"')
  || !adminIndexHtml.includes("script-src 'self'")
  || !adminIndexHtml.includes('name="referrer" content="no-referrer"')
) {
  findings.push('compiled admin index is missing the release security policy');
}
if (expectedApiUrl && !adminSearchableContents.some((contents) => contents.includes(expectedApiUrl))) {
  findings.push('compiled admin API URL does not match configured VITE_API_URL');
}
if (expectedApiUrl) {
  const supportHtml = await readFile(join(publicBuildRoot, 'support.html'), 'utf8');
  if (!supportHtml.includes(`content="${expectedApiUrl}"`)) {
    findings.push('public-build/support.html does not contain the configured API URL');
  }
  const extensionlessSupportHtml = await readFile(
    join(publicBuildRoot, 'support', 'index.html'),
    'utf8',
  );
  if (
    !extensionlessSupportHtml.includes(`content="${expectedApiUrl}"`)
    || !extensionlessSupportHtml.includes('<base href="../" />')
  ) {
    findings.push('public-build/support/index.html is not configured for the extensionless route');
  }
}

if (findings.length) {
  console.error(`Release build verification failed:\n${findings.join('\n')}`);
  process.exit(1);
}
console.log(`Release build verification passed (${files.length} files checked).`);
