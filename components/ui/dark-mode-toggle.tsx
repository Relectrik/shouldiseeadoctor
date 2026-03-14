"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = stored === "dark" || (!stored && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
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
        transition: "all 0.3s ease",
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
          transition: "left 0.3s ease",
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
