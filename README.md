# Mind Calendar

**Your time, in your pod.** A privacy-first calendar built on Solid Pods —
every event is a plain Turtle resource (`schema.org` vocab) in *your* pod at
`{podRoot}apps/calendar/{id}.ttl`. No central server ever sees your schedule.

A sibling prototype in the mind workspace (drive, chat, shell, …) — its own
app, its own port, its own repo.

## Run it

```bash
export NODE_AUTH_TOKEN=<GitHub PAT with read:packages>   # for @mind-studio/*
npm install
npm run dev          # → http://localhost:3140
```

- Dev port: **3140**
- Default Solid issuer: `https://pods.mindpods.org/` — override with
  `NEXT_PUBLIC_SOLID_ISSUER` (e.g. a local CSS on `http://localhost:3011/`).

## What it does (v0)

- Month grid (Mon–Sun), prev / today / next, today highlighted, off-month
  days dimmed.
- Click a day → create an event (title, date, start/end time, location,
  description). Click an event pill → details + delete (with confirm).
- All events load once from the pod and are filtered client-side by the
  visible month. No recurrence in v0.

## Data model

One Turtle resource per event:

```turtle
<#event> a schema:Event ;
  schema:name "Team sync" ;
  schema:startDate "2026-06-10T09:00:00Z"^^xsd:dateTime ;
  schema:endDate   "2026-06-10T10:00:00Z"^^xsd:dateTime ;
  schema:location "Berlin" ;
  schema:description "Weekly." .
```

The `apps/calendar/` container is created lazily on first write; an empty or
missing container is the empty state, not an error.
