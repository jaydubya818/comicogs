"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SavedSearch {
  id: string;
  name: string;
  cadence: "daily" | "weekly";
  createdAt: string;
  lastRunAt?: string;
}

export default function MatchedSearchBanner() {
  const [matchedSearch, setMatchedSearch] = useState<SavedSearch | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkMatch = async () => {
      if (typeof window === "undefined") return;
      
      try {
        const qs = window.location.search;
        const response = await fetch(`/api/saved-searches/match${qs}`, {
          headers: {
            'x-user-email': 'demo@comicogs.com' // Demo auth
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setMatchedSearch(data);
        }
      } catch (error) {
        console.error('Failed to check matched search:', error);
      } finally {
        setLoading(false);
      }
    };

    checkMatch();
  }, []);

  if (loading || !matchedSearch || dismissed) {
    return null;
  }

  return (
    <div className="mb-4 rounded-md border bg-blue-50 border-blue-200 px-4 py-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-blue-800">
            🔍 <span className="font-medium">Saved search:</span> {matchedSearch.name}
          </span>
          <Badge variant={matchedSearch.cadence === 'daily' ? 'default' : 'secondary'} className="text-xs">
            {matchedSearch.cadence === 'daily' ? '📅 Daily' : '📆 Weekly'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/account/saved-searches">
            <Button variant="outline" size="sm" className="text-xs h-7">
              Manage Searches
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-blue-600 hover:text-blue-800"
            onClick={() => setDismissed(true)}
          >
            ✕
          </Button>
        </div>
      </div>
      
      {matchedSearch.lastRunAt && (
        <div className="text-xs text-blue-600 mt-1">
          Last alert sent: {new Date(matchedSearch.lastRunAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
