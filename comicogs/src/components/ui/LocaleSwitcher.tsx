"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

// Define supported locales
const locales = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
] as const;

export default function LocaleSwitcher() {
  const t = useTranslations("common");
  const [currentLocale, setCurrentLocale] = useState("en");

  const handleLocaleChange = async (newLocale: string) => {
    try {
      // Store preference in localStorage
      localStorage.setItem("preferred-locale", newLocale);
      
      // Set cookie for server-side
      document.cookie = `locale=${newLocale}; path=/; max-age=31536000`; // 1 year
      
      setCurrentLocale(newLocale);
      
      // Reload page to apply new locale
      window.location.reload();
    } catch (error) {
      console.error("Failed to change locale:", error);
    }
  };

  const currentLocaleData = locales.find(locale => locale.code === currentLocale) || locales[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleLocaleChange(locale.code)}
            className={`flex items-center gap-2 ${
              currentLocale === locale.code ? "bg-accent" : ""
            }`}
          >
            <span className="text-lg">{locale.flag}</span>
            <span className="flex-1">{locale.name}</span>
            {currentLocale === locale.code && (
              <span className="text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
