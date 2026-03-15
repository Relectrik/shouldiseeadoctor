"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { BillAnalysisItem } from "@/lib/types";
import { useAppSession } from "@/lib/use-app-session";
import { AppShell } from "@/components/common/app-shell";
import { LoadingState } from "@/components/common/loading-state";
import { BillAnalysisTable } from "@/components/bill/analysis-table";
import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function BillAnalyzerPage() {
  const { user, profile, authLoading, profileLoading } = useAppSession();
  const [rawInput, setRawInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BillAnalysisItem[] | null>(null);
  const [disputable, setDisputable] = useState<string[]>([]);

  if (authLoading) {
    return <LoadingState message="Loading bill analyzer..." />;
  }

  if (!user) {
    return null;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError("");
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/parse-bill", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setParseError(data.error || "Failed to parse file.");
      } else {
        setRawInput(data.lineItems);
      }
    } catch {
      setParseError("Something went wrong reading the file.");
    } finally {
      setIsParsing(false);
    }
  };

  const runAnalysis = async () => {
    setError(null);
    if (!rawInput.trim()) {
      setError("Please enter at least one charge in the format Item: $Amount.");
      return;
    }
    if (!profile || !profile.city || !profile.state) {
      setError("Please complete your city and state in profile before AI bill analysis.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawInput,
          city: profile.city,
          state: profile.state,
        }),
      });

      const data = (await res.json()) as {
        items?: BillAnalysisItem[];
        disputable?: string[];
        error?: string;
      };

      if (!res.ok || !Array.isArray(data.items)) {
        setError(data.error || "Unable to analyze this bill right now.");
        return;
      }

      setItems(data.items);
      setDisputable(Array.isArray(data.disputable) ? data.disputable : []);
    } catch {
      setError("Unable to analyze this input right now. Please retry.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">I already saw a doctor!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a receipt and compare each charge against AI-estimated local averages for your city and state.
            </p>
          </div>
          <div className="rounded-xl border border-primary/35 bg-primary/10 p-3 text-sm text-foreground">
            Uploaded receipts are sent to an AI model for analysis. We do not store receipt files or bill contents in
            your app database.
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-file">Upload receipt image (optional)</Label>
            <Input
              id="bill-file"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isParsing}
            />
            {!file && !isParsing && (
              <p style={{ fontSize: "12px", color: "#8896b3", marginTop: "4px" }}>
                Upload a receipt photo — line items will be extracted automatically
              </p>
            )}
            {file && !isParsing && (
              <p className="text-xs text-muted-foreground">Selected file: {file.name}</p>
            )}
            {isParsing && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "8px",
                fontSize: "13px",
                color: "#e8543a",
              }}>
                <svg
                  width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Reading your bill...
              </div>
            )}
            {parseError && (
              <p style={{ color: "#b03318", fontSize: "13px", marginTop: "6px" }}>
                {parseError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-items">Line items</Label>
            <Textarea
              id="bill-items"
              className="min-h-[180px]"
              value={rawInput}
              onChange={(event) => setRawInput(event.target.value)}
              placeholder={"X-ray: $480\nFacility Fee: $900\nDoctor Visit: $350"}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <GradientButton onClick={runAnalysis} disabled={isAnalyzing || isParsing || profileLoading}>
              {isAnalyzing ? "Analyzing..." : "Analyze bill with AI"}
            </GradientButton>
          </div>
          <p className="text-xs text-muted-foreground">
            Location context: {profileLoading ? "Loading..." : (profile ? `${profile.city}, ${profile.state}` : "Not available")}
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </Card>

        {items ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="space-y-4"
          >
            <Card className="space-y-3">
              <h3 className="text-lg font-semibold text-card-foreground">Bill analysis output</h3>
              <BillAnalysisTable items={items} />
            </Card>
            <Card className="space-y-3">
              <h3 className="text-lg font-semibold text-card-foreground">Potentially disputable charges</h3>
              {disputable.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {disputable.map((line, index) => (
                    <li key={`${line}-${index}`}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No charges were more than 10% above estimated local average.</p>
              )}

              <div className="rounded-xl bg-muted/35 p-4 text-sm text-muted-foreground">
                <p className="mb-2 font-semibold text-card-foreground">Suggested actions</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Request an itemized bill with billing codes.</li>
                  <li>Contact the billing department and ask for a charge review.</li>
                  <li>Ask about financial assistance or self-pay discount policies.</li>
                </ul>
              </div>
            </Card>
          </motion.div>
        ) : null}
      </div>
    </AppShell>
  );
}
