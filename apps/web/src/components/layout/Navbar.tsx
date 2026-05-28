// Navbar — fixed top navigation bar rendered on every page via layout.tsx.
// Displays the MatchMind brand on the left and nav links on the right.
// Uses usePathname to highlight the active route with a green tint.
// Marked as a client component because usePathname requires browser context.
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, BarChart3, List } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/standings", label: "Standings", icon: List},
  { href: "/accuracy", label: "Accuracy", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground hover:text-primary transition-colors">
          <Brain className="h-6 w-6 text-primary" />
          MatchMind
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
