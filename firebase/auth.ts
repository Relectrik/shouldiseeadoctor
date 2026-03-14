import {
  GoogleAuthProvider,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { AppUser } from "@/lib/types";

import { auth, isFirebaseConfigured } from "./config";

const DEMO_AUTH_KEY = "siad-demo-auth-user";
const googleProvider = new GoogleAuthProvider();

function userFromFirebase(user: FirebaseUser): AppUser {
  return {
    uid: user.uid,
    email: user.email ?? "unknown@example.com",
  };
}

function getDemoUser(): AppUser | null {
  if (typeof window === "undefined") {
    return null;
  }
  const saved = window.localStorage.getItem(DEMO_AUTH_KEY);
  return saved ? (JSON.parse(saved) as AppUser) : null;
}

function setDemoUser(user: AppUser | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (!user) {
    window.localStorage.removeItem(DEMO_AUTH_KEY);
    return;
  }
  window.localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(user));
}

export async function signUpWithEmail(email: string, password: string): Promise<AppUser> {
  if (!isFirebaseConfigured || !auth) {
    const demoUser: AppUser = {
      uid: `demo-${crypto.randomUUID()}`,
      email,
      isDemo: true,
    };
    setDemoUser(demoUser);
    return demoUser;
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return userFromFirebase(credential.user);
}

export async function signInWithEmail(email: string, password: string): Promise<AppUser> {
  if (!isFirebaseConfigured || !auth) {
    const existing = getDemoUser();
    const demoUser: AppUser = existing ?? {
      uid: "demo-user",
      email,
      isDemo: true,
    };
    setDemoUser(demoUser);
    return demoUser;
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  return userFromFirebase(credential.user);
}

export async function signInWithGoogle(): Promise<AppUser> {
  if (!isFirebaseConfigured || !auth) {
    const existing = getDemoUser();
    const demoUser: AppUser = existing ?? {
      uid: "demo-google-user",
      email: "demo.google.user@example.com",
      isDemo: true,
    };
    setDemoUser(demoUser);
    return demoUser;
  }

  const credential = await signInWithPopup(auth, googleProvider);
  return userFromFirebase(credential.user);
}

export function getInitialAuthUser(): AppUser | null {
  if (!isFirebaseConfigured || !auth) {
    return getDemoUser();
  }
  const current = auth.currentUser;
  return current ? userFromFirebase(current) : null;
}

export async function logOut(): Promise<void> {
  if (!isFirebaseConfigured || !auth) {
    setDemoUser(null);
    return;
  }
  await signOut(auth);
}

export function subscribeToAuthChanges(callback: (user: AppUser | null) => void): () => void {
  if (!isFirebaseConfigured || !auth) {
    callback(getDemoUser());
    return () => undefined;
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    callback(firebaseUser ? userFromFirebase(firebaseUser) : null);
  });
}
