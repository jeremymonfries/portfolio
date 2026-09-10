---
title: 'Case study title'
summary: 'One or two sentence summary shown on the homepage / project grid.'
# Path is relative to this file and resolved through Astro's image() schema
# helper (see src/content.config.ts) - this is what gives the hero image
# automatic resize + modern-format optimisation at build time (fixes
# UX-07: the original site shipped a 6.97MB page).
# Drop new source images in src/assets/case-studies/<slug>/.
heroImage:
  src: '../../assets/case-studies/SLUG/hero.jpg'
  alt: "Describe what's shown - required, cannot be left empty (see UX-11)."
stats:
  - value: '40%'
    label: 'Increase in conversion'
order: 99
---

Case study body content goes here, written in Markdown. This becomes the
page's prose content below the hero/stats.

Embed body images inline, next to the paragraph they illustrate, using
plain Markdown image syntax - these get the same automatic optimisation
as the hero image, no extra setup needed:

![Describe this image.](../../assets/case-studies/SLUG/01.jpg)

If several images were originally shown together as a photo grid (not one
per paragraph), rename this file `.mdx` and wrap them in `<ImageGrid>`:

```
import ImageGrid from '../../components/ImageGrid.astro';

<ImageGrid cols={3}>
![First image.](../../assets/case-studies/SLUG/01.jpg)

![Second image.](../../assets/case-studies/SLUG/02.jpg)

![Third image.](../../assets/case-studies/SLUG/03.jpg)
</ImageGrid>
```

Leave a blank line between each image inside `<ImageGrid>` (and between
any two images generally) - Markdown collapses adjacent lines with no
blank line between them into one run-on paragraph.
