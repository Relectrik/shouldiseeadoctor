"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "siad-theme";
const LEGACY_THEME_KEY = "theme";

function getInitialIsDark(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const stored = window.localStorage.getItem(THEME_KEY) ?? window.localStorage.getItem(LEGACY_THEME_KEY);
  if (stored === "dark") {
    return true;
  }
  if (stored === "light") {
    return false;
  }
  if (document.documentElement.classList.contains("dark")) {
    return true;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(getInitialIsDark);
  const [transitionsEnabled, setTransitionsEnabled] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTransitionsEnabled(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    window.localStorage.setItem(LEGACY_THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = () => {
    setIsDark((current) => !current);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      style={{
        width: "52px",
        height: "28px",
        borderRadius: "999px",
        border: "0.5px solid",
        borderColor: isDark ? "#e8543a" : "#1e2d5a",
        backgroundColor: isDark ? "#1e2d5a" : "#e8f0fe",
        position: "relative",
        cursor: "pointer",
        transition: transitionsEnabled ? "all 0.3s ease" : "none",
        display: "flex",
        alignItems: "center",
        padding: "0 4px",
        flexShrink: 0,
      }}
    >
      {/* Sliding knob */}
      <span
        style={{
          position: "absolute",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          backgroundColor: isDark ? "#e8543a" : "#1e2d5a",
          left: isDark ? "28px" : "4px",
          transition: transitionsEnabled ? "left 0.3s ease" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isDark
          ? <Moon size={11} color="#ffffff" />
          : <Sun size={11} color="#ffffff" />
        }
      </span>
    </button>
  );
}
