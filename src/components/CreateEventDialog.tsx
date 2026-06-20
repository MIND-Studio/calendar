"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Spinner,
  Textarea,
} from "@mind-studio/ui";
import { useEffect, useState } from "react";
import { toDateInputValue } from "@/lib/dates";
import type { NewEvent } from "@/lib/solid/events";

/**
 * Create-event dialog, opened by clicking a day. The clicked date prefills
 * the date field. Local times in, ISO instants out: we build Dates from the
 * `<input type=date>` + `<input type=time>` values in local time and the pod
 * layer serialises them as xsd:dateTime.
 */
export default function CreateEventDialog({
  date,
  onClose,
  onCreate,
}: {
  date: Date | null;
  onClose: () => void;
  onCreate: (ev: NewEvent) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [day, setDay] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form each time the dialog opens for a (new) day.
  useEffect(() => {
    if (date) {
      setTitle("");
      setDay(toDateInputValue(date));
      setStartTime("09:00");
      setEndTime("10:00");
      setLocation("");
      setDescription("");
      setError(null);
      setSaving(false);
    }
  }, [date]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Give the event a title.");
      return;
    }
    if (!day) {
      setError("Pick a date.");
      return;
    }
    const start = new Date(`${day}T${startTime || "00:00"}`);
    const end = new Date(`${day}T${endTime || startTime || "00:00"}`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError("That date/time doesn't parse.");
      return;
    }
    if (end < start) {
      setError("End must not be before start.");
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        title: title.trim(),
        start,
        end,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(`Saving to your pod failed: ${String(err)}`);
      setSaving(false);
    }
  }

  return (
    <Dialog open={date !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New event</DialogTitle>
          <DialogDescription>Saved as a Turtle resource in your pod.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ev-title">Title</Label>
            <Input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Team sync"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-date">Date</Label>
              <Input
                id="ev-date"
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-start">Start</Label>
              <Input
                id="ev-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-end">End</Label>
              <Input
                id="ev-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-location">Location</Label>
            <Input
              id="ev-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-description">Description</Label>
            <Textarea
              id="ev-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              rows={3}
            />
          </div>
          {error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Spinner className="size-4" />}
              {saving ? "Saving…" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
