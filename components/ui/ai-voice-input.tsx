"use client";

import { Mic } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number, transcript?: string) => void;
  onTranscript?: (text: string) => void;
  visualizerBars?: number;
  demoMode?: boolean;
  demoInterval?: number;
  className?: string;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onspeechend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

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
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isSupported] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    const speechWindow = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return Boolean(speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition);
  });
  const [isDemo, setIsDemo] = useState(demoMode);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isRecordingRef = useRef(false);
  const restartAfterEndRef = useRef(false);
  const networkRetryCountRef = useRef(0);
  const transcriptRef = useRef("");
  const durationRef = useRef(0);
  const onStartRef = useRef(onStart);
  const onStopRef = useRef(onStop);
  const onTranscriptRef = useRef(onTranscript);

  const barHeights = useMemo(
    () => Array.from({ length: visualizerBars }, (_, i) => 20 + ((i * 37) % 80)),
    [visualizerBars],
  );

  useEffect(() => {
    onStartRef.current = onStart;
  }, [onStart]);

  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const finishRecording = (durationOverride?: number) => {
    if (!isRecordingRef.current) {
      return;
    }

    isRecordingRef.current = false;
    setSubmitted(false);
    const duration = typeof durationOverride === "number" ? durationOverride : durationRef.current;
    const finalTranscript = cleanTranscript(transcriptRef.current);
    if (finalTranscript) {
      onTranscriptRef.current?.(finalTranscript);
    }
    onStopRef.current?.(duration, finalTranscript || undefined);
    durationRef.current = 0;
    transcriptRef.current = "";
    setTime(0);
  };

  useEffect(() => {
    if (!submitted) {
      return;
    }
    const intervalId = setInterval(() => {
      setTime((current) => {
        const next = current + 1;
        durationRef.current = next;
        return next;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [submitted]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const speechWindow = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
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
      const normalized = cleanTranscript(finalTranscript);
      transcriptRef.current = normalized;
      onTranscriptRef.current?.(normalized);
    };

    recognition.onspeechend = () => {
      recognition.stop();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      const errorCode = event.error ?? "unknown";
      if (errorCode === "no-speech") {
        return;
      }

      if (errorCode === "network" && networkRetryCountRef.current < 1) {
        // Web Speech can intermittently fail to connect; attempt one clean restart.
        networkRetryCountRef.current += 1;
        restartAfterEndRef.current = true;
        try {
          recognition.stop();
        } catch {
          restartAfterEndRef.current = false;
        }
        return;
      }

      if (errorCode === "not-allowed" || errorCode === "service-not-allowed") {
        setVoiceError("Microphone permission is blocked. Enable mic access in browser settings.");
      } else if (errorCode === "network") {
        const offline = typeof navigator !== "undefined" && !navigator.onLine;
        setVoiceError(
          offline
            ? "You appear to be offline. Reconnect to the internet and try voice input again."
            : "Voice service connection failed. Try again, or disable VPN/content blockers for this site.",
        );
      } else {
        setVoiceError(`Voice input error: ${errorCode}`);
      }
      finishRecording();
    };

    recognition.onend = () => {
      if (restartAfterEndRef.current) {
        restartAfterEndRef.current = false;
        try {
          recognition.start();
          return;
        } catch {
          setVoiceError("Could not reconnect voice input. Please try again.");
        }
      }
      finishRecording();
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onspeechend = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // no-op: browser may already have stopped recognition
      }
      recognitionRef.current = null;
    };
  }, []);

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

  const startRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceError("Voice input is not supported in this browser. Try Chrome.");
      return;
    }

    setVoiceError(null);
    restartAfterEndRef.current = false;
    networkRetryCountRef.current = 0;
    transcriptRef.current = "";
    durationRef.current = 0;
    setTime(0);
    onStartRef.current?.();

    try {
      recognition.start();
      isRecordingRef.current = true;
      setSubmitted(true);
    } catch {
      isRecordingRef.current = false;
      setSubmitted(false);
      setVoiceError("Could not start voice input. Check microphone permission and try again.");
    }
  };

  const stopRecording = () => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // no-op: already stopped
      }
    } else {
      finishRecording();
    }
  };

  const handleClick = () => {
    if (isDemo) {
      setIsDemo(false);
      setSubmitted(false);
      return;
    }

    if (!isSupported) {
      setVoiceError("Voice input is not supported in this browser. Try Chrome.");
      return;
    }

    if (submitted) {
      stopRecording();
      return;
    }

    startRecording();
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
                submitted
                  ? {
                      height: `${barHeights[i] ?? 40}%`,
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

        {voiceError ? (
          <p className="mt-1 text-xs" style={{ color: "#b03318" }}>
            {voiceError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
