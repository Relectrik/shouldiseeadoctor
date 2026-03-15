"use client";

import { ArrowRight, ChevronDownIcon, ExternalLink, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InsuranceRecommendation } from "@/lib/types";

export function InsuranceRecommendationCard({
  recommendation,
}: {
  recommendation: InsuranceRecommendation;
}) {
  const getHost = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "External resource";
    }
  };

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
          <Collapsible>
            <CollapsibleTrigger className="mb-2 inline-flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-2 font-medium text-primary text-sm transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-panel-open:[&_svg]:rotate-180">
              Next Steps
              <ChevronDownIcon className="h-4 w-4 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsiblePanel>
              <div className="space-y-2 pb-1">
              <p className="flex gap-2">
                <ArrowRight className="mt-[2px] h-4 w-4 shrink-0 text-primary" />
                {recommendation.nextSteps}
              </p>
              <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Official resources
              </p>
              <ul className="space-y-2 text-sm">
                {recommendation.nextStepLinks.map((resource) => (
                  <li key={`${resource.label}-${resource.url}`}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-md border border-border/70 bg-background px-3 py-2 transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="font-medium text-primary underline underline-offset-2">{resource.label}</span>
                      <span className="ml-3 inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        {getHost(resource.url)}
                        <ExternalLink className="h-3.5 w-3.5 text-primary" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              </div>
            </CollapsiblePanel>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
