import { ArrowRight, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InsuranceRecommendation } from "@/lib/types";

export function InsuranceRecommendationCard({
  recommendation,
}: {
  recommendation: InsuranceRecommendation;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Potential fit
        </div>
        <CardTitle>{recommendation.planName}</CardTitle>
        <CardDescription>{recommendation.qualifiesIf}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{recommendation.whyItFits}</p>
        <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
          <p className="mb-1 font-medium text-card-foreground">Next steps</p>
          <p className="flex gap-2">
            <ArrowRight className="mt-[2px] h-4 w-4 shrink-0 text-primary" />
            {recommendation.nextSteps}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
