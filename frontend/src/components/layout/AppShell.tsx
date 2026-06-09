"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, MessagesSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthBadge } from "./HealthBadge";
import Image from "next/image";
import logo from "@/assets/logo.png";
const NAV = [
  {
    href: "/",
    label: "Intake Triage",
    icon: Inbox,
    desc: "Structured generation",
  },
  {
    href: "/chat",
    label: "Knowledge Assistant",
    icon: MessagesSquare,
    desc: "Grounded RAG",
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/40 p-4 md:flex">
        <div className="flex items-center gap-2 px-2 py-3">
          <Image
            src={logo}
            alt="Minetech AI"
            width={40}
            height={50}
            className="rounded-sm"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">
              Minetech AI
            </span>
          </div>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium leading-tight">
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.desc}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-2">
          <HealthBadge />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
