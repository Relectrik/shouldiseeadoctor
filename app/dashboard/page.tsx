"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { getRecentSymptomChecks } from "@/firebase/data";
import { SymptomCheckRecord } from "@/lib/types";
import { useAppSession } from "@/lib/use-app-session";
import { AppShell } from "@/components/common/app-shell";
import { LoadingState } from "@/components/common/loading-state";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Card } from "@/components/ui/card";
import { ClipPathLinks } from "@/components/ui/clip-path-links";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, profile, authLoading } = useAppSession({ requireProfile: false });
  const [symptomChecks, setSymptomChecks] = useState<SymptomCheckRecord[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const displayName = profile?.firstName?.trim() || user?.email?.split("@")[0] || "there";

  useEffect(() => {
    if (!user) {
      return;
    }
    void (async () => {
      setActivityLoading(true);
      const checks = await getRecentSymptomChecks(user.uid, 4);
      setSymptomChecks(checks);
      setActivityLoading(false);
    })();
  }, [user]);

  if (authLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="space-y-6"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Hello, {displayName}</h2>
            <p className="text-sm text-muted-foreground">Here is your care navigation and cost-awareness command center.</p>
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
          <ClipPathLinks />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Health Guidance Card
            </div>
            <h3 className="text-lg font-semibold text-card-foreground">Use care settings strategically to avoid overspending</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Start with the lowest appropriate care setting, then escalate based on red-flag symptoms. Compare cost,
              wait time, and urgency before choosing ER-level care for non-emergencies.
            </p>
            <p className="text-sm text-muted-foreground">
              Current state-adjusted route estimates shown for{" "}
              <span className="font-medium">{profile?.state ?? "your state"}</span>.
            </p>
          </Card>
          {activityLoading ? (
            <Card className="space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </Card>
          ) : (
            <RecentActivity symptomChecks={symptomChecks} />
          )}
        </section>
      </motion.div>
    </AppShell>
  );
}
