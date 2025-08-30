"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [tweakcn, setTweakcn] = useState<boolean>(false);

  // Load persisted prefs on mount
  useEffect(() => {
    const storedTheme = (localStorage.getItem("theme") as Theme) || "system";
    const storedTweak = localStorage.getItem("theme-tweakcn") === "1";
    setTheme(storedTheme);
    setTweakcn(storedTweak);
  }, []);

  // Apply theme to <html> (dark class) and store
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    root.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Apply TweakCN to <body> (theme-tweakcn class) and store
  useEffect(() => {
    document.body.classList.toggle("theme-tweakcn", tweakcn);
    localStorage.setItem("theme-tweakcn", tweakcn ? "1" : "0");
  }, [tweakcn]);

  return (
    <div className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
      <label className="sr-only" htmlFor="theme-select">Theme</label>
      <select
        id="theme-select"
        className="bg-transparent outline-none"
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>

      <div className="h-4 w-px bg-border" aria-hidden="true" />

      <label className="inline-flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          className="accent-current"
          checked={tweakcn}
          onChange={(e) => setTweakcn(e.target.checked)}
        />
        <span>TweakCN</span>
      </label>
    </div>
  );
}
