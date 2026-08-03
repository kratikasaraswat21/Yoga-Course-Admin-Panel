import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

function OfflineScreenComponent() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-6 py-12 text-foreground">
      <section className="w-full max-w-lg rounded-3xl border bg-background px-6 py-10 text-center shadow-sm sm:px-12 sm:py-14">
        <div className="mx-auto mb-7 flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
          <WifiOff aria-hidden="true" className="size-9" strokeWidth={1.8} />
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Connection lost</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">You&apos;re offline</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
          Check your internet connection and try again. We&apos;ll take you back to the dashboard as soon as you&apos;re
          connected.
        </p>

        <Button
          className="mt-9 h-11 w-full max-w-xs px-6 text-sm sm:h-12 cursor-pointer"
          onClick={() => window.location.reload()}>
          Try again
        </Button>
      </section>
    </main>
  );
}

export default OfflineScreenComponent;
