"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { AppShell } from "@/components/common/app-shell";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { saveUserProfile } from "@/firebase/data";
import { useAppSession } from "@/lib/use-app-session";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, authLoading, profileLoading, refreshProfile } = useAppSession({ requireProfile: false });

  useEffect(() => {
    if (!authLoading && !profileLoading && user && profile) {
      router.replace("/dashboard");
    }
  }, [authLoading, profile, profileLoading, router, user]);

  if (authLoading) {
    return <LoadingState message="Loading onboarding..." />;
  }

  if (!user) {
    return null;
  }

  if (profileLoading && !profile) {
    return <LoadingState message="Loading onboarding..." />;
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mx-auto max-w-3xl space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle>Onboarding profile</CardTitle>
            <CardDescription>
              This profile powers insurance eligibility suggestions, cost estimates, and care recommendations.
            </CardDescription>
          </CardHeader>
          <ProfileForm
            initialProfile={profile ?? undefined}
            submitLabel="Save profile and continue"
            onSubmit={async (nextProfile) => {
              await saveUserProfile(user.uid, nextProfile);
              await refreshProfile();
              router.replace("/dashboard");
            }}
          />
        </Card>
      </motion.div>
    </AppShell>
  );
}
