import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// UX-11: axe-core found images with the `alt` attribute missing entirely on
// the live site. Making `alt` a required, non-empty field here makes that
// defect unrepresentable in the rebuild - a missing alt fails the build,
// not the accessibility scan.
const image = z.object({
  src: z.string(),
  alt: z.string().min(1, 'alt text is required (see audit finding UX-11)'),
});

const caseStudies = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!**/_template.md'],
    base: './src/content/case-studies',
  }),
  schema: z.object({
    title: z.string(), // rendered as the page's single <h1> - see [slug].astro
    summary: z.string(),
    heroImage: image,
    gallery: z.array(image).default([]),
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
