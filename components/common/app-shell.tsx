"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAnimate } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { Activity, FileSearch, Home, Shield, UserRound } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/utils/cn";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: Home },
  { href: "/symptom-check", label: "Symptom Check", shortLabel: "Symptoms", icon: Activity },
  { href: "/insurance", label: "Insurance", shortLabel: "Insurance", icon: Shield },
  { href: "/bill-analyzer", label: "I already saw a doctor!", shortLabel: "My Bill", icon: FileSearch },
  { href: "/profile", label: "Profile", shortLabel: "Profile", icon: UserRound },
];

const NO_CLIP = "polygon(0 0, 100% 0, 100% 100%, 0% 100%)";
const BOTTOM_RIGHT_CLIP = "polygon(0 0, 100% 0, 0 0, 0% 100%)";
const TOP_RIGHT_CLIP = "polygon(0 0, 0 100%, 100% 100%, 0% 100%)";
const BOTTOM_LEFT_CLIP = "polygon(100% 100%, 100% 0, 100% 100%, 0 100%)";
const TOP_LEFT_CLIP = "polygon(0 0, 100% 0, 100% 100%, 100% 0)";

const ENTRANCE_KEYFRAMES = {
  left: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  bottom: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  top: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  right: [TOP_LEFT_CLIP, NO_CLIP],
} as const;

const EXIT_KEYFRAMES = {
  left: [NO_CLIP, TOP_RIGHT_CLIP],
  bottom: [NO_CLIP, TOP_RIGHT_CLIP],
  top: [NO_CLIP, TOP_RIGHT_CLIP],
  right: [NO_CLIP, BOTTOM_LEFT_CLIP],
} as const;

type Side = keyof typeof ENTRANCE_KEYFRAMES;

interface DesktopNavLinkProps {
  href: string;
  label: string;
  active: boolean;
}

function DesktopNavLink({ href, label, active }: DesktopNavLinkProps) {
  const [scope, animate] = useAnimate();

  const getNearestSide = (event: React.MouseEvent<HTMLAnchorElement>): Side => {
    const box = event.currentTarget.getBoundingClientRect();
    const proximityToLeft = { proximity: Math.abs(box.left - event.clientX), side: "left" as const };
    const proximityToRight = { proximity: Math.abs(box.right - event.clientX), side: "right" as const };
    const proximityToTop = { proximity: Math.abs(box.top - event.clientY), side: "top" as const };
    const proximityToBottom = { proximity: Math.abs(box.bottom - event.clientY), side: "bottom" as const };

    return [proximityToLeft, proximityToRight, proximityToTop, proximityToBottom].sort(
      (a, b) => a.proximity - b.proximity,
    )[0].side;
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (active) return;
    const side = getNearestSide(event);
    animate(scope.current, { clipPath: ENTRANCE_KEYFRAMES[side] }, { duration: 0.42, ease: [0.22, 1, 0.36, 1] });
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (active) return;
    const side = getNearestSide(event);
    animate(scope.current, { clipPath: EXIT_KEYFRAMES[side] }, { duration: 0.34, ease: [0.22, 1, 0.36, 1] });
  };

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden rounded-none border border-white/10 px-3 py-2"
    >
      <span className="relative z-10 block text-sm font-medium text-white">
        {label}
      </span>
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e8543a]" />
      )}
      <span
        ref={scope}
        style={{ clipPath: active ? NO_CLIP : BOTTOM_RIGHT_CLIP }}
        className="pointer-events-none absolute inset-0 bg-white/10"
      />
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  useEffect(() => {
    for (const link of navLinks) {
      router.prefetch(link.href);
    }
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-[#1e2d5a] dark:bg-[#0a1020]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-base font-semibold tracking-tight text-white md:text-lg">
              Should I See A Doctor?
            </p>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <DarkModeToggle />
            <p className="text-xs text-white/60">{user?.email}</p>
            <GradientButton
              onClick={handleLogout}
              variant="secondary"
              size="sm"
              className="min-w-30 border-white/40 bg-transparent text-white hover:bg-white/10 dark:border-white/40 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
            >
              Logout
            </GradientButton>
          </div>
        </div>
        <nav className="mx-auto hidden w-full max-w-6xl items-center gap-2 px-4 pb-3 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return <DesktopNavLink key={link.href} href={link.href} label={link.label} active={active} />;
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-8">{children}</main>

      <nav className="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-border bg-card/95 p-2 shadow-[0_14px_30px_rgba(30,45,90,0.12)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-none border border-border/45 px-2 py-2 text-[11px]",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{link.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
