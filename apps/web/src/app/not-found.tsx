// Not-found page — shown for unknown URLs, and rendered by the team and match
// pages when the requested ID doesn't exist.
import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";

export default function NotFound() {
  return (
    <PageWrapper>
      <div className="flex flex-col items-center py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">404</p>
        <h1 className="mt-2 text-3xl font-extrabold text-foreground">Page not found</h1>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          This page, team or match doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to home
        </Link>
      </div>
    </PageWrapper>
  );
}
