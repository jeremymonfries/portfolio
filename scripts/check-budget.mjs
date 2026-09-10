// Page-weight budget gate — rebuild-scope.md section 7/8.
//
// Baseline: the original case-study page measured 6.97MB / 10.7s unthrottled
// (audit finding UX-07). Budget: case-study pages must stay under 1.5MB
// transferred weight; everything else (home/about-style pages, no gallery)
// under 500KB. Run after `astro build` — walks dist/, sums each route's HTML
// plus every local asset it references, and fails the build if any route is
// over budget so a future case study can't silently reintroduce a
// multi-megabyte source image.
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');

const KB = 1024;
const MB = 1024 * KB;

/** @type {{ test: (routePath: string) => boolean, budget: number, label: string }[]} */
const BUDGETS = [
  { test: (p) => p.startsWith('/projects/'), budget: 1.5 * MB, label: 'case study' },
  { test: () => true, budget: 500 * KB, label: 'default' },
];

function budgetFor(routePath) {
  return BUDGETS.find((b) => b.test(routePath));
}

async function findHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findHtmlFiles(full)));
    } else if (entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

function routePathFor(htmlFile) {
  const rel = htmlFile.slice(distDir.length).replace(/\\/g, '/');
  return rel.replace(/index\.html$/, '') || '/';
}

function extractLocalAssetPaths(html) {
  const paths = new Set();
  const attrPattern = /(?:src|href)="([^"]+)"/g;
  let match;
  while ((match = attrPattern.exec(html))) {
    const value = match[1];
    if (!value.startsWith('/') || value.startsWith('//')) continue; // skip external/protocol-relative
    const [pathOnly] = value.split('#');
    if (pathOnly.endsWith('.html') || pathOnly === '/') continue; // don't follow page links
    paths.add(pathOnly.split('?')[0]);
  }
  return [...paths];
}

async function pageWeight(htmlFile) {
  const html = await readFile(htmlFile, 'utf8');
  let total = Buffer.byteLength(html, 'utf8');
  const assets = extractLocalAssetPaths(html);
  for (const assetPath of assets) {
    const assetFile = join(distDir, assetPath);
    try {
      const info = await stat(assetFile);
      if (info.isFile()) total += info.size;
    } catch {
      // Asset referenced but not found under dist/ (e.g. an external CDN
      // path that happens to start with "/") — skip rather than fail here;
      // a missing local asset would already break the page at runtime.
    }
  }
  return total;
}

function formatBytes(bytes) {
  if (bytes >= MB) return `${(bytes / MB).toFixed(2)}MB`;
  return `${(bytes / KB).toFixed(1)}KB`;
}

async function main() {
  const htmlFiles = await findHtmlFiles(distDir);
  if (htmlFiles.length === 0) {
    console.error(`No HTML files found in ${distDir} — did you run \`npm run build\` first?`);
    process.exit(1);
  }

  let failed = false;
  console.log('Page-weight budget check\n');
  for (const htmlFile of htmlFiles.sort()) {
    const routePath = routePathFor(htmlFile);
    const { budget, label } = budgetFor(routePath);
    const weight = await pageWeight(htmlFile);
    const over = weight > budget;
    if (over) failed = true;
    const status = over ? 'FAIL' : 'ok';
    console.log(
      `  [${status}] ${routePath}  ${formatBytes(weight)} / ${formatBytes(budget)} budget (${label})`,
    );
  }

  if (failed) {
    console.error('\nOne or more pages exceed their weight budget. See rebuild-scope.md section 7.');
    process.exit(1);
  }
  console.log('\nAll pages within budget.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
