import { procedureCostRanges } from "@/data/procedureCosts";
import { BillAnalysisItem, BillLineItem } from "@/lib/types";

const normalizeName = (value: string) => value.trim().toLowerCase();

export function parseManualCharges(rawInput: string): BillLineItem[] {
  return rawInput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [itemSegment, amountSegment] = line.split(":");
      const item = itemSegment?.trim();
      const numeric = amountSegment?.replace(/\$/g, "").replace(/,/g, "").trim();
      const charged = Number(numeric);

      if (!item || Number.isNaN(charged)) {
        return null;
      }

      return { item, charged };
    })
    .filter((entry): entry is BillLineItem => Boolean(entry));
}

export function analyzeBillItems(items: BillLineItem[]): BillAnalysisItem[] {
  return items.map((entry) => {
    const normalized = normalizeName(entry.item);
    const typical = procedureCostRanges[normalized];

    if (!typical) {
      return {
        ...entry,
        typicalRange: "No benchmark in demo dataset",
        flag: "UNKNOWN",
      };
    }

    const [min, max] = typical;
    const typicalRange = `$${min}-$${max}`;

    if (entry.charged > max) {
      return {
        ...entry,
        typicalRange,
        flag: "HIGH",
      };
    }

    if (entry.charged < min) {
      return {
        ...entry,
        typicalRange,
        flag: "LOW",
      };
    }

    return {
      ...entry,
      typicalRange,
      flag: "OK",
    };
  });
}

export function getDisputableCharges(analyzed: BillAnalysisItem[]): string[] {
  const highFlags = analyzed.filter((item) => item.flag === "HIGH").map((item) => item.item);

  if (highFlags.length === 0) {
    return [];
  }

  return highFlags.map(
    (item) => `${item}: request an itemized explanation and ask for pricing review.`,
  );
}
