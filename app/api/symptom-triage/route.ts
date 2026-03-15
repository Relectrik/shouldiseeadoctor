import { NextRequest, NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";

import { getCareRouteCostsByState } from "@/data/costs";
import { getTriageRecommendation, parseSymptomsFromText } from "@/lib/triage";
import { CareRouteOption, TriageLevel, TriageResult } from "@/lib/types";

const MODEL_NAME = "arcee-ai/trinity-large-preview:free";
const TREATMENT_OPTIONS: CareRouteOption["option"][] = [
  "Self Care",
  "Telehealth",
  "Urgent Care",
  "Emergency Room",
];
const TRIAGE_LEVELS: TriageLevel[] = ["MILD", "MODERATE", "URGENT", "SEVERE"];

const TRIAGE_SYSTEM_PROMPT = `You are a medical triage assistant for educational care navigation only.
Do not provide diagnosis certainty. Keep guidance concise and safety-first.
Use exactly these triage categories: MILD, MODERATE, URGENT, SEVERE.
Use exactly these treatment options: Self Care, Telehealth, Urgent Care, Emergency Room.

Return JSON only with this schema:
{
  "triageLevel": "MILD|MODERATE|URGENT|SEVERE",
  "recommendedTreatment": "Self Care|Telehealth|Urgent Care|Emergency Room",
  "possibleCauses": ["...", "...", "..."],
  "escalationAdvice": "...",
  "treatmentOptions": [
    {
      "option": "Self Care|Telehealth|Urgent Care|Emergency Room",
      "averagePrice": "$x-$y",
      "whenToUse": "...",
      "typicalWaitTime": "...",
      "escalationTrigger": "..."
    }
  ]
}

Rules:
- Include all four treatment options exactly once in treatmentOptions.
- averagePrice must be your best estimate for the user's city/state market context.
- Keep possibleCauses non-diagnostic and broad.
- No markdown, no code fences, no extra keys.`;

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

interface TriageRequestBody {
  symptoms?: unknown;
  city?: unknown;
  state?: unknown;
  zipCode?: unknown;
}

interface LlmTreatmentOption {
  option?: unknown;
  averagePrice?: unknown;
  whenToUse?: unknown;
  typicalWaitTime?: unknown;
  escalationTrigger?: unknown;
}

interface LlmTriageResponse {
  triageLevel?: unknown;
  recommendedTreatment?: unknown;
  possibleCauses?: unknown;
  escalationAdvice?: unknown;
  treatmentOptions?: unknown;
}

interface OpenRouterStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

function normalizeOption(value: unknown): CareRouteOption["option"] | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized.includes("self")) return "Self Care";
  if (normalized.includes("tele")) return "Telehealth";
  if (normalized.includes("urgent")) return "Urgent Care";
  if (normalized.includes("emergency") || normalized === "er" || normalized.includes("room")) {
    return "Emergency Room";
  }
  return null;
}

function normalizeTriageLevel(value: unknown): TriageLevel | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (TRIAGE_LEVELS.includes(normalized as TriageLevel)) {
    return normalized as TriageLevel;
  }
  return null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractJsonPayload(text: string): string | null {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1];
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  return text.slice(firstBrace, lastBrace + 1);
}

function buildFallbackResult(symptoms: string, state: string) {
  const structured = parseSymptomsFromText(symptoms);
  const triage = getTriageRecommendation(structured, symptoms);
  const careRoute = getCareRouteCostsByState(state);
  return { triage, careRoute };
}

function mergeTreatmentOptions(
  llmOptions: LlmTreatmentOption[] | null,
  fallbackOptions: CareRouteOption[],
): CareRouteOption[] {
  const mergedByOption = new Map<CareRouteOption["option"], CareRouteOption>();
  for (const fallback of fallbackOptions) {
    mergedByOption.set(fallback.option, { ...fallback });
  }

  if (llmOptions) {
    for (const rawOption of llmOptions) {
      const option = normalizeOption(rawOption.option);
      if (!option) {
        continue;
      }

      const fallback = mergedByOption.get(option);
      if (!fallback) {
        continue;
      }

      mergedByOption.set(option, {
        option,
        estimatedCost: toNonEmptyString(rawOption.averagePrice) ?? fallback.estimatedCost,
        whenToUse: toNonEmptyString(rawOption.whenToUse) ?? fallback.whenToUse,
        typicalWaitTime: toNonEmptyString(rawOption.typicalWaitTime) ?? fallback.typicalWaitTime,
        escalationTrigger: toNonEmptyString(rawOption.escalationTrigger) ?? fallback.escalationTrigger,
      });
    }
  }

  return TREATMENT_OPTIONS.map((option) => mergedByOption.get(option) ?? {
    option,
    estimatedCost: "Unknown",
    whenToUse: "See a licensed clinician for guidance.",
    typicalWaitTime: "Varies",
    escalationTrigger: "Escalate immediately for red-flag symptoms.",
  });
}

function parseLlmResponse(rawText: string): LlmTriageResponse | null {
  const jsonPayload = extractJsonPayload(rawText);
  if (!jsonPayload) {
    return null;
  }

  try {
    return JSON.parse(jsonPayload) as LlmTriageResponse;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: TriageRequestBody | null = null;
  try {
    body = (await req.json()) as TriageRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const symptoms = toNonEmptyString(body?.symptoms);
  if (!symptoms) {
    return NextResponse.json({ error: "Please provide symptoms to analyze." }, { status: 400 });
  }

  const state = toNonEmptyString(body?.state)?.toUpperCase() ?? "CA";
  const city = toNonEmptyString(body?.city) ?? "Unknown";
  const zipCode = toNonEmptyString(body?.zipCode) ?? "Unknown";
  const fallback = buildFallbackResult(symptoms, state);

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ triage: fallback.triage, careRoute: fallback.careRoute, source: "fallback" });
  }

  try {
    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model: MODEL_NAME,
        messages: [
          {
            role: "system",
            content: TRIAGE_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `Symptoms: ${symptoms}
Location:
- City: ${city}
- State: ${state}
- ZIP: ${zipCode}

Return only valid JSON with all treatment options and average prices for this location.`,
          },
        ],
        stream: true,
      },
    });

    let rawResponse = "";
    for await (const chunk of stream as AsyncIterable<OpenRouterStreamChunk>) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        rawResponse += content;
      }
    }

    const parsed = parseLlmResponse(rawResponse);
    if (!parsed) {
      return NextResponse.json({ triage: fallback.triage, careRoute: fallback.careRoute, source: "fallback" });
    }

    const triageLevel = normalizeTriageLevel(parsed.triageLevel) ?? fallback.triage.triageLevel;
    const primaryRecommendation =
      normalizeOption(parsed.recommendedTreatment) ?? fallback.triage.primaryRecommendation;
    const possibleCauses = Array.isArray(parsed.possibleCauses)
      ? parsed.possibleCauses
          .filter((entry): entry is string => typeof entry === "string")
          .map((entry) => entry.trim())
          .filter(Boolean)
          .slice(0, 5)
      : fallback.triage.possibleCauses;
    const escalationAdvice = toNonEmptyString(parsed.escalationAdvice) ?? fallback.triage.escalationAdvice;

    const llmOptions = Array.isArray(parsed.treatmentOptions)
      ? parsed.treatmentOptions.filter((entry): entry is LlmTreatmentOption => typeof entry === "object" && entry !== null)
      : null;

    const triage: TriageResult = {
      triageLevel,
      primaryRecommendation,
      possibleCauses: possibleCauses.length > 0 ? possibleCauses : fallback.triage.possibleCauses,
      escalationAdvice,
    };
    const careRoute = mergeTreatmentOptions(llmOptions, fallback.careRoute);

    return NextResponse.json({ triage, careRoute, source: "llm" });
  } catch (error) {
    console.error("Symptom triage LLM error:", error);
    return NextResponse.json({ triage: fallback.triage, careRoute: fallback.careRoute, source: "fallback" });
  }
}
