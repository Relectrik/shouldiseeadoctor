import { NextRequest, NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";

const MODEL_NAME = "nvidia/nemotron-nano-12b-v2-vl:free";

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

interface ParsedLineItem {
  item: string;
  charged: number;
}

interface ParsedLineItemsResponse {
  lineItems?: Array<{
    item?: unknown;
    charged?: unknown;
  }>;
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

function parseModelLineItems(rawText: string): ParsedLineItem[] {
  const jsonPayload = extractJsonPayload(rawText);
  if (!jsonPayload) {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonPayload) as ParsedLineItemsResponse;
    if (!Array.isArray(parsed.lineItems)) {
      return [];
    }

    return parsed.lineItems
      .map((entry) => {
        const item = toNonEmptyString(entry.item);
        const charged = Number(entry.charged);
        if (!item || !Number.isFinite(charged) || charged <= 0) {
          return null;
        }
        return {
          item,
          charged: Number(charged.toFixed(2)),
        };
      })
      .filter((entry): entry is ParsedLineItem => Boolean(entry));
  } catch {
    return [];
  }
}

function parseLineItemsFromPlainText(rawText: string): ParsedLineItem[] {
  return rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match =
        line.match(/^(.*?)\s*[:\-]\s*\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)$/) ??
        line.match(/^(.*?)\s+\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)$/);
      if (!match) {
        return null;
      }
      const item = toNonEmptyString(match[1]);
      const charged = Number(match[2].replaceAll(",", ""));
      if (!item || !Number.isFinite(charged)) {
        return null;
      }
      return { item, charged: Number(charged.toFixed(2)) };
    })
    .filter((entry): entry is ParsedLineItem => Boolean(entry));
}

function serializeLineItems(items: ParsedLineItem[]): string {
  return items.map((entry) => `${entry.item}: $${entry.charged}`).join("\n");
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "OpenRouter API key not configured." }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Receipt upload supports image files for AI parsing. For PDF, enter line items manually." },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const prompt = `Extract every medical bill line item from this receipt image.
Return ONLY valid JSON in this shape:
{
  "lineItems": [
    { "item": "X-ray", "charged": 480 }
  ]
}

Rules:
- Include only individual billable charges.
- Exclude totals, subtotals, taxes, insurance adjustments, and payments.
- charged must be a number without currency symbols.
- If nothing is legible, return {"lineItems":[]}.`;

    const stream = await openrouter.chat.send({
      chatGenerationParams: {
        model: MODEL_NAME,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", imageUrl: { url: dataUrl } },
            ],
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

    const parsedFromJson = parseModelLineItems(rawResponse);
    const parsedFromLines = parsedFromJson.length > 0 ? parsedFromJson : parseLineItemsFromPlainText(rawResponse);
    if (parsedFromLines.length === 0) {
      return NextResponse.json(
        { error: "Could not extract charges from this file. Try entering them manually." },
        { status: 422 },
      );
    }

    return NextResponse.json({
      lineItems: serializeLineItems(parsedFromLines),
    });
  } catch (error) {
    console.error("Receipt parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse receipt. Please try again or enter line items manually." },
      { status: 500 },
    );
  }
}
