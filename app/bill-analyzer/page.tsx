"use client";

import { useEffect, useRef, useState, type ChangeEvent, type InputHTMLAttributes } from "react";
import { motion } from "framer-motion";

import { BillAnalysisItem } from "@/lib/types";
import { useAppSession } from "@/lib/use-app-session";
import { AppShell } from "@/components/common/app-shell";
import { LoadingState } from "@/components/common/loading-state";
import { BillAnalysisTable } from "@/components/bill/analysis-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TimelineUpload, UploadFile } from "@/components/ui/timeline-upload";

const directoryInputProps = {
  directory: "",
  webkitdirectory: "",
} as unknown as InputHTMLAttributes<HTMLInputElement>;

export default function BillAnalyzerPage() {
  const { user, profile, authLoading, profileLoading } = useAppSession();
  const [rawInput, setRawInput] = useState("");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const folderRef = useRef<HTMLInputElement | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BillAnalysisItem[] | null>(null);
  const [disputable, setDisputable] = useState<string[]>([]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setFiles((prev) =>
        prev.map((entry) =>
          entry.status === "uploading"
            ? {
                ...entry,
                progress: Math.min(entry.progress + 15, 95),
              }
            : entry,
        ),
      );
    }, 800);
    return () => window.clearInterval(intervalId);
  }, []);

  if (authLoading) {
    return <LoadingState message="Loading bill analyzer..." />;
  }

  if (!user) {
    return null;
  }

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
    if (selectedFiles.length === 0) {
      return;
    }

    setParseError("");
    const newFiles: UploadFile[] = selectedFiles.map((selectedFile) => ({
      id: crypto.randomUUID(),
      file: selectedFile,
      progress: 0,
      status: "uploading",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    setIsParsing(true);

    for (const uploadFile of newFiles) {
      const formData = new FormData();
      formData.append("file", uploadFile.file);

      try {
        const res = await fetch("/api/parse-bill", {
          method: "POST",
          body: formData,
        });

        const data = (await res.json()) as {
          lineItems?: string;
          error?: string;
        };

        if (!res.ok || typeof data.lineItems !== "string") {
          throw new Error(data.error || "Failed to parse file.");
        }

        const nextLines = data.lineItems.trim();
        if (nextLines) {
          setRawInput((prev) => (prev.trim() ? `${prev.trim()}\n${nextLines}` : nextLines));
        }
      } catch (parseFailure) {
        const message = parseFailure instanceof Error ? parseFailure.message : "Something went wrong reading the file.";
        setParseError(message);
      } finally {
        setFiles((prev) =>
          prev.map((entry) =>
            entry.id === uploadFile.id
              ? {
                  ...entry,
                  progress: 100,
                  status: "done",
                }
              : entry,
          ),
        );
      }
    }

    setIsParsing(false);
    event.target.value = "";
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((entry) => entry.id !== id));
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

          <div className="space-y-3">
            <Label htmlFor="bill-file-upload">Upload receipt image (optional)</Label>
            <input
              id="bill-file-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={inputRef}
              onChange={handleFileSelect}
            />
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={folderRef}
              onChange={handleFileSelect}
              {...directoryInputProps}
            />
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => inputRef.current?.click()} disabled={isParsing}>
                Upload Files
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => folderRef.current?.click()}
                disabled={isParsing}
              >
                Upload Folder
              </Button>
            </div>
            {files.length > 0 ? (
              <TimelineUpload files={files} onRemove={handleRemoveFile} />
            ) : (
              <p className="text-xs text-muted-foreground">
                Upload a receipt photo - line items will be extracted automatically.
              </p>
            )}
            {isParsing ? <p className="text-xs text-primary">Reading your bill...</p> : null}
            {parseError ? <p className="text-sm text-destructive">{parseError}</p> : null}
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
