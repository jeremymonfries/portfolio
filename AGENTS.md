## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Writing case studies

Jeremy writes in a distinctive voice, described in `docs/voice.md`. Whenever a case study in
`src/content/case-studies/` is created or changed, or Jeremy shares notes or a draft for one, offer
to write it or update it in his style using the `case-study` skill
(`.claude/skills/case-study/SKILL.md`). Don't rewrite his copy without asking.

`npm run check:voice` checks spelling, grammar and banned phrases in every case study, and it runs
in `npm run check` and CI.
