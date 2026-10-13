// Error boundary — catches errors thrown while rendering any page (including
// failed API requests surfaced by useApi) and shows a recovery screen instead
// of Next.js's default. "Try again" re-mounts the page, which refetches its data.
"use client";
import { useEffect } from "react";
import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageWrapper>
      <div className="flex flex-col items-center py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-chart-2">Error</p>
        <h1 className="mt-2 text-3xl font-extrabold text-foreground">Something went wrong</h1>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          We couldn&apos;t load this page. It may be a temporary problem — try again in a moment.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card"
          >
            Back to home
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}