---
title: 'Case study title'
summary: 'One or two sentence summary shown on the homepage / project grid.'
# Paths are relative to this file and resolved through Astro's image()
# schema helper (see src/content.config.ts) - this is what gives every
# hero/gallery image automatic resize + modern-format optimisation at
# build time (fixes UX-07: the original site shipped a 6.97MB page).
# Drop new source images in src/assets/case-studies/<slug>/.
heroImage:
  src: '../../assets/case-studies/SLUG/hero.jpg'
  alt: "Describe what's shown - required, cannot be left empty (see UX-11)."
gallery:
  - src: '../../assets/case-studies/SLUG/01.jpg'
    alt: 'Describe this image.'
stats:
  - value: '40%'
    label: 'Increase in conversion'
order: 99
---

Case study body content goes here, written in Markdown. This becomes the
page's prose content below the hero/stats.
