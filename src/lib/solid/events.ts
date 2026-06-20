"use client";

import {
  buildThing,
  createSolidDataset,
  createThing,
  deleteSolidDataset,
  FetchError,
  getContainedResourceUrlAll,
  getDatetime,
  getSolidDataset,
  getStringNoLocale,
  getThingAll,
  saveSolidDatasetAt,
  setThing,
} from "@inrupt/solid-client";
import { calendarRootFor, podRootFromWebId } from "@/lib/config";
import { brokeredIdentity, brokerFetch, isBrokered } from "./broker";
import { session } from "./session";

/**
 * Pod data layer for Mind Calendar. One Turtle resource per event at
 * `{podRoot}apps/calendar/{id}.ttl`, schema.org vocab:
 *
 *   <#event> a schema:Event ;
 *     schema:name "…" ;
 *     schema:startDate "2026-06-10T09:00:00Z"^^xsd:dateTime ;
 *     schema:endDate   "2026-06-10T10:00:00Z"^^xsd:dateTime ;
 *     schema:location "…" ;
 *     schema:description "…" .
 *
 * The pod is the ONLY store — no server-side persistence anywhere. All I/O
 * goes through the session's authenticated fetch.
 */

const SCHEMA = {
  Event: "https://schema.org/Event",
  name: "https://schema.org/name",
  startDate: "https://schema.org/startDate",
  endDate: "https://schema.org/endDate",
  location: "https://schema.org/location",
  description: "https://schema.org/description",
};
const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

export type CalendarEvent = {
  /** URL of the .ttl resource holding this event (delete target). */
  url: string;
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
};

/**
 * The fetch every pod call runs through. When Calendar is hosted in the Mind
 * shell (brokered mode) this is the shell's scope-checked broker fetch —
 * Calendar holds no session of its own; otherwise it's the local OIDC
 * session's authed fetch.
 */
function authedFetch(): typeof fetch {
  return isBrokered() ? brokerFetch : (session().fetch as typeof fetch);
}

/**
 * Wrap the authenticated fetch with `cache: 'no-store'` so CSS containment
 * triples aren't served from the browser cache after a write.
 */
function noCacheFetch(): typeof fetch {
  const inner = authedFetch();
  return ((url: RequestInfo | URL, init?: RequestInit) =>
    inner(url, { ...init, cache: "no-store" })) as typeof fetch;
}

/**
 * `{podRoot}apps/calendar/` for the signed-in WebID. Inside the Mind shell the
 * brokered workspace pod root wins (the workspace pod isn't derivable from the
 * WebID); standalone it's derived from the WebID as before.
 */
export function calendarRoot(webId: string): string {
  const podRoot = brokeredIdentity()?.podRoot ?? podRootFromWebId(webId);
  return calendarRootFor(podRoot);
}

function isNotFound(e: unknown): boolean {
  return e instanceof FetchError && e.statusCode === 404;
}

/**
 * Read every event in the calendar container. A 404 on the container is the
 * empty state (nothing written yet), not an error. Loads each event resource
 * in parallel; individual unreadable/malformed resources are skipped rather
 * than failing the whole calendar.
 */
export async function listEvents(webId: string): Promise<CalendarEvent[]> {
  const container = calendarRoot(webId);
  let urls: string[];
  try {
    const ds = await getSolidDataset(container, { fetch: noCacheFetch() });
    urls = getContainedResourceUrlAll(ds).filter((u) => u.endsWith(".ttl"));
  } catch (e) {
    if (isNotFound(e)) return [];
    throw e;
  }
  const events = await Promise.all(
    urls.map(async (url): Promise<CalendarEvent | null> => {
      try {
        const ds = await getSolidDataset(url, { fetch: noCacheFetch() });
        // Find the thing carrying schema:startDate — robust whether the
        // fragment is #event or something else a sibling app wrote.
        const thing = getThingAll(ds).find((t) => getDatetime(t, SCHEMA.startDate)) ?? null;
        if (!thing) return null;
        const start = getDatetime(thing, SCHEMA.startDate);
        const end = getDatetime(thing, SCHEMA.endDate);
        if (!start) return null;
        return {
          url,
          id: url.slice(container.length).replace(/\.ttl$/, ""),
          title: getStringNoLocale(thing, SCHEMA.name) ?? "(untitled)",
          start,
          end: end ?? start,
          location: getStringNoLocale(thing, SCHEMA.location) ?? undefined,
          description: getStringNoLocale(thing, SCHEMA.description) ?? undefined,
        };
      } catch {
        return null;
      }
    }),
  );
  return events
    .filter((e): e is CalendarEvent => e !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export type NewEvent = {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
};

/**
 * Create one event as its own Turtle resource. The container is created
 * lazily on first write (CSS creates intermediate containers on PUT, so a
 * plain save suffices — no separate mkdir round-trip needed).
 */
export async function createEvent(webId: string, ev: NewEvent): Promise<CalendarEvent> {
  const container = calendarRoot(webId);
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const url = `${container}${id}.ttl`;

  let thing = buildThing(createThing({ url: `${url}#event` }))
    .addUrl(RDF_TYPE, SCHEMA.Event)
    .addStringNoLocale(SCHEMA.name, ev.title)
    .addDatetime(SCHEMA.startDate, ev.start)
    .addDatetime(SCHEMA.endDate, ev.end);
  if (ev.location) thing = thing.addStringNoLocale(SCHEMA.location, ev.location);
  if (ev.description) thing = thing.addStringNoLocale(SCHEMA.description, ev.description);

  const ds = setThing(createSolidDataset(), thing.build());
  await saveSolidDatasetAt(url, ds, { fetch: authedFetch() });

  return {
    url,
    id,
    title: ev.title,
    start: ev.start,
    end: ev.end,
    location: ev.location,
    description: ev.description,
  };
}

/** Delete one event resource. */
export async function deleteEvent(eventUrl: string): Promise<void> {
  await deleteSolidDataset(eventUrl, { fetch: authedFetch() });
}
