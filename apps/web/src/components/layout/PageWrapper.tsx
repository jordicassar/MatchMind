// PageWrapper — standard content container used by every page.
// Centres content, enforces a max width of 7xl, and adds consistent
// horizontal padding and vertical spacing. The pt-24 top padding
// accounts for the fixed Navbar so content is never hidden beneath it.
// Accepts an optional className to allow per-page overrides.
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <main className={cn("mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8", className)}>
      {children}
    </main>
  );
}
