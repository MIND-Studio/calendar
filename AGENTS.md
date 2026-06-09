# This is NOT the Next.js (or Solid) you know

This prototype uses **Next.js 16.2.6** + **React 19.2.4** — APIs have shifted
from training-cutoff knowledge. Before relying on what you "know", read
`node_modules/next/dist/docs/` or pattern-match the sibling exemplar at
`../drive/`.

# calendar — agent rules

A sibling prototype in the mind workspace. Own dir, own port, own repo —
do **not** unify it with siblings (drive, chat, shell, …).

## Hard rules

1. **Pod is the ONLY store.** No API routes that persist anything, no DB, no
   server-side state. All reads/writes go through `@inrupt/solid-client` with
   the session fetch (`src/lib/solid/events.ts`). The one API route
   (`/api/client-id`) serves a static OIDC client document — it stores nothing.
2. **Single-flight OIDC.** `handleIncomingRedirect` has exactly ONE call site,
   memoized in `src/lib/solid/auth.ts` (`handleRedirectOnce`). Never add a
   second — the one-time code redeemed twice resets the session.
3. **Never log** tokens or secrets. OK: WebID, route, status.

## Stack & layout

- Next.js 16.2.6 + React 19.2.4 + `@inrupt/solid-client` ^3 +
  `solid-client-authn-browser` ^4 + Tailwind v4 (no config file).
- **Design system:** entirely `@mind-studio/ui` (shadcn-native), Mind brand,
  dark default (`data-mind-theme="mind"` on `<html>`, ThemeProvider storageKey
  `mind-calendar-theme`). Semantic tokens only (`bg-background`,
  `text-muted-foreground`, `border`, `bg-primary`, …) — no bespoke palette.
  RSC gotcha: never import `Card`/`Badge`/`cn` into server components.
- `@mind-studio/*` installs from GitHub Packages —
  `export NODE_AUTH_TOKEN=<read:packages PAT>` before `npm install`.
- `src/lib/solid/` — auth single-flight (`auth.ts`), session (`session.ts`),
  event pod I/O (`events.ts`). `src/lib/config.ts` — podRoot derivation.
  `src/lib/dates.ts` — pure local-time grid math.

## Pod data model

`{podRoot}apps/calendar/{id}.ttl` — one Turtle resource per event,
`schema:` vocab (`name`, `startDate`/`endDate` as `xsd:dateTime`, `location`,
`description`). Container created lazily on first write; 404 on list = empty
state. No recurrence in v0.

## Solid gotchas

- `saveFileInContainer`'s slug is advisory — read the response's actual URL.
- Always pass `contentType` explicitly.
- No atomic rename / recursive delete. CSS v7 is WAC.

## Port

Dev app **:3140**. Issuer default `https://pods.mindpods.org/`
(`NEXT_PUBLIC_SOLID_ISSUER` to override).
