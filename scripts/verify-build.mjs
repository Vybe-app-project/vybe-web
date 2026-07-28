import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const buildRoot = resolve('build');
const forbidden = [
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ['private key material', /BEGIN (?:RSA |EC )?PRIVATE KEY/],
  ['browser-side AWS credential config', /S3_(?:ACCESS|SECRET)_KEY/],
  ['legacy Create React App config', /REACT_APP_[A-Z0-9_]+/],
  ['development loopback API URL', /(?:localhost|127\.0\.0\.1)(?::\d+|\/api)/],
  ['legacy five-minute timeout', /\b300000\b/],
  ['direct provider endpoint', /(?:maps\.googleapis\.com|api\.tenor\.com|api\.nal\.usda\.gov)/],
];

const files = [];
const walk = async (directory) => {
  for (const entry of await readdir(directory)) {
    const path = join(directory, entry);
    if ((await stat(path)).isDirectory()) await walk(path);
    else files.push(path);
  }
};

await walk(buildRoot);
const findings = [];
const searchableContents = [];
for (const file of files) {
  if (!/\.(?:html|css|js|json|map|txt)$/i.test(file)) continue;
  const contents = await readFile(file, 'utf8');
  searchableContents.push(contents);
  for (const [label, pattern] of forbidden) {
    if (pattern.test(contents)) findings.push(`${relative(buildRoot, file)}: ${label}`);
  }
}

const expectedBasePath = process.env.VITE_BASE_PATH?.trim();
if (expectedBasePath) {
  const indexHtml = await readFile(join(buildRoot, 'index.html'), 'utf8');
  if (!indexHtml.includes(`${expectedBasePath}assets/`)) {
    findings.push(`index.html: assets do not use configured VITE_BASE_PATH ${expectedBasePath}`);
  }
}

const expectedApiUrl = process.env.VITE_API_URL?.trim().replace(/\/+$/, '');
if (expectedApiUrl && !searchableContents.some((contents) => contents.includes(expectedApiUrl))) {
  findings.push('compiled API URL does not match configured VITE_API_URL');
}

if (findings.length) {
  console.error(`Release build verification failed:\n${findings.join('\n')}`);
  process.exit(1);
}
console.log(`Release build verification passed (${files.length} files checked).`);
