# Handoff log — Jeremy Monfries portfolio rebuild

Written for whichever AI tool or human picks this up next. Read this before
touching anything — it explains _why_ things are built the way they are, not
just what's there. `rebuild-scope.md` and `audit-report.md` (one level up, in
`../`) are the original planning documents; this file is the running log of
what's actually been done since, and should be kept up to date as work
continues.

## What this project is

A ground-up rebuild of Jeremy Monfries' design portfolio (originally a static,
page-builder-generated site) as a static Astro site, addressing every finding
in `audit-report.md` (accessibility, duplicate content/images, page weight,
heading misuse, etc.) while allowing deliberate design updates — this is not
a strict like-for-like clone. Deploy target is Cloudflare Pages (not yet
cut over). Content is git-based (markdown/MDX files), no CMS.

**Stack:** Astro 7 (static output), `@astrojs/mdx`, self-hosted Mona Sans
(`@fontsource-variable/mona-sans`), plain CSS with a custom-property token
system (no Tailwind/framework). No JS framework — the one interactive piece
(nav toggle) is vanilla JS in an inline `<script>`.

## Where it lives

- **This repo:** `/Users/accelerate_pro/Developer/jeremy-monfries-rebuild`
  — moved here from `.../folio 2026/jeremy-monfries-rebuild` early on
  because the project living inside iCloud Drive's synced Documents folder
  caused file corruption / extreme slowness (`npm install` 2min→11s,
  `astro build` 2m27s→1s after the move). **Do not move this back under
  iCloud Drive.**
- **Original site source** (static HTML snapshot used for content
  extraction): `../jeremy-monfries-checkout-typography-fix/` — this
  snapshot turned out to be **stale/incomplete** relative to the actual
  live site (see "Known content gaps" below). Treat it as a starting
  point, not ground truth.
- **Live site** (more authoritative for content, but a different visual
  design — dark sidebar, magenta `#e139ff` accent, circular photo — that
  we deliberately did _not_ adopt): https://jeremymonfries.com
- **Planning docs:** `../rebuild-scope.md`, `../audit-report.md`,
  `../audit-findings.json` (one level up from this repo).
- **GitHub repo:** `git@github.com-jmfolio:jeremymonfries/portfolio.git`
  (remote name `origin`, branch `main`). Auth uses a dedicated SSH key
  (`~/.ssh/id_ed25519_jmfolio`) with a scoped `Host github.com-jmfolio`
  entry in `~/.ssh/config` — not the user's default GitHub identity, if
  any exists.
- **Deployed to Cloudflare Workers** (static assets, not classic Pages —
  the current Cloudflare dashboard's "Connect to Git" flow for a new
  project deploys as a Worker with `npx wrangler deploy`, reading
  `wrangler.jsonc`'s `assets.directory` for the build output). Live at
  `https://portfolio.flotsam-film-3c.workers.dev`; custom domain
  (`jeremymonfries.com`) not yet attached. Build settings on Cloudflare:
  build command `npm run build`, deploy command `npx wrangler deploy`,
  env var `NODE_VERSION=22` (package.json pins `>=22.12.0`, no
  `.nvmrc`/`.node-version` file exists to auto-detect it otherwise).

## Commands

```bash
npm run dev            # dev server (astro dev)
npm run build           # static build to dist/
npm run preview         # serve the build (use this for visual QA, not
                         # dev - dev-mode image optimization is generated
                         # on-demand and lags behind scrolling)
npm run check            # eslint + stylelint + prettier --check
npm run check:a11y       # axe-core against every built page, 0 serious/critical required
npm run check:budget      # page-weight budget check (500KB default, 1.5MB case studies)
npm run format            # prettier --write
```

**Before considering any change done: `npm run check`, `npm run build`,
`npm run check:a11y`, `npm run check:budget` must all pass.** This is not
optional — it's the whole point of the CI gate in
`.github/workflows/ci.yml`.

## Architecture / key decisions

- **Content collections** (`src/content.config.ts`): one `case-studies`
  collection, loader globs `**/*.{md,mdx}` excluding `_template.md`.
  Schema requires `title`, `summary` (homepage teaser), `tldr` (fuller
  TL;DR-band text), `heroImage` (via Astro's `image()` helper — required
  non-empty `alt`), optional `stats[]`, `order` (int, controls homepage
  sort), `draft` (bool, default false).
- **`draft` flag**: set `draft: true` on a case study's frontmatter to
  fully hide it — excluded from the homepage grid **and** from
  `getStaticPaths` in `[slug].astro`, so the URL doesn't exist at all, not
  just unlisted. `find-your-business.mdx` is currently `draft: true` (set
  at user's request — content is fully written, just not published yet).
- **Images**: hero images go through Astro's `image()` schema helper
  (automatic resize/format optimization). Body-content images use plain
  Markdown `![]()` syntax — Astro's built-in markdown image pipeline
  optimizes these too, no extra setup. **Gotcha:** plain markdown images
  default to the _source_ resolution with no width constraint — several
  original source photos were 8,000–14,000px-tall full-page mobile
  screenshots, which blew multiple pages' budgets until the source files
  were pre-resized (`sips --resampleWidth 900`) and, for images used
  inside `<ImageGrid>` (which crops to 4:3 via `object-fit: cover`
  anyway), center-cropped down to ~1000px tall to cut wasted bytes.
- **`.mdx` vs `.md`**: files only need to be `.mdx` if they import a
  component (`ImageGrid`, `ListBand`). Files with only prose + plain
  images stay `.md` (`design-system.mdx` and `find-your-business.mdx`
  actually did need conversion once `ListBand` was added to them — check
  each file's actual imports before assuming).
- **Reusable components** (`src/components/`):
  - `Tldr.astro` — full-bleed light-grey band under every case-study
    hero, label + paragraph. Backed by the required `tldr` frontmatter
    field.
  - `ListBand.astro` — full-bleed band for short fact-lists (Tools,
    Skills, UX goals, Learnings, etc.), 2-column by default
    (`columns` prop for 1 or more), three `tone` variants (`subtle`
    grey, `tint` pale blue, `dark` navy — dark is reserved for stats).
    Breaks out of any nested container via
    `margin-inline: calc(50% - 50vw)` — **this only produces a true
    edge-to-edge span if its containing block is itself horizontally
    centered** (see "Gotchas" below).
  - `ImageGrid.astro` — N-column grid for image groups that were
    originally shown side-by-side (not stacked), `cols` prop, images
    forced to `aspect-ratio: 4/3; object-fit: cover` for a uniform grid
    regardless of source aspect ratio. Also sets `min-width: 0` on its
    grid children — required once `DeviceFrame` items (below) started
    appearing inside it, see gotcha #9.
  - `DeviceFrame.astro` — wraps a screenshot in a laptop/tablet/mobile
    bezel (`variant` prop), matching the live site's device-mockup
    treatment for UI-design screenshots (added because the rebuild was
    initially showing them as bare images — see git history around
    "Add DeviceFrame and Carousel components"). Screen area is a fixed
    aspect ratio per variant (16/10, 4/3, 9/16) with the image
    `object-fit: cover; object-position: top`, not shown at natural
    height — several source screenshots are full-page captures up to
    ~12,000px tall. See gotchas #7-9 for real bugs hit building this.
  - `Carousel.astro` — horizontally-scrolling gallery with prev/next
    arrows (native scroll-snap + button `scrollBy`, no library),
    `label` prop. Currently only used by `microsite` (the only live
    page found using an actual carousel rather than a static grid for
    its device-mockup groups — see the device-type table below).
  - `StatBlock.astro` — single centered stat (value + label), used
    inside the dark full-bleed stats band in `[slug].astro`.
  - `Nav.astro` — persistent hamburger toggle + dropdown/full-screen
    panel, see "Nav toggle" below for its history of visual bugs.
- **Design tokens** (`src/styles/tokens.css`): primitive → semantic →
  component tiers. Surface tones available for full-bleed sections:
  `--surface-subtle` (light grey), `--surface-tint` (pale blue,
  `--color-blue-100`), `--surface-sidebar` (dark navy, `--color-slate-800`).
  `--action-primary-bg` (`--color-blue-700`) is the AA-contrast-safe blue
  for text/links — **`--accent`/`--color-blue-500` (the original brand
  blue) fails 4.5:1 as text on light backgrounds (UX-10) and must never be
  used for body text or link color**, only for things like the nav-panel
  hover state where it was already there before this was understood
  (worth double-checking if you touch that).

## Known content gaps / things to double check against the live site

The static HTML snapshot this rebuild started from (`about.html`) was
missing most of the live About page's content — a personal intro, ~20-year
career history, 6 expertise write-ups, and a hobbies section — none of
which existed in the snapshot at all. This was only caught because the
user explicitly pointed at the live URL. **The Home page and the 9
case-study detail pages have not been checked against the live site the
same way** — it's plausible they have similar undocumented content drift.
If asked to "check the original site" for anything, always check the
_live_ site (jeremymonfries.com), not just the local static snapshot.

## Gotchas actually hit during this build (read before repeating them)

1. **Centering bug, hit twice.** A block with `max-width` but no
   `margin: auto` doesn't center — it sits flush-left in a wider
   container. This bit `.case-body` (case-study prose column) and
   `.about-more .copy` / `.hobbies .copy` (About page paragraphs). It's
   easy to miss in this Browser pane because its default width (~780px)
   is close enough to these columns' own max-width that flush-left and
   centered look identical there — **the bug only shows on real desktop
   widths (1200px+)**. If you add a new capped-width text block, give it
   `margin-inline: auto` from the start.
2. **`ListBand`'s full-bleed breakout depends on its ancestor being
   centered.** `margin-inline: calc(50% - 50vw)` only spans the true
   viewport edge-to-edge when the box it's computed against is itself
   horizontally centered on the page. This is the same root cause as
   gotcha #1 — fixing `.case-body`'s centering fixed both problems at
   once.
3. **CSS stacking: `position: absolute` paints after normal-flow content,
   regardless of DOM order.** The nav toggle's frosted-glass `::before`
   disc (see below) is `position: absolute` and was rendering _on top of_
   the normal-flow SVG icon, hiding it completely, even though the
   `::before` is "before" the icon in the DOM. Fixed by giving the icon
   `position: relative; z-index: 1`.
4. **`mix-blend-mode: difference` does not reliably composite across a
   `position: fixed` element's own compositing layer** in real Chromium/
   WebKit. The nav icon originally tried to use this for adaptive
   light/dark contrast and just silently failed (rendered as literal
   white, invisible on white backgrounds). Went through several
   iterations before landing on the current frosted-glass approach (see
   next point) — don't reach for blend-mode tricks on fixed-position UI.
5. **Dev-mode image optimization is generated on request and lags behind
   fast scrolling** — screenshots taken right after a scroll in `astro
dev` often come back blank/white because the image hasn't finished
   decoding. Use `npm run build && npm run preview` for visual QA, not
   `npm run dev`, and add a short `wait` after navigation/scrolling
   before screenshotting either way.
6. **Bash tool loses the venv/nvm PATH between calls** — every `npm`
   invocation in a fresh Bash call needs
   `export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"`
   first, or it fails with `npm: command not found`.
7. **`height: 100%` doesn't reliably resolve against a parent sized by
   `aspect-ratio`.** Built `DeviceFrame`'s image-crop with
   `.device-frame__screen { aspect-ratio: 16/10 }` and
   `img { height: 100% }` expecting the image to fill and crop via
   `object-fit: cover` — measured instead that the image rendered at its
   own natural aspect ratio (ignoring the 100%), blowing the frame out to
   the image's real proportions. Fixed by making the image
   `position: absolute; inset: 0` (with `position: relative` on the
   screen) instead of `width/height: 100%` — percentage sizing on an
   absolutely-positioned element reliably resolves against its
   positioned ancestor's padding box, sidestepping whatever made the
   percentage-height case unreliable.
8. **A transparent-PNG screenshot looked inverted/broken against a black
   device-screen background.** One source image (`torque-drift/01.png`,
   an IA diagram export) has a transparent background with only dark
   line art — with `.device-frame__screen { background: #000 }` it
   rendered as white-on-black, looking like a bug. Changed the screen
   background to white; this is correct for every other screenshot too
   (all of them are light-background UI, so the background color was
   never actually visible before this one transparent exception).
9. **`margin-inline: auto` on a CSS Grid item collapses it instead of
   centering it, if the item also has a competing `max-width`.** Needed
   a lone `DeviceFrame` (tablet/mobile) to center itself in the prose
   column, so gave `.device-frame--tablet`/`--mobile` a `max-width` +
   `margin-inline: auto`. Broke badly the moment a `DeviceFrame` sat
   inside an `ImageGrid` next to other variants (norton-gamer mixes
   laptop/tablet/mobile in one 3-column row): measured the tablet/mobile
   grid columns collapsing to 20px while laptop absorbed the rest — auto
   margins on a grid item make it size to its content instead of
   stretching to its track, and the item's "content size" here was
   near-zero once the image inside became `position: absolute` (gotcha
   #7) and stopped contributing intrinsic size. Fixed by moving the
   `max-width` one level deeper onto `.device-frame__bezel` (a normal
   flex child, centered by the parent's existing
   `align-items: center` — no `margin: auto` needed) instead of onto the
   grid item itself, which is now never given a width constraint of its
   own and stretches/sizes normally in any context (prose column, grid,
   or carousel).

## Nav toggle history (why it looks the way it does)

Went through three iterations, each fixing a real bug the previous one
had:

1. **Original:** `mix-blend-mode: difference` for adaptive contrast.
   Broken (see gotcha #4) — invisible on white backgrounds.
2. **Fix 1:** solid dark stroke color. Worked, but only because every
   page happened to be white; not adaptive to future dark sections.
3. **Fix 2 (current):** frosted-glass circle — translucent white
   (`rgba(255,255,255,0.65)`) + `backdrop-filter: blur(10px)`, so it's
   legible over _any_ background without needing to know that
   background's color. The circle's edge is feathered via a
   `radial-gradient` CSS mask on a `::before` sized larger than the
   actual 44px hit area (`inset: -10px`), rather than a hard circular
   cutoff. See gotcha #3 for the stacking bug this introduced and fixed.

## Content status (as of this log)

| Page                 | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home (`/`)           | Sidebar (photo/name/bio/skills) + case-study grid (8 published, 1 draft). Sidebar background panel was tried and reverted per user feedback; LinkedIn/Instagram links were removed per user request — currently just photo/name/role/bio/skills, no social links, no background.                                                                                                                                                                                                                                                                                |
| About (`/about`)     | Full content migrated from the live site: intro, bio, skills, career history, countries lived in (includes PNG + Korea, added after initial migration), 6 expertise cards (styled as cards, not the live site's plain columns — deliberate enhancement), hobbies section.                                                                                                                                                                                                                                                                                       |
| 8 case studies       | All have: hero image, TL;DR band, stats band (where the original had stat callouts), full narrative body content with images placed inline at their original position, `ImageGrid` for original multi-column photo groups, `ListBand` for fact-lists where those existed in the source, and (where the live site uses one) `DeviceFrame` laptop/tablet/mobile mockups — `Carousel` for microsite specifically, static `ImageGrid` grids for the rest. `blackwoods` and `design-system` intentionally have neither — the live site shows plain images there too. |
| `find-your-business` | Complete but `draft: true` — not live. Not checked against a live-site device-mockup audit since it isn't a real project.                                                                                                                                                                                                                                                                                                                                                                                                                                       |

**Which case study uses which device types** (inferred from source screenshot
pixel width — 375px=mobile, ~750/768px=tablet, ~900px=laptop — confirmed
exactly against the live site's own `gallery-layout-module` classes for
norton-gamer, homepage-redesign and ecommerce-checkout; comparison-chart and
torque-drift were single-device-type already so lower-risk):

| Case study         | Device types used                                                                                                                                  | Grouping                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| microsite          | laptop only                                                                                                                                        | `Carousel`                      |
| norton-gamer       | laptop + tablet + mobile                                                                                                                           | static `ImageGrid`              |
| ecommerce-checkout | laptop + mobile (two galleries)                                                                                                                    | static `ImageGrid`              |
| homepage-redesign  | laptop + tablet (mixed row)                                                                                                                        | static `ImageGrid`              |
| comparison-chart   | mobile only                                                                                                                                        | static `ImageGrid`              |
| torque-drift       | laptop only, standalone inline (not grouped — matches the live site's individual `mockup scrollable` elements, no `gallery-layout-module` wrapper) | none, just inline `DeviceFrame` |

## Explicitly not done yet

- Home page content has not been checked against the live site for
  drift (only About and, separately, each case study's device-mockup
  presentation were checked — see above). The live site's home page
  wasn't compared paragraph-for-paragraph the way About was.
- No "pull quote" style component for text-heavy case studies —
  discussed with the user as an option, not requested.
- Deleting the ~89 duplicate image files from the _original_ site's
  asset folder (not this repo) — was blocked on content migration
  completing; migration is now done, this hasn't been revisited.
- Custom domain (`jeremymonfries.com`) not yet attached to the
  Cloudflare Worker — deployment itself is live (see "Where it lives"
  above), this is the one remaining step per `rebuild-scope.md`.
- Git commit identity resolves to `Jeremy Monfries <accelerate_pro@macbookpro.lan>`
  (auto-detected) — flagged early on as optional to fix, never addressed.
- The tablet/laptop image-group split within `homepage-redesign`'s
  "final designs" grid (which two images are tablet vs. which four are
  laptop) was inferred from pixel width, not confirmed 1:1 against the
  live site's DOM order the way norton-gamer was — worth a spot-check
  if it ever looks off.
