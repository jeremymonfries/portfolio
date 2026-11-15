// House-style gate for case-study copy.
//
// docs/voice.md describes how Jeremy writes. Tone and story shape need
// judgement (see the case-study skill in .claude/skills/case-study/), but
// the mechanical rules can be checked: Australian spelling, a handful of
// grammar slips that crept into the original site, and hype or AI-filler
// words that aren't his voice. Spelling and grammar fail the build; hype
// words only warn, since one may appear inside a quote.
//
// The same rules run in CandidateOS (lib/style.ts) for application pages.
// Keep the two in step when a rule changes.
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const caseStudiesDir = join(__dirname, '../src/content/case-studies');

// -ly words that are not adverbs, so a hyphen after them is fine ("early-stage").
const NOT_ADVERBS =
  'early|family|supply|apply|reply|only|daily|weekly|monthly|yearly|quarterly|friendly|july|italy|holy|ally|rally|bully|assembly|anomaly';
// Stems that take -ise in Australian English: organise, analyse, prioritise…
const US_STEMS =
  'organi|prioriti|optimi|analy|categori|customi|minimi|maximi|recogni|reali|utili|visuali|standardi|personali|summari|emphasi|empathi|digiti|moderni|synthesi|moneti';

const RULES = [
  {
    level: 'error',
    re: new RegExp(`\\b(?:${US_STEMS})z(?:e|es|ed|er|ers|ing|ation|ations)\\b`, 'gi'),
    message: (m) =>
      `US spelling "${m}": use "${m.replace(/z(?=[a-z]*$)/i, (z) => (z === 'Z' ? 'S' : 's'))}"`,
  },
  {
    level: 'error',
    re: /\b(?:color|behavior|favorite|catalog|center|traveling|traveled|modeling|modeled|labeled|labeling|canceled|canceling)s?\b/gi,
    message: (m) => `US spelling "${m}": use the Australian form`,
  },
  {
    level: 'error',
    re: /\b(?:\d+\+?|several|many|two|three|four|five|ten|twenty) years experience\b/gi,
    message: (m) =>
      `"${m}" needs an apostrophe: "${m.replace(/years experience/i, "years' experience")}"`,
  },
  {
    level: 'error',
    re: /\b(?:I've|I have|we've|we have|has|had|having|was|were|been) lead\b(?!\s+(?:designers?|roles?|product|UX|UI|engineers?|developers?|researchers?|on|for|of|in))/gi,
    message: (m) => `"${m}": the past tense of lead is "led"`,
  },
  {
    level: 'error',
    re: new RegExp(`\\b(?!(?:${NOT_ADVERBS})-)[a-z]+ly-[a-z]+`, 'gi'),
    message: (m) => `"${m}": no hyphen after an -ly adverb ("${m.replace('-', ' ')}")`,
  },
  { level: 'error', re: /\bcall[- ]to[- ]actions\b/gi, message: () => 'use "calls to action"' },
  {
    level: 'error',
    re: /\b(?:PDP page|ATM machine|PIN number|UX experience|CX experience)s?\b/g,
    message: (m) => `"${m}" repeats itself`,
  },
  { level: 'error', re: /\bInvision\b/g, message: () => 'write "InVision"' },
  {
    level: 'warning',
    re: /\b(?:revolutionary|game[- ]chang\w*|cutting[- ]edge|unparalleled|world[- ]class|premier|passionate|rock ?star|ninja|synerg\w*|results[- ]driven|proven track record|delve\w*|tapestry|holistic\w*|spearhead\w*|orchestrat\w*|elevat\w*|seasoned)\b/gi,
    message: (m) => `"${m}" is not Jeremy's voice (docs/voice.md, "What to avoid")`,
  },
];

// Lines that aren't prose: imports, JSX/HTML tags, image embeds, MDX comments.
const NOT_PROSE = /^\s*(?:import\s|<|!\[|\{\/\*)/;
// Frontmatter keys that hold prose; everything else (paths, alt text, order) is skipped.
const PROSE_KEYS = /^(title|summary|tldr|skills|\s+label):/;
const URL_RE = /https?:\/\/\S+|\.\.?\/[^\s)'"]+/g;

async function checkFile(file) {
  const lines = (await readFile(join(caseStudiesDir, file), 'utf8')).split('\n');
  const hits = [];
  let delimiters = 0;
  lines.forEach((line, i) => {
    if (line.trim() === '---' && delimiters < 2) {
      delimiters++;
      return;
    }
    const inFrontmatter = delimiters === 1;
    if (inFrontmatter ? !PROSE_KEYS.test(line) : NOT_PROSE.test(line)) return;
    const text = line.replace(URL_RE, ' ');
    for (const rule of RULES)
      for (const m of text.matchAll(rule.re))
        hits.push({ line: i + 1, level: rule.level, message: rule.message(m[0]) });
  });
  return hits;
}

const files = (await readdir(caseStudiesDir)).filter(
  (f) => /\.mdx?$/.test(f) && !f.startsWith('_'),
);
let errors = 0;
let warnings = 0;
for (const file of files.sort()) {
  const hits = await checkFile(file);
  errors += hits.filter((h) => h.level === 'error').length;
  warnings += hits.filter((h) => h.level === 'warning').length;
  console.log(
    `  [${hits.some((h) => h.level === 'error') ? 'FAIL' : 'ok'}]${' '.repeat(hits.some((h) => h.level === 'error') ? 1 : 3)}${file}`,
  );
  for (const h of hits)
    console.log(`         ${h.level === 'error' ? '✗' : '!'} line ${h.line}: ${h.message}`);
}

console.log(
  errors
    ? `\n${errors} house-style error(s) in case studies. See docs/voice.md.`
    : `\nCase studies follow the house style${warnings ? ` (${warnings} voice warning(s) to review)` : ''}.`,
);
if (errors) process.exit(1);
