"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  getInitialAuthUser,
  logOut,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  subscribeToAuthChanges,
} from "@/firebase/auth";
import { AppUser } from "@/lib/types";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<AppUser>;
  signIn: (email: string, password: string) => Promise<AppUser>;
  signInGoogle: () => Promise<AppUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialUser = getInitialAuthUser();
  const [user, setUser] = useState<AppUser | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signUp: async (email: string, password: string) => {
        const nextUser = await signUpWithEmail(email, password);
        setUser(nextUser);
        return nextUser;
      },
      signIn: async (email: string, password: string) => {
        const nextUser = await signInWithEmail(email, password);
        setUser(nextUser);
        return nextUser;
      },
      signInGoogle: async () => {
        const nextUser = await signInWithGoogle();
        setUser(nextUser);
        return nextUser;
      },
      logout: async () => {
        await logOut();
        setUser(null);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
