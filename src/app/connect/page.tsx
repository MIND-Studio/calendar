import ConnectForm from "@/components/ConnectForm";

export default function ConnectPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Step 1 — connect a pod
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        Sign in with your Solid identity.
      </h1>
      <p className="mt-4 text-muted-foreground">
        Your time, in your pod. Every event is a plain Turtle resource in your
        own storage — no central server ever sees your schedule. Pick the
        issuer that hosts your pod; we&apos;ll redirect you there for the OIDC
        dance and come back here once you&apos;re signed in.
      </p>
      <div className="mt-8">
        <ConnectForm />
      </div>
    </section>
  );
}
