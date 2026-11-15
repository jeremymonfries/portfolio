---
name: case-study
description: Write a new portfolio case study, or rewrite or update an existing one, in Jeremy's own writing voice (docs/voice.md). Use when Jeremy adds or edits a file in src/content/case-studies/, pastes notes or a draft for a case study, or asks to write, rewrite, tidy or update case-study copy.
argument-hint: <slug | notes or draft text>
---

# /case-study: write or update a case study in Jeremy's voice

Read `docs/voice.md` first. It governs every sentence you write here.

## 0. Offer before writing

When Jeremy creates or edits a case study himself, don't silently rewrite it. Offer once: write it up,
or update it, in his style. If he says yes, follow the steps below. If he says no, leave his text
alone; still run `npm run check:voice` and report only real spelling or grammar errors.

## 1. Gather the facts

- **New case study:** start from `src/content/case-studies/_template.md`. Use whatever Jeremy gave you
  (notes, a draft, images, an old page). Look at the images in `src/assets/case-studies/<slug>/`, since
  diagrams and screens show what was actually designed.
- **Update:** read the current file in full and sort it into three piles:
  1. passages that already sound like him (keep them nearly word for word),
  2. weak passages (hype, self-praise, generic skill lists, vague claims) to rewrite,
  3. gaps in the story.
- Never invent facts: no made-up metrics, partners, research findings, dates, team sizes or outcomes.
  Where the story needs a fact you don't have, write the sentence and put an MDX comment above it:
  `{/* CONFIRM: what you need to know */}`. List every CONFIRM in your reply as a question.

## 2. Shape the story

Follow the shape his best case studies use (Norton checkout, Gamer, Comparison chart):

1. **The project:** the context and the problem, plainly.
2. **My role:** what he did, with "I" for his work and "we" for the team's.
3. **What he did and why:** each design decision with its reason ("…so I needed to…").
4. **What worried him:** the concern or risk, and how it played out. Ask him if you don't know.
5. **Outcome:** the result, using only figures he has given.
6. **Final thoughts:** a plain lesson, not a slogan.

Use `<SectionHeading level="section">` for headings (enforced by `npm run check:headings`). Keep the
frontmatter, imports and image components. `summary` is one sentence; `tldr` is two or three. Keep
`draft: true` on a new case study until Jeremy says to publish.

## 3. Write it in his voice

Apply `docs/voice.md`: plain and direct, the reason before the decision, honest about worry and
failure, the customer's side, pragmatic, a little colloquial. No hype, no self-praise, no polished
closing lines. Australian spelling.

## 4. Check and hand over

```bash
npm run check:voice
npm run check
npm run build
```

Fix every ✗. Review each ! warning and rewrite it unless it's inside a quote. Then tell Jeremy:

- what you kept from his original, what you rewrote and what you added
- each CONFIRM question

Write drafts to the case-study file only when Jeremy asked you to update it; otherwise write
`drafts/<slug>.mdx` and say where it is. Don't commit, push or deploy unless he asks.
