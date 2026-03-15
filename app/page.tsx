"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity, FileSearch, ShieldCheck, Wallet } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const modules = [
  {
    title: "Symptom Triage",
    description: "Rule-based care navigation that recommends self-care, telehealth, urgent care, or ER.",
    icon: Activity,
  },
  {
    title: "Insurance Guidance",
    description: "Personalized suggestions for Medicaid, ACA marketplace, student, or employer options.",
    icon: ShieldCheck,
  },
  {
    title: "Cost-Aware Routes",
    description: "State-adjusted cost ranges and escalation triggers to avoid unnecessary spending.",
    icon: Wallet,
  },
  {
    title: "I already saw a doctor!",
    description: "Upload or enter charges, compare to typical ranges, and flag potentially disputable fees.",
    icon: FileSearch,
  },
];

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(163,174,149,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(201,123,76,0.18),_transparent_32%),radial-gradient(circle_at_72%_22%,_rgba(216,183,179,0.22),_transparent_38%),var(--background)] px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>
        <header className="mb-10 rounded-3xl border border-border bg-background/92 p-7 shadow-[0_16px_40px_rgba(43,36,31,0.09)] backdrop-blur">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Should I See A Doctor?
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Care navigation with cost transparency, insurance literacy, and bill awareness.
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              A platform focused on patient empowerment so users can make smarter healthcare decisions without
              overspending.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <GradientButton size="lg" onClick={() => router.push("/signup")}>
                Create account
              </GradientButton>
              <GradientButton size="lg" variant="secondary" onClick={() => router.push("/login")}>
                Log in
              </GradientButton>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.title} className="h-full">
                <div className="mb-3 inline-flex rounded-xl bg-muted/60 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-card-foreground">{module.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{module.description}</p>
              </Card>
            );
          })}
        </section>
      </div>
    </div>
  );
}
