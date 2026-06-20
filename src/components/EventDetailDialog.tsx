"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from "@mind-studio/ui";
import { CalendarClock, MapPin, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { CalendarEvent } from "@/lib/solid/events";

/**
 * Event detail dialog, opened by clicking a pill. Delete is two-step
 * (confirm) and surfaces pod errors instead of failing silently.
 */
export default function EventDetailDialog({
  event,
  onClose,
  onDelete,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
  onDelete: (ev: CalendarEvent) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setConfirming(false);
      setDeleting(false);
      setError(null);
    }
  }, [event]);

  async function reallyDelete() {
    if (!event) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete(event);
      onClose();
    } catch (err) {
      setError(`Deleting from your pod failed: ${String(err)}`);
      setDeleting(false);
      setConfirming(false);
    }
  }

  const sameDay = event && event.start.toDateString() === event.end.toDateString();

  return (
    <Dialog open={event !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {event && (
          <>
            <DialogHeader>
              <DialogTitle className="break-words">{event.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <CalendarClock className="size-4 shrink-0" />
                <span>
                  {event.start.toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {" → "}
                  {sameDay
                    ? event.end.toLocaleTimeString(undefined, {
                        timeStyle: "short",
                      })
                    : event.end.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                </span>
              </DialogDescription>
            </DialogHeader>

            {event.location && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" />
                <span className="break-words">{event.location}</span>
              </p>
            )}
            {event.description && (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {event.description}
              </p>
            )}
            <p className="break-all font-mono text-[10px] text-muted-foreground">{event.url}</p>

            {error && (
              <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              {confirming ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                  >
                    Keep it
                  </Button>
                  <Button variant="destructive" onClick={reallyDelete} disabled={deleting}>
                    {deleting && <Spinner className="size-4" />}
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button variant="destructive" onClick={() => setConfirming(true)}>
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
