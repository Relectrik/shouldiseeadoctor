import { NextRequest, NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";

import { parseManualCharges } from "@/lib/bill-analyzer";
import { BillAnalysisItem, BillFlag } from "@/lib/types";

const MODEL_NAME = "arcee-ai/trinity-large-preview:free";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

interface OpenRouterStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

interface AnalyzeBillRequest {
  rawInput?: unknown;
  city?: unknown;
  state?: unknown;
}

interface InputLineItem {
  id: number;
  item: string;
  charged: number;
}

interface ModelEstimate {
  id?: unknown;
  averagePrice?: unknown;
}

interface ModelResponse {
  lineItems?: unknown;
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

function parseModelAverages(rawText: string): ModelEstimate[] {
  const jsonPayload = extractJsonPayload(rawText);
  if (!jsonPayload) {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonPayload) as ModelResponse;
    if (!Array.isArray(parsed.lineItems)) {
      return [];
    }
    return parsed.lineItems.filter((entry): entry is ModelEstimate => typeof entry === "object" && entry !== null);
  } catch {
    return [];
  }
}

function normalizeInputLineItems(rawInput: string): InputLineItem[] {
  return parseManualCharges(rawInput).map((entry, index) => ({
    id: index + 1,
    item: entry.item,
    charged: entry.charged,
  }));
}

function computeFlag(charged: number, averagePrice: number | null): { flag: BillFlag; differencePercent: number | null } {
  if (!averagePrice || averagePrice <= 0) {
    return { flag: "UNKNOWN", differencePercent: null };
  }

  const differencePercent = Number((((charged - averagePrice) / averagePrice) * 100).toFixed(1));
  if (differencePercent > 10) {
    return { flag: "HIGH", differencePercent };
  }
  if (differencePercent < -10) {
    return { flag: "LOW", differencePercent };
  }
  return { flag: "OK", differencePercent };
}

function buildPrompt(city: string, state: string, lineItems: InputLineItem[]): string {
  return `You are a US medical billing benchmark assistant.
Estimate average self-pay market prices for each line item for the following location:
- City: ${city}
- State: ${state}

Input line items (JSON):
${JSON.stringify(lineItems, null, 2)}

Return ONLY valid JSON in this shape:
{
  "lineItems": [
    { "id": 1, "averagePrice": 210 }
  ]
}

Rules:
- Include every input line item exactly once.
- Use the same id values as input.
- averagePrice must be a number in USD (no currency symbols) or null if unknown.
- Do not include markdown or additional text.`;
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "OpenRouter API key not configured." }, { status: 500 });
  }

  let body: AnalyzeBillRequest | null = null;
  try {
    body = (await req.json()) as AnalyzeBillRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawInput = toNonEmptyString(body?.rawInput);
  if (!rawInput) {
    return NextResponse.json({ error: "Please provide line items to analyze." }, { status: 400 });
  }

  const city = toNonEmptyString(body?.city) ?? "Unknown";
  const state = toNonEmptyString(body?.state)?.toUpperCase() ?? "CA";
  const inputItems = normalizeInputLineItems(rawInput);
  if (inputItems.length === 0) {
    return NextResponse.json({ error: "Could not parse line items. Use format Item: $Amount." }, { status: 400 });
  }

  try {
    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model: MODEL_NAME,
        messages: [
          {
            role: "user",
            content: buildPrompt(city, state, inputItems),
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

    const estimates = parseModelAverages(rawResponse);
    const estimateById = new Map<number, number | null>();
    for (const estimate of estimates) {
      const id = Number(estimate.id);
      const avg = estimate.averagePrice === null ? null : Number(estimate.averagePrice);
      if (!Number.isFinite(id) || id <= 0) {
        continue;
      }
      if (avg === null) {
        estimateById.set(id, null);
        continue;
      }
      if (Number.isFinite(avg) && avg > 0) {
        estimateById.set(id, Number(avg.toFixed(2)));
      }
    }

    const items: BillAnalysisItem[] = inputItems.map((entry) => {
      const averagePrice = estimateById.has(entry.id) ? estimateById.get(entry.id) ?? null : null;
      const { flag, differencePercent } = computeFlag(entry.charged, averagePrice);
      return {
        item: entry.item,
        charged: entry.charged,
        averagePrice,
        differencePercent,
        typicalRange: averagePrice ? `$${Math.round(averagePrice)}` : "Average unavailable",
        flag,
      };
    });

    const disputable = items
      .filter((entry) => entry.flag === "HIGH")
      .map((entry) => {
        const overBy = entry.differencePercent ?? 0;
        return `${entry.item}: charged $${entry.charged} is ${overBy}% above the local average.`;
      });

    return NextResponse.json({ items, disputable });
  } catch (error) {
    console.error("Analyze bill error:", error);
    return NextResponse.json({ error: "Unable to analyze bill right now. Please try again." }, { status: 500 });
  }
}
