"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

import { getCareRouteCostsByState } from "@/data/costs";
import { saveSymptomCheck } from "@/firebase/data";
import { getTriageRecommendation, parseSymptomsFromText } from "@/lib/triage";
import { CareRouteOption, TriageResult } from "@/lib/types";
import { useAppSession } from "@/lib/use-app-session";
import { AppShell } from "@/components/common/app-shell";
import { LoadingState } from "@/components/common/loading-state";
import { CareRouteTable } from "@/components/symptom/care-route-table";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface SymptomResult {
  triage: TriageResult;
  careRoute: CareRouteOption[];
}

function triageBadge(urgency: TriageResult["triageLevel"]) {
  if (urgency === "SEVERE") return <Badge variant="danger">SEVERE</Badge>;
  if (urgency === "URGENT") return <Badge variant="warning">URGENT</Badge>;
  if (urgency === "MODERATE") return <Badge variant="primary">MODERATE</Badge>;
  return <Badge variant="success">MILD</Badge>;
}

export default function SymptomCheckPage() {
  const { user, profile, authLoading, profileLoading } = useAppSession();
  const [symptomText, setSymptomText] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const liveTranscriptRef = useRef("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTyping || !voiceTranscript) return;
    setSymptomText("");
    let i = 0;
    const interval = setInterval(() => {
      setSymptomText(voiceTranscript.slice(0, i + 1));
      i++;
      if (i >= voiceTranscript.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [voiceTranscript, isTyping]);

  if (authLoading) {
    return <LoadingState message="Loading symptom check..." />;
  }

  if (!user) {
    return null;
  }

  const analyzeSymptoms = async () => {
    setError(null);
    if (!symptomText.trim()) {
      setError("Please describe your symptoms before analyzing.");
      return;
    }
    if (!profile) {
      setError("Complete onboarding profile first to enable state-aware recommendations.");
      return;
    }

    const structured = parseSymptomsFromText(symptomText);
    setSubmitting(true);
    try {
      let triage: TriageResult;
      let careRoute: CareRouteOption[];

      try {
        const response = await fetch("/api/symptom-triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symptoms: symptomText,
            city: profile.city ?? "",
            state: profile.state,
            zipCode: profile.zipCode,
          }),
        });

        if (!response.ok) {
          throw new Error("LLM triage call failed");
        }

        const payload = (await response.json()) as {
          triage?: TriageResult;
          careRoute?: CareRouteOption[];
        };

        if (!payload.triage || !Array.isArray(payload.careRoute) || payload.careRoute.length === 0) {
          throw new Error("Malformed LLM triage response");
        }

        triage = payload.triage;
        careRoute = payload.careRoute;
      } catch {
        // Keep a local deterministic fallback so symptom checks remain usable.
        triage = getTriageRecommendation(structured, symptomText);
        careRoute = getCareRouteCostsByState(profile.state);
        setError("AI analysis was unavailable. Showing backup rule-based guidance.");
      }

      setResult({ triage, careRoute });

      await saveSymptomCheck({
        userId: user.uid,
        rawSymptoms: symptomText,
        structuredSymptoms: structured,
        triage,
        careRoute,
      });
    } catch {
      setError("Your result is shown, but we could not save this activity right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">What symptoms are you experiencing?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Describe symptoms in natural language. The app uses AI-assisted triage while keeping safety-first urgency categories.
            </p>
          </div>

          <Textarea
            value={symptomText}
            onChange={(event) => setSymptomText(event.target.value)}
            placeholder="I twisted my ankle playing basketball and it hurts when I walk..."
            className="min-h-[150px]"
          />

          <div className="flex items-center gap-3 my-4">
            <hr className="flex-1" style={{ borderColor: "#e2e6f0" }} />
            <span className="text-xs" style={{ color: "#6b7280" }}>or speak your symptoms</span>
            <hr className="flex-1" style={{ borderColor: "#e2e6f0" }} />
          </div>

          <AIVoiceInput
            onStart={() => {
              setSymptomText("");
              liveTranscriptRef.current = "";
            }}
            onStop={(duration, finalTranscript) => {
              console.log("Stopped after", duration, "seconds");
              const final = finalTranscript ?? liveTranscriptRef.current;
              if (final) {
                setVoiceTranscript(final);
                setIsTyping(true);
              }
            }}
            onTranscript={(text) => {
              liveTranscriptRef.current = text;
            }}
          />

          <div className="flex flex-wrap items-center gap-2">
            <GradientButton onClick={analyzeSymptoms} disabled={submitting}>
              {submitting ? "Analyzing..." : "Analyze symptoms"}
            </GradientButton>
            <p className="text-xs text-muted-foreground">
              Location context: {profile?.city ? `${profile.city}, ${profile.state}` : profile?.state ?? "Loading..."}
            </p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </Card>

        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="space-y-4"
          >
            <Card className="space-y-4">
              <div className="flex items-center gap-2">
                {triageBadge(result.triage.triageLevel)}
                <h3 className="text-lg font-semibold text-card-foreground">
                  Recommended treatment: {result.triage.primaryRecommendation}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">{result.triage.escalationAdvice}</p>

              <div>
                <h4 className="text-sm font-semibold text-card-foreground">Possible causes (non-diagnostic)</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {result.triage.possibleCauses.map((cause) => (
                    <li key={cause}>{cause}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-card-foreground">Treatment options and average pricing</h4>
                <CareRouteTable
                  routes={result.careRoute}
                  recommendation={result.triage.primaryRecommendation}
                />
              </div>
            </Card>
          </motion.div>
        ) : (
          profileLoading && !profile ? (
            <Card>
              <h3 className="mb-2 text-base font-semibold text-card-foreground">Preparing your triage context</h3>
              <div className="space-y-3">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-24 w-full" />
              </div>
            </Card>
          ) : null
        )}
      </div>
    </AppShell>
  );
}
