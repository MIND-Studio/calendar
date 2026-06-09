"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@mind-studio/ui";
import { ensureSession, rememberSignedOutPath } from "@/lib/solid/auth";
import CalendarView from "@/components/CalendarView";

/**
 * Main surface. Signed out → a quiet prompt (the deep link is remembered so
 * connecting returns here); signed in → the month grid.
 */
export default function CalendarPage() {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "signed-out" }
    | { kind: "ready"; webId: string }
  >({ kind: "loading" });

  useEffect(() => {
    ensureSession()
      .then((info) => {
        if (info.isLoggedIn && info.webId) {
          setState({ kind: "ready", webId: info.webId });
        } else {
          rememberSignedOutPath();
          setState({ kind: "signed-out" });
        }
      })
      .catch(() => {
        rememberSignedOutPath();
        setState({ kind: "signed-out" });
      });
  }, []);

  if (state.kind === "loading") {
    return (
      <section className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-muted-foreground">Checking your session…</p>
      </section>
    );
  }

  if (state.kind === "signed-out") {
    return (
      <section className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Signed out
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Connect your pod to see your calendar.
        </h1>
        <Button asChild className="mt-6">
          <Link href="/connect">Connect a pod</Link>
        </Button>
      </section>
    );
  }

  return <CalendarView webId={state.webId} />;
}
