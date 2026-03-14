import { StructuredSymptoms, TriageResult } from "@/lib/types";

const severeKeywords = ["severe", "unbearable", "worst", "cannot move", "can't breathe", "fainting"];
const moderateKeywords = ["moderate", "swelling", "persistent", "worse", "throbbing"];
const mildKeywords = ["mild", "slight", "minor"];

function detectDuration(input: string): string {
  const lower = input.toLowerCase();
  const dayMatch = lower.match(/(\d+)\s*(day|days)/);
  const hourMatch = lower.match(/(\d+)\s*(hour|hours|hr|hrs)/);
  const weekMatch = lower.match(/(\d+)\s*(week|weeks)/);

  if (hourMatch) {
    return `${hourMatch[1]} hour${hourMatch[1] === "1" ? "" : "s"}`;
  }

  if (dayMatch) {
    return `${dayMatch[1]} day${dayMatch[1] === "1" ? "" : "s"}`;
  }

  if (weekMatch) {
    return `${weekMatch[1]} week${weekMatch[1] === "1" ? "" : "s"}`;
  }

  if (lower.includes("today") || lower.includes("yesterday")) {
    return "1 day";
  }

  return "Unknown";
}

function detectPainLocation(input: string): string {
  const lower = input.toLowerCase();
  const locations = [
    "ankle",
    "knee",
    "chest",
    "head",
    "throat",
    "back",
    "stomach",
    "abdomen",
    "arm",
    "leg",
    "shoulder",
  ];

  const found = locations.find((location) => lower.includes(location));
  return found ?? "general";
}

function detectSeverity(input: string): StructuredSymptoms["severity"] {
  const lower = input.toLowerCase();
  if (severeKeywords.some((keyword) => lower.includes(keyword))) {
    return "severe";
  }
  if (moderateKeywords.some((keyword) => lower.includes(keyword))) {
    return "moderate";
  }
  if (mildKeywords.some((keyword) => lower.includes(keyword))) {
    return "mild";
  }

  // Slightly conservative default.
  return "moderate";
}

export function parseSymptomsFromText(input: string): StructuredSymptoms {
  const lower = input.toLowerCase();
  return {
    painLocation: detectPainLocation(lower),
    severity: detectSeverity(lower),
    duration: detectDuration(lower),
    swelling: lower.includes("swelling") || lower.includes("swollen"),
    chestPain: lower.includes("chest pain") || (lower.includes("chest") && lower.includes("pain")),
    breathingDifficulty:
      lower.includes("breathing difficulty") ||
      lower.includes("shortness of breath") ||
      lower.includes("can't breathe") ||
      lower.includes("cannot breathe"),
    fever: lower.includes("fever") || lower.includes("temperature"),
    cough: lower.includes("cough"),
  };
}

function likelyCauses(structured: StructuredSymptoms): string[] {
  if (structured.painLocation === "ankle" && structured.swelling) {
    return ["Mild ankle sprain", "Ligament strain", "Minor inflammation"];
  }
  if (structured.cough && structured.fever) {
    return ["Upper respiratory irritation", "Seasonal viral infection", "Airway inflammation"];
  }
  if (structured.fever) {
    return ["Mild viral illness", "Short-term inflammatory response", "Minor dehydration-related symptoms"];
  }
  if (structured.painLocation === "back") {
    return ["Muscle strain", "Posture-related tension", "Minor soft-tissue inflammation"];
  }
  return ["Minor strain", "Short-term inflammation", "Non-specific mild condition"];
}

function durationInHours(duration: string): number | null {
  const lower = duration.toLowerCase();
  const dayMatch = lower.match(/(\d+)\s*day/);
  const hourMatch = lower.match(/(\d+)\s*hour/);
  if (hourMatch) {
    return Number(hourMatch[1]);
  }
  if (dayMatch) {
    return Number(dayMatch[1]) * 24;
  }
  return null;
}

export function getTriageRecommendation(
  structured: StructuredSymptoms,
  rawInput: string,
): TriageResult {
  const lower = rawInput.toLowerCase();
  const causes = likelyCauses(structured);
  const durationHours = durationInHours(structured.duration);

  if (structured.breathingDifficulty || structured.chestPain) {
    return {
      triageLevel: "SEVERE",
      primaryRecommendation: "Emergency Room",
      possibleCauses: causes,
      escalationAdvice: "Seek immediate emergency care now, especially if symptoms worsen suddenly.",
    };
  }

  if (
    structured.severity === "severe" ||
    lower.includes("faint") ||
    lower.includes("confusion") ||
    lower.includes("seizure")
  ) {
    return {
      triageLevel: "SEVERE",
      primaryRecommendation: "Emergency Room",
      possibleCauses: causes,
      escalationAdvice: "Use emergency services if severe pain or neurological symptoms are present.",
    };
  }

  if (
    (structured.severity === "moderate" && structured.swelling) ||
    (structured.cough && structured.fever && durationHours !== null && durationHours >= 72)
  ) {
    return {
      triageLevel: "URGENT",
      primaryRecommendation: "Urgent Care",
      possibleCauses: causes,
      escalationAdvice: "Escalate to emergency care for chest pain, shortness of breath, or rapidly worsening symptoms.",
    };
  }

  if (
    structured.severity === "moderate" ||
    (structured.fever && durationHours !== null && durationHours >= 24)
  ) {
    return {
      triageLevel: "MODERATE",
      primaryRecommendation: "Telehealth",
      possibleCauses: causes,
      escalationAdvice: "Escalate to urgent care if symptoms do not improve within 24 hours.",
    };
  }

  if (
    structured.severity === "mild" &&
    (durationHours === null || durationHours < 48) &&
    !structured.fever &&
    !structured.swelling
  ) {
    return {
      triageLevel: "MILD",
      primaryRecommendation: "Self Care",
      possibleCauses: causes,
      escalationAdvice: "Escalate if pain worsens, fever develops, or symptoms persist beyond 48 hours.",
    };
  }

  return {
    triageLevel: "MODERATE",
    primaryRecommendation: "Telehealth",
    possibleCauses: causes,
    escalationAdvice: "Use urgent care if pain or functional limitations worsen.",
  };
}
