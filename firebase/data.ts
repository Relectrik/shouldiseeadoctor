import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

import { SymptomCheckRecord, UserProfile } from "@/lib/types";

import { db, isFirebaseConfigured } from "./config";

const LOCAL_USERS_KEY = "siad-users";
const LOCAL_SYMPTOM_CHECKS_KEY = "siad-symptom-checks";

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getCachedUserProfile(userId: string): UserProfile | null {
  const users = readLocal<Record<string, UserProfile>>(LOCAL_USERS_KEY, {});
  return users[userId] ?? null;
}

export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  const users = readLocal<Record<string, UserProfile>>(LOCAL_USERS_KEY, {});
  users[userId] = profile;

  if (!isFirebaseConfigured || !db) {
    writeLocal(LOCAL_USERS_KEY, users);
    return;
  }

  try {
    await setDoc(doc(db, "users", userId), {
      ...profile,
      updatedAt: Date.now(),
    });
  } finally {
    // Keep a local backup to preserve flow when Firestore rules/config are incomplete.
    writeLocal(LOCAL_USERS_KEY, users);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const users = readLocal<Record<string, UserProfile>>(LOCAL_USERS_KEY, {});

  if (!isFirebaseConfigured || !db) {
    return users[userId] ?? null;
  }

  try {
    const snapshot = await getDoc(doc(db, "users", userId));
    if (!snapshot.exists()) {
      return users[userId] ?? null;
    }
    const data = snapshot.data();
    const profile = {
      age: Number(data.age),
      gender: data.gender,
      state: data.state,
      zipCode: data.zipCode,
      employmentStatus: data.employmentStatus,
      incomeBracket: data.incomeBracket,
      studentStatus: Boolean(data.studentStatus),
      insuranceStatus: data.insuranceStatus,
      familySize: Number(data.familySize),
    } as UserProfile;
    users[userId] = profile;
    writeLocal(LOCAL_USERS_KEY, users);
    return profile;
  } catch {
    return users[userId] ?? null;
  }
}

export async function saveSymptomCheck(
  input: Omit<SymptomCheckRecord, "id" | "createdAt">,
): Promise<SymptomCheckRecord> {
  const record: SymptomCheckRecord = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const checks = readLocal<SymptomCheckRecord[]>(LOCAL_SYMPTOM_CHECKS_KEY, []);
  const nextChecks = [record, ...checks];

  if (!isFirebaseConfigured || !db) {
    writeLocal(LOCAL_SYMPTOM_CHECKS_KEY, nextChecks);
    return record;
  }

  try {
    await addDoc(collection(db, "symptomChecks"), record);
  } finally {
    writeLocal(LOCAL_SYMPTOM_CHECKS_KEY, nextChecks);
  }
  return record;
}

export async function getRecentSymptomChecks(
  userId: string,
  limitCount = 5,
): Promise<SymptomCheckRecord[]> {
  const localChecks = readLocal<SymptomCheckRecord[]>(LOCAL_SYMPTOM_CHECKS_KEY, []);
  const fallback = localChecks.filter((check) => check.userId === userId).slice(0, limitCount);

  if (!isFirebaseConfigured || !db) {
    return fallback;
  }

  try {
    const checksQuery = query(collection(db, "symptomChecks"), where("userId", "==", userId));
    const snapshot = await getDocs(checksQuery);
    return snapshot.docs
      .map((entry) => entry.data() as SymptomCheckRecord)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limitCount);
  } catch {
    return fallback;
  }
}
