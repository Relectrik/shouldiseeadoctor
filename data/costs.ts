import { CareRouteOption } from "@/lib/types";

const baseRanges = {
  selfCare: [0, 0],
  telehealth: [30, 80],
  urgentCare: [100, 200],
  emergencyRoom: [1000, 3000],
} as const;

export const stateCostMultipliers: Record<string, number> = {
  AL: 0.9,
  AK: 1.18,
  AZ: 0.95,
  AR: 0.88,
  CA: 1.26,
  CO: 1.12,
  CT: 1.15,
  DE: 1.04,
  FL: 0.98,
  GA: 0.93,
  HI: 1.2,
  ID: 0.92,
  IL: 1.05,
  IN: 0.9,
  IA: 0.88,
  KS: 0.89,
  KY: 0.87,
  LA: 0.89,
  ME: 1.06,
  MD: 1.14,
  MA: 1.17,
  MI: 0.93,
  MN: 1.03,
  MS: 0.85,
  MO: 0.91,
  MT: 0.94,
  NE: 0.9,
  NV: 1.02,
  NH: 1.08,
  NJ: 1.16,
  NM: 0.91,
  NY: 1.24,
  NC: 0.94,
  ND: 0.9,
  OH: 0.91,
  OK: 0.87,
  OR: 1.08,
  PA: 1.02,
  RI: 1.1,
  SC: 0.9,
  SD: 0.89,
  TN: 0.9,
  TX: 0.96,
  UT: 0.95,
  VT: 1.07,
  VA: 1.05,
  WA: 1.13,
  WV: 0.86,
  WI: 0.94,
  WY: 0.91,
};

const formatRange = ([min, max]: readonly [number, number]) => {
  if (min === max) {
    return `$${Math.round(min)}`;
  }
  return `$${Math.round(min)}-$${Math.round(max)}`;
};

const adjustRange = (range: readonly [number, number], multiplier: number) =>
  [range[0] * multiplier, range[1] * multiplier] as const;

export function getCareRouteCostsByState(state: string): CareRouteOption[] {
  const multiplier = stateCostMultipliers[state.toUpperCase()] ?? 1;

  return [
    {
      option: "Self Care",
      estimatedCost: formatRange(adjustRange(baseRanges.selfCare, multiplier)),
      whenToUse: "Mild symptoms and no red-flag signs",
      typicalWaitTime: "Immediate",
      escalationTrigger: "Pain worsens, fever appears, or symptoms last >48 hours",
    },
    {
      option: "Telehealth",
      estimatedCost: formatRange(adjustRange(baseRanges.telehealth, multiplier)),
      whenToUse: "Moderate symptoms, medication questions, follow-up advice",
      typicalWaitTime: "10-45 minutes",
      escalationTrigger: "No improvement after 24 hours or new warning signs appear",
    },
    {
      option: "Urgent Care",
      estimatedCost: formatRange(adjustRange(baseRanges.urgentCare, multiplier)),
      whenToUse: "Injuries, moderate pain, swelling, persistent symptoms",
      typicalWaitTime: "30-120 minutes",
      escalationTrigger: "Breathing difficulty, chest pain, severe bleeding, confusion",
    },
    {
      option: "Emergency Room",
      estimatedCost: formatRange(adjustRange(baseRanges.emergencyRoom, multiplier)),
      whenToUse: "Life-threatening symptoms or severe sudden changes",
      typicalWaitTime: "Immediate triage; total wait varies",
      escalationTrigger: "Already highest escalation path",
    },
  ];
}
