"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { saveUserProfile } from "@/firebase/data";
import { toTitleCase } from "@/lib/format";
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
  const [editing, setEditing] = useState(false);

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
              Profile data is pulled from Firestore. Click Edit Profile to make changes.
            </CardDescription>
          </CardHeader>
          {profile ? (
            editing ? (
              <ProfileForm
                initialProfile={profile}
                submitLabel="Save profile changes"
                onSubmit={async (nextProfile) => {
                  await saveUserProfile(user.uid, nextProfile);
                  await refreshProfile();
                  setEditing(false);
                }}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <div className="space-y-4 p-6 pt-0">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">First Name</p>
                    <p className="text-sm font-medium text-card-foreground">{profile.firstName || "Not set"}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">Last Name</p>
                    <p className="text-sm font-medium text-card-foreground">{profile.lastName || "Not set"}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="text-sm font-medium text-card-foreground">{profile.age}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="text-sm font-medium text-card-foreground">{toTitleCase(profile.gender)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">City</p>
                    <p className="text-sm font-medium text-card-foreground">{profile.city || "Not set"}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">State</p>
                    <p className="text-sm font-medium text-card-foreground">{profile.state}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">ZIP Code</p>
                    <p className="text-sm font-medium text-card-foreground">{profile.zipCode}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">Employment Status</p>
                    <p className="text-sm font-medium text-card-foreground">{toTitleCase(profile.employmentStatus)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">Income Bracket</p>
                    <p className="text-sm font-medium text-card-foreground">{toTitleCase(profile.incomeBracket)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">Student Status</p>
                    <p className="text-sm font-medium text-card-foreground">{profile.studentStatus ? "Yes" : "No"}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">Insurance Status</p>
                    <p className="text-sm font-medium text-card-foreground">{toTitleCase(profile.insuranceStatus)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/35 p-3">
                    <p className="text-xs text-muted-foreground">Family Size</p>
                    <p className="text-sm font-medium text-card-foreground">{profile.familySize}</p>
                  </div>
                </div>
                <div>
                  <GradientButton onClick={() => setEditing(true)}>Edit profile</GradientButton>
                </div>
              </div>
            )
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
