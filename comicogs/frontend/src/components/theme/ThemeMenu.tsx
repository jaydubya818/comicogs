"use client";

import { useEffect, useState } from "react";
import { Monitor, Sun, Moon, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

type Theme = "light" | "dark" | "system";
type ColorScheme = "default" | "neon" | "paper" | "tweakcn";

interface ThemeState {
  theme: Theme;
  colorScheme: ColorScheme;
}

const colorSchemes = [
  { value: "default", label: "Default", description: "Comic marketplace theme" },
  { value: "neon", label: "Neon", description: "Cyberpunk gaming aesthetic" },
  { value: "paper", label: "Paper", description: "Minimal newspaper style" },
  { value: "tweakcn", label: "TweakCN", description: "Professional enterprise" },
] as const;

export default function ThemeMenu() {
  const [themeState, setThemeState] = useState<ThemeState>({
    theme: "system",
    colorScheme: "default",
  });
  const [mounted, setMounted] = useState(false);

  // Load persisted preferences on mount
  useEffect(() => {
    setMounted(true);
    const storedTheme = (localStorage.getItem("comicogs-theme") as Theme) || "system";
    const storedColorScheme = (localStorage.getItem("comicogs-color-scheme") as ColorScheme) || "default";
    
    setThemeState({
      theme: storedTheme,
      colorScheme: storedColorScheme,
    });
    
    // Apply initial theme
    applyTheme(storedTheme, storedColorScheme);
  }, []);

  const applyTheme = (theme: Theme, colorScheme: ColorScheme) => {
    const root = document.documentElement;
    const body = document.body;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Apply dark/light mode to <html>
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    root.classList.toggle("dark", isDark);

    // Remove all theme classes from body
    body.classList.remove("theme-default", "theme-neon", "theme-paper", "theme-tweakcn");
    
    // Apply selected color scheme to <body>
    body.classList.add(`theme-${colorScheme}`);

    // Save preferences
    localStorage.setItem("comicogs-theme", theme);
    localStorage.setItem("comicogs-color-scheme", colorScheme);
  };

  const setTheme = (newTheme: Theme) => {
    const newState = { ...themeState, theme: newTheme };
    setThemeState(newState);
    applyTheme(newTheme, themeState.colorScheme);
  };

  const setColorScheme = (newColorScheme: ColorScheme) => {
    const newState = { ...themeState, colorScheme: newColorScheme };
    setThemeState(newState);
    applyTheme(themeState.theme, newColorScheme);
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Palette className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Theme settings</span>
      </Button>
    );
  }

  const getThemeIcon = () => {
    switch (themeState.theme) {
      case "dark":
        return <Moon className="h-[1.2rem] w-[1.2rem]" />;
      case "light":
        return <Sun className="h-[1.2rem] w-[1.2rem]" />;
      default:
        return <Monitor className="h-[1.2rem] w-[1.2rem]" />;
    }
  };

  const currentScheme = colorSchemes.find(s => s.value === themeState.colorScheme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Theme settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          {getThemeIcon()}
          Theme Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Light/Dark/System Toggle */}
        <div className="px-2 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Appearance</span>
            <span className="text-xs text-muted-foreground capitalize">
              {themeState.theme}
            </span>
          </div>
          <DropdownMenuRadioGroup 
            value={themeState.theme} 
            onValueChange={(value) => setTheme(value as Theme)}
          >
            <DropdownMenuRadioItem value="light" className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </div>

        <DropdownMenuSeparator />

        {/* Color Scheme Selection */}
        <div className="px-2 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Color Scheme</span>
            <span className="text-xs text-muted-foreground">
              {currentScheme?.label}
            </span>
          </div>
          <DropdownMenuRadioGroup 
            value={themeState.colorScheme} 
            onValueChange={(value) => setColorScheme(value as ColorScheme)}
          >
            {colorSchemes.map((scheme) => (
              <DropdownMenuRadioItem 
                key={scheme.value} 
                value={scheme.value}
                className="flex flex-col items-start gap-1"
              >
                <span className="font-medium">{scheme.label}</span>
                <span className="text-xs text-muted-foreground">
                  {scheme.description}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook for components that need theme state
export function useThemeState() {
  const [themeState, setThemeState] = useState<ThemeState>({
    theme: "system",
    colorScheme: "default",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem("comicogs-theme") as Theme) || "system";
    const savedColorScheme = (localStorage.getItem("comicogs-color-scheme") as ColorScheme) || "default";
    
    setThemeState({
      theme: savedTheme,
      colorScheme: savedColorScheme,
    });
  }, []);

  return {
    ...themeState,
    mounted,
    isDark: themeState.theme === "dark" || 
            (themeState.theme === "system" && typeof window !== "undefined" && 
             window.matchMedia("(prefers-color-scheme: dark)").matches),
  };
}
