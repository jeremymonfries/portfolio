# Handoff — design-polish and launch session (Sep–Oct 2026)

Read `HANDOFF.md` first for the project's background and architecture. This
file covers what was done afterwards: the homepage/case-study redesign work,
hardening, going live on the custom domain, and the hero-image treatment. It
records the decisions that aren't obvious from the code and the traps that cost
time, so the next session doesn't repeat them.

## State at the end of this session

- Branch `main`, pushed to `origin` (`git@github.com-jmfolio:jeremymonfries/portfolio.git`).
- **Live at https://jeremymonfries.com** (also `https://portfolio.flotsam-film-3c.workers.dev`).
- **Deploys are automatic:** Cloudflare "Workers Builds" builds every push to
  `main` (`npm run build` then `npx wrangler deploy`). Allow roughly 10 minutes
  from push to live — one push sat queued that long. One earlier build failed
  with no diagnostic visible from GitHub (only "failure"); the next build was
  fine. Build logs are in the Cloudflare dashboard (Workers & Pages → portfolio
  → Builds). Public check results:
  `https://api.github.com/repos/jeremymonfries/portfolio/commits/<sha>/check-runs`.
- 8 case studies published. `find-your-business.mdx` is **`draft: true` on
  purpose** (user asked to keep it hidden). It is kept current with site
  conventions and has no images by design.

## What was built, by area

**Case-study content components** (all showcased in `/patterns/`, which is
`noindex`):

- `SectionHeading` (`chapter` h2 / `section` h3 / `tagline` h4) — case studies
  must never use raw `#` headings; `scripts/check-headings.mjs` (in `npm run
check`) fails the build if they do.
- `ColumnGrid` (N-column heading+list blocks; replaced `ListBand` everywhere
  published), `FullBleedImage` (zoomable diagram), `NumberedSteps`
  (01/02/03 columns; items are strings **or** `{title, body}`).
- `find-your-business` opens with a "My role" `ColumnGrid` (narrative left,
  Role/Team/Timeline right); its three research findings use `NumberedSteps`.

**Homepage (`src/pages/index.astro`):**

- Cards with skill chips (`skills` array in frontmatter), generated seamless
  isometric-cube background (`public/patterns/isometric-cubes.svg`, tuned to
  the user's reference image), split background so the sidebar stays white,
  `--home-max: 1600px` (homepage only; other pages stay at `--page-max`).
- Tiles slide up on load: `translate` (not `transform`, so hover lift still
  works), strong ease-out, 70ms stagger via `:nth-child`, `backwards` fill.
- Profile photo is a circle with a soft straight-down shadow (home + About).
- Title is now **"Lead Product Designer, AI-Augmented"** (user designs _with_
  AI tools — deliberately not "AI Products"). `AI-Augmented` is in a `nowrap`
  span so the 280px sidebar wraps after the comma, not at the hyphen.
- Strategy chips added to Torque Drift, Blackwoods, eCommerce Checkout.

**Case-study hero (`src/pages/projects/[slug].astro`) — the most intricate
part:**

- Blur-to-focus reveal on load (blur 20px + opacity, 0.7s, Material easing).
- **Whole hero is pinned** (heading, summary, image) and the TL;DR/stats/body
  (`.rise`, higher layer, opaque backgrounds) slide over it for the entire
  page. A scroll-driven veil blurs it (`backdrop-filter`, 0→18px) and the image
  drifts slightly. Modelled on CodeFronts' "Backdrop Filter Blur Cross Fade
  Parallax". All of it is behind
  `prefers-reduced-motion: no-preference` and `min-height: 600px`; blur/drift
  are additionally behind `@supports (animation-timeline: view())`.
- Hero image is capped to `max(240px, 100svh - 404px)` so a pinned hero can
  never be taller than the screen (measured heroes were 890–1050px tall).
- `heroFit` frontmatter: `cover` (default, centre-crop) or `top` (full width,
  anchored to the top, bottom crops). `top` is used by `homepage-redesign`,
  `norton-gamer`, `ecommerce-checkout`. The other five still use `cover` —
  extend by adding `heroFit: 'top'` to a case study's frontmatter.
- `heroImage` is optional in the schema (find-your-business has none).
- 1px `--border-default` stroke on `.hero-frame`.

**Other components:** `DeviceFrame` screen box now bleeds 2px under the bezel
(fixes a white hairline; insets are measured from the PNG alpha channels — see
the comment in the file). Phone frames (`mobile`, `mobile-landscape`) no longer
have an enlarge button; laptop/tablet/diagram images do.

**Security / hosting:** `public/_headers` (CSP with sha256 hashes for the three
inline scripts, nosniff, frame options, referrer, permissions, HSTS),
`VideoEmbed` sandboxed + `youtube-nocookie.com`, `robots.txt` disallowing
`/patterns/`. **If an inline `<script>` in Nav, Lightbox or Carousel changes
even slightly, regenerate its hash in `_headers` or that script is blocked in
production.** `_headers` is only exercised by `npx wrangler dev`, not
`astro dev`/`preview`.

## Traps hit (read before repeating them)

1. **Dev server serves stale content after a schema change.** After editing
   `src/content.config.ts`, the page kept rendering the old data even after a
   restart (`.astro/data-store.json` lacked the new field). Fix: delete
   `.astro/data-store.json`, run `npm run build`, restart the dev server. Trust
   `dist/` over the dev server when in doubt.
2. **`position: sticky` is bounded by its parent's content box — padding doesn't
   count.** The hero is pinned by making `.hero-stage` `display: contents` so
   its containing block is `<main>`.
3. **`overflow: hidden` creates a scroll container** and silently captures
   scroll-driven timelines. `.hero-frame` uses `overflow: clip`.
4. **`view()` timelines misbehave for subjects taller than the screen** (the
   `exit` range starts at the wrong edge). The blur/drift use `scroll(root)`
   with pixel ranges instead, which is exact because the hero starts at the top
   of the page.
5. **Specificity: `.case-body :global(ol|ul)` (margin + padding) beats a
   component's own scoped rule.** `NumberedSteps` needs
   `:global(.case-body) .numbered-steps` for both properties (same pattern as
   `DeviceFrame` and `ColumnGrid`).
6. **CSS custom properties only inherit downward.** A variable set on one
   sibling is invisible to the other.
7. **axe runs mid-animation and reports false contrast failures** on
   semi-transparent text. `scripts/check-a11y.mjs` now awaits finite,
   time-based animations before analysing; keep that if you add entrance
   animations.
8. **Piping checks through `| tail` swallows the exit code** — a failing
   a11y run once slipped into a commit. Use `set -o pipefail` and chain with
   `&&`, or run the check un-piped.
9. The browser pane can't crop-zoom; magnify with a temporary CSS
   `transform: scale(3)` on the element to inspect hairlines.

## Verification loop used before every commit

```
npm run format
npm run check          # eslint + stylelint + prettier + check:headings
npm run build
npm run check:a11y     # axe-core, 0 serious/critical
npm run check:budget   # 500KB default pages, 1.5MB case studies
```

Plus a real-browser check (desktop, ~1400px, mobile 375px) for any visual
change, measuring computed values/geometry rather than eyeballing where
possible. Page weights are close to budget on a few case studies
(comparison-chart ~1.43MB of 1.5MB).

## Working conventions the user expects

- Commit messages go in a temp file and use `git commit -F <file>` (never inline
  heredocs with backticks — it corrupted messages before). One commit per
  coherent change; each ends with the `Co-Authored-By: Claude …` trailer.
- **Never push unless asked** — the user says "push to github" explicitly each
  time. Local commits are fine and encouraged.
- The user reviews visually and iterates quickly; short summaries, no padding.
- Don't invent claims about their work (e.g. which case studies involved
  "strategy") — ask or use their own write-up's wording.

## Open items / loose ends

- **Email on the domain is unfinished or unverified.** Mail to the domain was
  bouncing (the old GoDaddy MX records had no mailbox behind them). The plan
  was Cloudflare Email Routing (dashboard path: Compute → Email Service →
  Email Routing), which required deleting the old GoDaddy MX records first.
  The user was mid-way through this; the outcome was never confirmed. Verify
  before assuming it works.
- **`www.jeremymonfries.com` is not set up** (needs a proxied DNS record in
  Cloudflare plus a second Workers Route for `www.jeremymonfries.com/*`).
- The domain is attached through a **zone-level Workers Route**
  (`jeremymonfries.com/*` → `portfolio`) created in the Cloudflare dashboard,
  not via `wrangler.jsonc`; `wrangler.jsonc` only has the name and assets.
- Five case-study heroes still use the centre-crop (`cover`): design-system,
  blackwoods, torque-drift, comparison-chart, microsite. Offered to the user,
  not decided.
- The git commit identity is auto-detected (`accelerate_pro@jeremys-air.lan`);
  never configured, harmless.
- Everything in `HANDOFF.md`'s "Explicitly not done yet" that isn't mentioned
  here is still open (except the custom domain, which is now attached).
