import { InsuranceRecommendation, UserProfile } from "@/lib/types";

export function getInsuranceRecommendations(profile: UserProfile): InsuranceRecommendation[] {
  const recommendations: InsuranceRecommendation[] = [];

  if (profile.incomeBracket === "under_25k") {
    recommendations.push({
      planName: "Medicaid",
      qualifiesIf: "Low income based on state eligibility rules",
      whyItFits:
        "Your income bracket may meet state Medicaid thresholds, especially with household size considered.",
      nextSteps:
        "Check your state Medicaid portal, prepare income documents, and complete the online application.",
    });
  }

  if (profile.insuranceStatus === "uninsured") {
    recommendations.push({
      planName: "ACA Marketplace Plan",
      qualifiesIf: "Uninsured individuals during enrollment or qualifying life events",
      whyItFits:
        "Marketplace plans may offer premium tax credits and reduce out-of-pocket spending.",
      nextSteps:
        "Visit HealthCare.gov (or state exchange), compare Bronze/Silver options, and estimate subsidy eligibility.",
    });
  }

  if (profile.studentStatus) {
    recommendations.push({
      planName: "Student Health Plan",
      qualifiesIf: "Currently enrolled college or university students",
      whyItFits:
        "Campus plans can be lower-friction and include local provider networks near your school.",
      nextSteps:
        "Contact your school benefits office, compare waiver options, and confirm coverage start dates.",
    });
  }

  if (
    profile.employmentStatus === "employed_full_time" ||
    profile.employmentStatus === "employed_part_time"
  ) {
    recommendations.push({
      planName: "Employer-Sponsored Insurance",
      qualifiesIf: "Employees with eligible benefits enrollment",
      whyItFits:
        "Employer plans often reduce monthly costs through contributions and payroll deductions.",
      nextSteps:
        "Ask HR for plan summaries, compare deductibles and networks, and enroll during open enrollment windows.",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      planName: "Short-Term Navigation Support",
      qualifiesIf: "Anyone still exploring coverage",
      whyItFits:
        "A temporary strategy can prevent delayed care while you identify long-term coverage.",
      nextSteps:
        "Talk to a certified insurance navigator and review local community health resources.",
    });
  }

  return recommendations;
}
