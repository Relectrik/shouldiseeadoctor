"use client";

import { motion } from "framer-motion";

import { getInsuranceRecommendations } from "@/lib/insurance";
import { toTitleCase } from "@/lib/format";
import { useAppSession } from "@/lib/use-app-session";
import { AppShell } from "@/components/common/app-shell";
import { LoadingState } from "@/components/common/loading-state";
import { InsuranceRecommendationCard } from "@/components/insurance/recommendation-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InsurancePage() {
  const { user, profile, authLoading, profileLoading } = useAppSession();

  if (authLoading) {
    return <LoadingState message="Loading insurance recommendations..." />;
  }

  if (!user) {
    return null;
  }

  const recommendations = profile ? getInsuranceRecommendations(profile) : [];

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="space-y-6"
      >
        <Card>
          <h2 className="text-xl font-semibold text-card-foreground">Insurance literacy + eligibility guidance</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Based on your profile, these options may help reduce premiums and out-of-pocket costs.
          </p>
          {profile ? (
            <div className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <p>
                <span className="font-medium">State:</span> {profile.state}
              </p>
              <p>
                <span className="font-medium">Income Bracket:</span> {toTitleCase(profile.incomeBracket)}
              </p>
              <p>
                <span className="font-medium">Employment:</span> {toTitleCase(profile.employmentStatus)}
              </p>
              <p>
                <span className="font-medium">Insurance:</span> {toTitleCase(profile.insuranceStatus)}
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          )}
        </Card>

        <section className="grid gap-4 md:grid-cols-2">
          {profile
            ? recommendations.map((recommendation) => (
                <InsuranceRecommendationCard
                  key={`${recommendation.planName}-${recommendation.qualifiesIf}`}
                  recommendation={recommendation}
                />
              ))
            : Array.from({ length: profileLoading ? 2 : 1 }).map((_, index) => (
                <Card key={`insurance-skeleton-${index}`} className="space-y-3">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-20 w-full" />
                </Card>
              ))}
        </section>
      </motion.div>
    </AppShell>
  );
}
