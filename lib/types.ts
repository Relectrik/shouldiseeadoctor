export type IncomeBracket =
  | "under_25k"
  | "25k_50k"
  | "50k_100k"
  | "100k_plus";

export type EmploymentStatus =
  | "employed_full_time"
  | "employed_part_time"
  | "self_employed"
  | "unemployed";

export type InsuranceStatus = "insured" | "uninsured" | "unknown";

export interface UserProfile {
  age: number;
  gender: "female" | "male" | "non_binary" | "prefer_not_to_say";
  state: string;
  zipCode: string;
  employmentStatus: EmploymentStatus;
  incomeBracket: IncomeBracket;
  studentStatus: boolean;
  insuranceStatus: InsuranceStatus;
  familySize: number;
}

export interface StructuredSymptoms {
  painLocation: string;
  severity: "mild" | "moderate" | "severe";
  duration: string;
  swelling: boolean;
  chestPain: boolean;
  breathingDifficulty: boolean;
  fever: boolean;
  cough: boolean;
}

export type TriageLevel = "MILD" | "MODERATE" | "URGENT" | "SEVERE";

export interface TriageResult {
  triageLevel: TriageLevel;
  primaryRecommendation: "Self Care" | "Telehealth" | "Urgent Care" | "Emergency Room";
  possibleCauses: string[];
  escalationAdvice: string;
}

export interface CareRouteOption {
  option: "Self Care" | "Telehealth" | "Urgent Care" | "Emergency Room";
  estimatedCost: string;
  whenToUse: string;
  typicalWaitTime: string;
  escalationTrigger: string;
}

export interface SymptomCheckRecord {
  id: string;
  userId: string;
  rawSymptoms: string;
  structuredSymptoms: StructuredSymptoms;
  triage: TriageResult;
  careRoute: CareRouteOption[];
  createdAt: number;
}

export interface InsuranceRecommendation {
  planName: string;
  qualifiesIf: string;
  whyItFits: string;
  nextSteps: string;
}

export interface BillLineItem {
  item: string;
  charged: number;
}

export type BillFlag = "HIGH" | "LOW" | "OK" | "UNKNOWN";

export interface BillAnalysisItem extends BillLineItem {
  typicalRange: string;
  flag: BillFlag;
}

export interface AppUser {
  uid: string;
  email: string;
  isDemo?: boolean;
}
