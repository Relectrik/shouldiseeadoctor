"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthCard } from "@/components/common/auth-card";
import { FirebaseModeBadge } from "@/components/common/firebase-mode-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getUserProfile } from "@/firebase/data";

async function routeAfterAuth(userId: string, navigate: (path: string) => void) {
  try {
    const profile = await getUserProfile(userId);
    navigate(profile ? "/dashboard" : "/onboarding");
  } catch {
    navigate("/onboarding");
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInGoogle, user, loading } = useAuth();

  useEffect(() => {
    router.prefetch("/dashboard");
    router.prefetch("/onboarding");
  }, [router]);

  useEffect(() => {
    if (!loading && user) {
      void routeAfterAuth(user.uid, (path) => router.replace(path));
    }
  }, [loading, router, user]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(30,45,90,0.06),_transparent_36%),radial-gradient(circle_at_75%_18%,_rgba(232,84,58,0.05),_transparent_38%),var(--background)] px-4 py-10">
      <div className="mx-auto mb-4 flex w-full max-w-5xl justify-end">
        <ThemeToggle />
      </div>
      <div className="mx-auto grid w-full max-w-5xl items-start gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <FirebaseModeBadge />
        </div>
        <AuthCard
          title="Welcome back"
          description="Sign in to continue your healthcare navigation dashboard."
          submitLabel="Log in"
          footerPrompt="New here?"
          footerLinkLabel="Create an account"
          footerHref="/signup"
          onGoogleSubmit={async () => {
            const signedIn = await signInGoogle();
            await routeAfterAuth(signedIn.uid, (path) => router.replace(path));
          }}
          googleSubmitLabel="Sign in with Google"
          onSubmit={async (email, password) => {
            const signedIn = await signIn(email, password);
            await routeAfterAuth(signedIn.uid, (path) => router.replace(path));
          }}
        />
      </div>
    </div>
  );
}
