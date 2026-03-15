import { Activity } from "lucide-react";

import { Card } from "@/components/ui/card";
import { SymptomCheckRecord } from "@/lib/types";
import { formatDate } from "@/lib/format";

interface RecentActivityProps {
  symptomChecks: SymptomCheckRecord[];
}

export function RecentActivity({ symptomChecks }: RecentActivityProps) {
  const activityItems = symptomChecks
    .map((entry) => ({
      id: `symptom-${entry.id}`,
      title: `Recommended treatment: ${entry.triage.primaryRecommendation}`,
      detail: entry.rawSymptoms,
      date: entry.createdAt,
    }))
    .sort((a, b) => b.date - a.date)
    .slice(0, 6);

  return (
    <Card>
      <h3 className="mb-4 text-base font-semibold text-card-foreground">Recent Activity</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Bill analyses are privacy-preserving and not stored in activity history.
      </p>
      <div className="space-y-3">
        {activityItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet. Start with a symptom check.</p>
        ) : (
          activityItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-background/35 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-card-foreground">{item.title}</p>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{item.detail}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.date)}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
