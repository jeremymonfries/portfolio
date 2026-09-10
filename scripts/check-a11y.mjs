// Accessibility gate — rebuild-scope.md section 8.
//
// Zero axe-core violations on serious/critical rules, run against the built
// dist/ output. This is the guardrail that would have caught UX-11 (missing
// alt text) and UX-10 (insufficient contrast) before they shipped. Manual
// keyboard/screen-reader passes still matter (axe can't verify those) — see
// rebuild-scope.md section 8 for what's out of scope here.
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');
const PORT = 4173;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

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

function startServer() {
  const server = createServer(async (req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const filePath = join(distDir, urlPath);
    try {
      const info = await stat(filePath);
      if (!info.isFile()) throw new Error('not a file');
      const ext = filePath.slice(filePath.lastIndexOf('.'));
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  return new Promise((resolvePromise) => {
    server.listen(PORT, () => resolvePromise(server));
  });
}

async function main() {
  const htmlFiles = await findHtmlFiles(distDir);
  if (htmlFiles.length === 0) {
    console.error(`No HTML files found in ${distDir} — did you run \`npm run build\` first?`);
    process.exit(1);
  }

  const server = await startServer();
  const browser = await chromium.launch();
  let failed = false;

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    console.log('Accessibility check (axe-core, WCAG 2.1 A/AA)\n');

    for (const htmlFile of htmlFiles.sort()) {
      const routePath = routePathFor(htmlFile);
      await page.goto(`http://localhost:${PORT}${routePath}`, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );

      if (blocking.length === 0) {
        console.log(`  [ok]   ${routePath}`);
        continue;
      }

      failed = true;
      console.log(`  [FAIL] ${routePath}`);
      for (const violation of blocking) {
        console.log(`    - (${violation.impact}) ${violation.id}: ${violation.help}`);
        for (const node of violation.nodes) {
          console.log(`        ${node.target.join(' ')}`);
        }
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (failed) {
    console.error('\nOne or more pages have serious/critical accessibility violations.');
    process.exit(1);
  }
  console.log('\nNo serious/critical accessibility violations.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
