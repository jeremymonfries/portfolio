// Heading-consistency gate.
//
// torque-drift and microsite drifted onto the wrong heading level (h2
// where every other case study used h3, and vice versa) because raw
// markdown headings (##/###) are easy to miscount and don't self-document
// intent - see SectionHeading.astro. Fixing those two files doesn't stop
// the same mistake happening again next time a case study is written or
// edited, so this scans every case-study .mdx source for a raw heading
// (markdown ATX or literal <h1>-<h6>) and fails the build if it finds
// one outside the frontmatter block - SectionHeading is meant to be the
// only way to write a heading in case-study body content.
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const caseStudiesDir = join(__dirname, '../src/content/case-studies');

const MARKDOWN_HEADING = /^#{1,6}\s/;
const HTML_HEADING = /<h[1-6][\s/>]/i;

async function checkFile(file) {
  const path = join(caseStudiesDir, file);
  const content = await readFile(path, 'utf8');
  const lines = content.split('\n');

  const violations = [];
  let frontmatterDelimiters = 0;
  let inFrontmatter = false;

  lines.forEach((line, i) => {
    if (line.trim() === '---') {
      frontmatterDelimiters++;
      inFrontmatter = frontmatterDelimiters === 1;
      return;
    }
    if (inFrontmatter) return;
    if (MARKDOWN_HEADING.test(line) || HTML_HEADING.test(line)) {
      violations.push({ line: i + 1, text: line.trim() });
    }
  });

  return violations;
}

async function main() {
  const files = (await readdir(caseStudiesDir)).filter((f) => f.endsWith('.mdx'));
  let failed = false;

  console.log('Heading consistency check\n');
  for (const file of files.sort()) {
    const violations = await checkFile(file);
    if (violations.length === 0) {
      console.log(`  [ok]   ${file}`);
      continue;
    }
    failed = true;
    console.log(`  [FAIL] ${file}`);
    for (const v of violations) {
      console.log(`           ${file}:${v.line}  ${v.text}`);
    }
  }

  if (failed) {
    console.error(
      '\nRaw headings found. Use <SectionHeading level="chapter" | "section" | "tagline"> instead.',
    );
    process.exit(1);
  }
  console.log('\nAll case studies use SectionHeading for headings.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
