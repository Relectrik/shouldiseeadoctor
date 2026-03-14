"use client";

import { Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  onTranscript?: (text: string) => void;
  visualizerBars?: number;
  demoMode?: boolean;
  demoInterval?: number;
  className?: string;
}

const cleanTranscript = (text: string): string => {
  return text
    .trim()
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\bi\b/g, "I")
    .replace(/\bcant\b/g, "can't")
    .replace(/\bdont\b/g, "don't")
    .replace(/\bwont\b/g, "won't")
    .replace(/\bits\b/g, "it's")
    .replace(/\bim\b/gi, "I'm")
    .replace(/\bive\b/gi, "I've")
    .replace(/\bid\b/gi, "I'd")
    .replace(/\b(um|uh|like|you know|so)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

export function AIVoiceInput({
  onStart,
  onStop,
  onTranscript,
  visualizerBars = 48,
  demoMode = false,
  demoInterval = 3000,
  className
}: AIVoiceInputProps) {
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDemo, setIsDemo] = useState(demoMode);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (submitted) {
      onStart?.();
      intervalId = setInterval(() => { setTime((t) => t + 1); }, 1000);
    } else {
      onStop?.(time);
      setTime(0);
    }
    return () => clearInterval(intervalId);
  }, [submitted]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        let bestAlt = result[0];
        for (let j = 1; j < result.length; j++) {
          if (result[j].confidence > bestAlt.confidence) {
            bestAlt = result[j];
          }
        }
        finalTranscript += bestAlt.transcript;
      }
      onTranscript?.(cleanTranscript(finalTranscript));
    };

    recognition.onspeechend = () => {
      recognition.stop();
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        console.warn("Speech recognition error:", event.error);
      }
    };

    if (submitted) {
      try { recognition.start(); } catch (e) {}
    } else {
      try { recognition.stop(); } catch (e) {}
    }

    return () => { try { recognition.stop(); } catch (e) {} };
  }, [submitted]);

  useEffect(() => {
    if (!isDemo) return;
    let timeoutId: NodeJS.Timeout;
    const runAnimation = () => {
      setSubmitted(true);
      timeoutId = setTimeout(() => {
        setSubmitted(false);
        timeoutId = setTimeout(runAnimation, 1000);
      }, demoInterval);
    };
    const initialTimeout = setTimeout(runAnimation, 100);
    return () => { clearTimeout(timeoutId); clearTimeout(initialTimeout); };
  }, [isDemo, demoInterval]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = () => {
    if (isDemo) { setIsDemo(false); setSubmitted(false); }
    else { setSubmitted((prev) => !prev); }
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
        <button
          className={cn(
            "group w-16 h-16 rounded-xl flex items-center justify-center transition-colors",
            submitted ? "bg-none" : "bg-none hover:bg-[#e8f0fe] dark:hover:bg-[#1e2d5a]"
          )}
          type="button"
          onClick={handleClick}
        >
          {submitted ? (
            <div
              className="w-6 h-6 rounded-sm animate-spin cursor-pointer pointer-events-auto"
              style={{ animationDuration: "3s", backgroundColor: "#e8543a" }}
            />
          ) : (
            <Mic className="w-6 h-6 text-[#1e2d5a] dark:text-[#e8f0fe]" />
          )}
        </button>

        <span
          className="font-mono text-sm transition-opacity duration-300"
          style={{ color: submitted ? "#6b7280" : "#b0b8c9" }}
        >
          {formatTime(time)}
        </span>

        <div className="h-4 w-64 flex items-center justify-center gap-0.5">
          {[...Array(visualizerBars)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-0.5 rounded-full transition-all duration-300",
                submitted ? "animate-pulse" : "h-1"
              )}
              style={
                submitted && isClient
                  ? {
                      height: `${20 + Math.random() * 80}%`,
                      animationDelay: `${i * 0.05}s`,
                      backgroundColor: "#e8543a",
                    }
                  : { backgroundColor: "#e8f0fe" }
              }
            />
          ))}
        </div>

        <p className="h-4 text-xs text-[#6b7280]">
          {submitted ? "Listening..." : "Click to speak"}
        </p>

        {typeof window !== "undefined" &&
          !(window as any).SpeechRecognition &&
          !(window as any).webkitSpeechRecognition && (
            <p className="text-xs mt-1" style={{ color: "#b03318" }}>
              Voice input not supported in this browser. Try Chrome.
            </p>
        )}
      </div>
    </div>
  );
}
