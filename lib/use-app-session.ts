"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { getCachedUserProfile, getUserProfile } from "@/firebase/data";
import { UserProfile } from "@/lib/types";

interface SessionOptions {
  requireProfile?: boolean;
}

export function useAppSession(options: SessionOptions = {}) {
  const { requireProfile = true } = options;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    const cachedProfile = getCachedUserProfile(user.uid);
    if (cachedProfile) {
      setProfile(cachedProfile);
      setProfileLoading(false);
    } else {
      setProfileLoading(true);
    }

    try {
      const fetched = await getUserProfile(user.uid);
      setProfile(fetched);
    } catch {
      setProfile(cachedProfile ?? null);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.replace("/login");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!requireProfile || authLoading || profileLoading || !user) {
      return;
    }
    if (!profile && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [authLoading, pathname, profile, profileLoading, requireProfile, router, user]);

  return {
    user,
    profile,
    loading: authLoading,
    authLoading,
    profileLoading,
    refreshProfile: loadProfile,
  };
}
