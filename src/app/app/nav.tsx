"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, MessageSquareText, Scissors, Settings, UserRound, Users } from "lucide-react";
import { cx } from "@/lib/format";

const ITEMS = [
  { href: "/app", label: "Kalendar", icon: CalendarDays },
  { href: "/app/klijenti", label: "Klijenti", icon: UserRound },
  { href: "/app/usluge", label: "Usluge", icon: Scissors },
  { href: "/app/tim", label: "Tim", icon: Users },
  { href: "/app/poruke", label: "Poruke", icon: MessageSquareText },
  { href: "/app/postavke", label: "Postavke", icon: Settings },
];

function isActive(path: string, href: string) {
  return href === "/app" ? path === "/app" : path.startsWith(href);
}

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Glavni meni">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(path, href) ? "page" : undefined}
          className={cx(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition-colors",
            isActive(path, href) ? "bg-ink text-paper" : "text-muted hover:bg-surface-2 hover:text-ink",
          )}
        >
          <Icon className="size-[1.15rem]" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}

// Na telefonu: donja traka s pet najvažnijih stavki.
export function BottomNav() {
  const path = usePathname();
  const items = ITEMS.filter((i) => i.href !== "/app/poruke");
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Glavni meni"
    >
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(path, href) ? "page" : undefined}
          className={cx(
            "flex flex-col items-center gap-0.5 py-2 text-[0.7rem] font-medium",
            isActive(path, href) ? "text-brand" : "text-muted",
          )}
        >
          <Icon className="size-5" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
