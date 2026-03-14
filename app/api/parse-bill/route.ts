import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Disable Next.js built-in body parsing so formData() receives the raw stream
export const config = {
  api: { bodyParser: false },
};

const EXTRACT_PROMPT = `You are a medical bill parser. Extract ALL line items from this medical bill.
For each charge, output it on its own line in EXACTLY this format:
Item Name: $Amount

Rules:
- Include every single charge, fee, and service listed
- Use the exact item name from the bill
- Only include the dollar amount as a number (e.g. $480, not $480.00 or 480)
- Do not include taxes, totals, subtotals, insurance adjustments, or payments
- Do not include any explanation, headers, or extra text
- If you cannot find any charges, respond with: NO_CHARGES_FOUND`;

export async function POST(req: NextRequest) {
  // Step 4 — verify key is loaded
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured." },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("API key present:", !!process.env.OPENAI_API_KEY);
    console.log("File received:", file.name, file.type, file.size, "bytes");

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type;

    const isImage = mimeType.startsWith("image/");
    const isPDF = mimeType === "application/pdf";

    if (!isImage && !isPDF) {
      return NextResponse.json(
        { error: "Only image or PDF files are supported" },
        { status: 400 }
      );
    }

    let extractedText = "";

    // ── Images ────────────────────────────────────────────────────────────────
    if (isImage) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: "high",
                },
              },
              { type: "text", text: EXTRACT_PROMPT },
            ],
          },
        ],
        max_tokens: 1000,
      });
      extractedText = response.choices[0].message.content || "";

      // Step 3 — retry with a simpler prompt if the first pass returned nothing
      if (!extractedText || extractedText.trim().length < 5) {
        console.log("Image extraction returned empty — retrying with simpler prompt");
        const retry = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`,
                    detail: "high",
                  },
                },
                {
                  type: "text",
                  text: "List every dollar amount and its label from this image, one per line as: Label: $Amount",
                },
              ],
            },
          ],
          max_tokens: 800,
        });
        extractedText = retry.choices[0].message.content || "";
      }
    }

    // ── PDFs ──────────────────────────────────────────────────────────────────
    if (isPDF) {
      let uploadedFileId: string | null = null;

      try {
        // Upload the PDF to the OpenAI files API so the model can read it
        const uploadable = await toFile(
          new Blob([bytes], { type: "application/pdf" }),
          file.name,
          { type: "application/pdf" }
        );

        const uploaded = await openai.files.create({
          file: uploadable,
          purpose: "user_data",
        });

        uploadedFileId = uploaded.id;
        console.log("Uploaded file ID:", uploadedFileId);

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              // Cast needed: the SDK types lag behind the file content feature
              content: [
                { type: "file", file: { file_id: uploadedFileId } } as any,
                {
                  type: "text",
                  text: `Extract all medical bill line items from this document.
Output each charge on its own line in EXACTLY this format:
Item Name: $Amount
Only include individual charges. No totals, taxes, or insurance adjustments.
If no charges found, respond with: NO_CHARGES_FOUND`,
                },
              ],
            },
          ],
          max_tokens: 1000,
        });

        extractedText = response.choices[0].message.content || "";
      } finally {
        // Always clean up the uploaded file
        if (uploadedFileId) {
          try {
            await openai.files.delete(uploadedFileId);
            console.log("Deleted uploaded file:", uploadedFileId);
          } catch (delErr) {
            console.warn("Could not delete uploaded file:", uploadedFileId, delErr);
          }
        }
      }
    }

    // ── Result handling ───────────────────────────────────────────────────────
    console.log("Extracted text length:", extractedText.length);
    console.log("Extracted text preview:", extractedText.slice(0, 200));

    if (extractedText.includes("NO_CHARGES_FOUND") || !extractedText.trim()) {
      return NextResponse.json(
        { error: "Could not extract charges from this file. Try entering them manually." },
        { status: 422 }
      );
    }

    return NextResponse.json({ lineItems: extractedText.trim() });

  } catch (error: any) {
    // Step 2 — full error logging
    console.error("Full parse error:", JSON.stringify(error, null, 2));
    console.error("Error message:", error?.message);
    console.error("Error status:", error?.status);

    const userMessage =
      error?.status === 401
        ? "Invalid OpenAI API key. Check your .env.local file."
        : error?.status === 429
        ? "OpenAI rate limit reached. Please try again in a moment."
        : error?.status === 413
        ? "File is too large. Try a smaller image or a shorter PDF."
        : "Failed to parse bill. Please try again or enter charges manually.";

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
