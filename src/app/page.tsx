"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ensureSession } from "@/lib/solid/auth";

/**
 * Root route: signed in → /calendar, signed out → /connect. The session
 * check shares the single-flight `handleIncomingRedirect` with every other
 * session-aware component.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    ensureSession()
      .then((info) => {
        router.replace(info.isLoggedIn ? "/calendar" : "/connect");
      })
      .catch(() => router.replace("/connect"));
  }, [router]);

  return (
    <section className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="text-muted-foreground">Loading…</p>
    </section>
  );
}
