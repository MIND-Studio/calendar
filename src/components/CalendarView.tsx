"use client";

import { Button, Skeleton } from "@mind-studio/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CreateEventDialog from "@/components/CreateEventDialog";
import EventDetailDialog from "@/components/EventDetailDialog";
import { dayKey, type GridCell, monthGrid, monthLabel, pillTime, WEEKDAYS } from "@/lib/dates";
import { isBrokered, signalReady } from "@/lib/solid/broker";
import {
  type CalendarEvent,
  createEvent,
  deleteEvent,
  listEvents,
  type NewEvent,
} from "@/lib/solid/events";

/**
 * The month grid. Loads ALL events once from the pod and filters client-side
 * by visible month — fine at v0 scale, one fetch per event resource.
 */
export default function CalendarView({ webId }: { webId: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createFor, setCreateFor] = useState<Date | null>(null);
  const [detail, setDetail] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    let cancelled = false;
    listEvents(webId)
      .then((evs) => {
        if (!cancelled) setEvents(evs);
      })
      .catch((e) => {
        if (!cancelled) {
          setEvents([]);
          setError(`Could not load events from your pod: ${String(e)}`);
        }
      })
      .finally(() => {
        // Tell the shell we've rendered so it drops its loading overlay
        // (no-op when standalone).
        if (!cancelled && isBrokered()) signalReady();
      });
    return () => {
      cancelled = true;
    };
  }, [webId]);

  const cells = useMemo(() => monthGrid(year, month), [year, month]);

  /** Events of the visible grid, bucketed by local-day key (sorted by start). */
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    if (!events) return map;
    for (const ev of events) {
      const key = dayKey(ev.start);
      const list = map.get(key);
      if (list) list.push(ev);
      else map.set(key, [ev]);
    }
    return map;
  }, [events]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function goToday() {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
  }

  async function onCreate(ev: NewEvent) {
    const created = await createEvent(webId, ev);
    setEvents((prev) => (prev ? [...prev, created] : [created]));
  }

  async function onDelete(ev: CalendarEvent) {
    await deleteEvent(ev.url);
    setEvents((prev) => (prev ? prev.filter((e) => e.url !== ev.url) : prev));
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{monthLabel(year, month)}</h1>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
          <button className="ml-3 underline underline-offset-2" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {events === null ? (
        <GridSkeleton rows={Math.ceil(cells.length / 7)} />
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border">
          <div className="grid grid-cols-7 border-b bg-muted/40">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="px-2 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell) => (
              <DayCell
                key={cell.key}
                cell={cell}
                events={byDay.get(cell.key) ?? []}
                onCreate={() => setCreateFor(cell.date)}
                onOpen={(ev) => setDetail(ev)}
              />
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Click a day to add an event. Events live in your pod under{" "}
        <span className="font-mono">apps/calendar/</span>.
      </p>

      <CreateEventDialog date={createFor} onClose={() => setCreateFor(null)} onCreate={onCreate} />
      <EventDetailDialog event={detail} onClose={() => setDetail(null)} onDelete={onDelete} />
    </section>
  );
}

const MAX_PILLS = 3;

function DayCell({
  cell,
  events,
  onCreate,
  onOpen,
}: {
  cell: GridCell;
  events: CalendarEvent[];
  onCreate: () => void;
  onOpen: (ev: CalendarEvent) => void;
}) {
  const overflow = events.length - MAX_PILLS;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onCreate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCreate();
        }
      }}
      aria-label={`${cell.date.toLocaleDateString()} — add event`}
      className={`min-h-20 cursor-pointer border-b border-r p-1 align-top transition-colors last:border-r-0 hover:bg-accent/50 sm:min-h-24 ${
        cell.inMonth ? "" : "bg-muted/30 text-muted-foreground"
      }`}
    >
      <span
        className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${
          cell.isToday ? "bg-primary font-semibold text-primary-foreground" : ""
        }`}
      >
        {cell.date.getDate()}
      </span>
      <div className="mt-0.5 space-y-0.5">
        {events.slice(0, MAX_PILLS).map((ev) => (
          <button
            key={ev.url}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(ev);
            }}
            title={`${ev.title} · ${pillTime(ev.start)}`}
            className="block w-full truncate rounded bg-primary/15 px-1.5 py-0.5 text-left text-[11px] leading-4 text-primary hover:bg-primary/25"
          >
            {ev.title}
          </button>
        ))}
        {overflow > 0 && (
          <p className="px-1.5 text-[10px] text-muted-foreground">+{overflow} more</p>
        )}
      </div>
    </div>
  );
}

function GridSkeleton({ rows }: { rows: number }) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-2 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: rows * 7 }, (_, i) => (
          <div key={i} className="min-h-20 border-b border-r p-2 sm:min-h-24">
            <Skeleton className="size-6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
