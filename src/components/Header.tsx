"use client";

import { Button } from "@mind-studio/ui";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { ensureSession } from "@/lib/solid/auth";
import { session } from "@/lib/solid/session";

/**
 * App masthead: name + tagline, theme toggle, account chip (WebID host) and
 * sign-out. Session-aware but safe to mount everywhere: `ensureSession` is
 * memoized single-flight, so this never redeems an OIDC code twice.
 */
export default function Header() {
  const router = useRouter();
  const [webId, setWebId] = useState<string | null>(null);

  useEffect(() => {
    ensureSession()
      .then((info) => setWebId(info.webId ?? null))
      .catch(() => setWebId(null));
  }, []);

  async function onSignOut() {
    await session().logout();
    setWebId(null);
    router.replace("/connect");
  }

  const host = (() => {
    if (!webId) return null;
    try {
      return new URL(webId).host;
    } catch {
      return webId;
    }
  })();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="text-xl font-semibold tracking-tight">Mind Calendar</span>
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:inline">
            <span className="text-primary">●</span> your time, in your pod
          </span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main">
          <ThemeToggle />
          {webId ? (
            <>
              <span
                className="hidden max-w-[180px] truncate rounded-full border bg-muted/40 px-3 py-1 font-mono text-xs text-muted-foreground sm:inline"
                title={webId}
              >
                {host}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onSignOut}
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/connect">Connect pod</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
