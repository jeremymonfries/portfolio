import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// UX-11: axe-core found images with the `alt` attribute missing entirely on
// the live site. Making `alt` a required, non-empty field here makes that
// defect unrepresentable for the hero image - a missing alt fails the
// build, not the accessibility scan. Body-content images (embedded via
// markdown ![]() syntax, directly beside the paragraph they illustrate -
// or grouped via <ImageGrid> for what were originally multi-column photo
// grids, both in .mdx) aren't covered by this schema, but every alt is
// hand-written and `npm run check:a11y` (axe-core) still catches a
// missing/empty one at build-verification time.
//
// UX-07: the original site shipped a 6.97MB case-study page from raw source
// images. Using the `image()` helper (rather than a plain string path)
// routes the hero image through Astro's build-time optimizer - resize and
// modern-format conversion happen automatically. Body-content images get
// the same automatic optimization via Astro's built-in markdown image
// pipeline (no schema involvement needed for that). This is what the
// page-weight budget check (scripts/check-budget.mjs) relies on to stay
// enforceable.
const imageWithAlt = (image: (...args: never[]) => z.ZodType) =>
  z.object({
    src: image(),
    alt: z.string().min(1, 'alt text is required (see audit finding UX-11)'),
  });

const caseStudies = defineCollection({
  loader: glob({
    pattern: ['**/*.{md,mdx}', '!**/_template.md'],
    base: './src/content/case-studies',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(), // rendered as the page's single <h1> - see [slug].astro
      summary: z.string(), // short teaser shown on the homepage grid card
      // Fuller 2-3 sentence overview shown in the TL;DR band under the hero
      // (Tldr.astro) - reproduces the original site's .case-tldr component.
      tldr: z.string(),
      heroImage: imageWithAlt(image),
      // DS-07/UX-04/UX-12: the original site misused <h1> for decorative stat
      // numbers. Stats are structured data here, rendered via StatBlock.astro
      // as <p>, not a heading - the defect can't recur through this schema.
      stats: z
        .array(
          z.object({
            value: z.string(),
            label: z.string(),
          }),
        )
        .default([]),
      order: z.number().default(0),
    }),
});

export const collections = { 'case-studies': caseStudies };
