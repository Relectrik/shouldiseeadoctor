"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { saveUserProfile } from "@/firebase/data";
import { useAppSession } from "@/lib/use-app-session";
import { AppShell } from "@/components/common/app-shell";
import { LoadingState } from "@/components/common/loading-state";
import { useAuth } from "@/components/providers/auth-provider";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, authLoading, profileLoading, refreshProfile } = useAppSession();
  const { logout } = useAuth();

  if (authLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mx-auto max-w-3xl space-y-5"
      >
        <Card>
          <CardHeader>
            <CardTitle>Profile settings</CardTitle>
            <CardDescription>
              Update details used for insurance eligibility and cost-aware care recommendations.
            </CardDescription>
          </CardHeader>
          {profile ? (
            <ProfileForm
              initialProfile={profile}
              submitLabel="Save profile"
              onSubmit={async (nextProfile) => {
                await saveUserProfile(user.uid, nextProfile);
                await refreshProfile();
              }}
            />
          ) : (
            <div className="space-y-3 p-6 pt-0">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-40" />
              {!profileLoading ? (
                <p className="text-sm text-muted-foreground">
                  No profile found yet. You will be redirected to onboarding.
                </p>
              ) : null}
            </div>
          )}
        </Card>

        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-card-foreground">Account</h3>
            <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
          </div>
          <GradientButton
            variant="secondary"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            Logout
          </GradientButton>
        </Card>
      </motion.div>
    </AppShell>
  );
}
