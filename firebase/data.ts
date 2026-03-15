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
const EMPLOYMENT_STATUSES: UserProfile["employmentStatus"][] = [
  "employed_full_time",
  "employed_part_time",
  "self_employed",
  "unemployed",
];
const INCOME_BRACKETS: UserProfile["incomeBracket"][] = [
  "under_25k",
  "25k_50k",
  "50k_100k",
  "100k_plus",
];
const INSURANCE_STATUSES: UserProfile["insuranceStatus"][] = ["insured", "uninsured", "unknown"];
const GENDER_OPTIONS: UserProfile["gender"][] = ["female", "male", "non_binary", "prefer_not_to_say"];

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

function stringOr(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function numberOr(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === "string" && options.includes(value as T) ? (value as T) : fallback;
}

function normalizeProfile(raw: unknown, fallback: UserProfile | null): UserProfile | null {
  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const source = raw as Record<string, unknown>;
  return {
    firstName: stringOr(source.firstName, fallback?.firstName ?? ""),
    lastName: stringOr(source.lastName, fallback?.lastName ?? ""),
    age: numberOr(source.age, fallback?.age ?? 25),
    gender: oneOf(source.gender, GENDER_OPTIONS, fallback?.gender ?? "prefer_not_to_say"),
    city: stringOr(source.city, fallback?.city ?? ""),
    state: stringOr(source.state, fallback?.state ?? "CA").toUpperCase(),
    zipCode: stringOr(source.zipCode, fallback?.zipCode ?? ""),
    employmentStatus: oneOf(
      source.employmentStatus,
      EMPLOYMENT_STATUSES,
      fallback?.employmentStatus ?? "employed_full_time",
    ),
    incomeBracket: oneOf(source.incomeBracket, INCOME_BRACKETS, fallback?.incomeBracket ?? "50k_100k"),
    studentStatus: typeof source.studentStatus === "boolean" ? source.studentStatus : (fallback?.studentStatus ?? false),
    insuranceStatus: oneOf(source.insuranceStatus, INSURANCE_STATUSES, fallback?.insuranceStatus ?? "unknown"),
    familySize: numberOr(source.familySize, fallback?.familySize ?? 1),
  };
}

export function getCachedUserProfile(userId: string): UserProfile | null {
  const users = readLocal<Record<string, unknown>>(LOCAL_USERS_KEY, {});
  return normalizeProfile(users[userId], null);
}

export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  const users = readLocal<Record<string, unknown>>(LOCAL_USERS_KEY, {});
  const normalizedProfile = normalizeProfile(profile, profile) ?? profile;
  users[userId] = normalizedProfile;

  if (!isFirebaseConfigured || !db) {
    writeLocal(LOCAL_USERS_KEY, users);
    return;
  }

  try {
    await setDoc(doc(db, "users", userId), {
      ...normalizedProfile,
      updatedAt: Date.now(),
    });
  } finally {
    // Keep a local backup to preserve flow when Firestore rules/config are incomplete.
    writeLocal(LOCAL_USERS_KEY, users);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const users = readLocal<Record<string, unknown>>(LOCAL_USERS_KEY, {});
  const cachedProfile = normalizeProfile(users[userId], null);

  if (!isFirebaseConfigured || !db) {
    return cachedProfile;
  }

  try {
    const snapshot = await getDoc(doc(db, "users", userId));
    if (!snapshot.exists()) {
      return cachedProfile;
    }
    const profile = normalizeProfile(snapshot.data(), cachedProfile);
    if (!profile) {
      return cachedProfile;
    }
    users[userId] = profile;
    writeLocal(LOCAL_USERS_KEY, users);
    return profile;
  } catch {
    return cachedProfile;
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
