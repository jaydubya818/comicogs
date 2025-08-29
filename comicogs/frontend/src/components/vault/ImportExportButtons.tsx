"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileText, AlertCircle } from "lucide-react";

export function ExportButton() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/export/collection.csv", {
        headers: {
          'x-user-email': 'demo@comicogs.com' // Demo auth
        }
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comicogs-collection-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button 
      onClick={handleExport}
      disabled={exporting}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      {exporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  );
}

export function ImportButton() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      
      const response = await fetch("/api/import/collection.csv", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'x-user-email': 'demo@comicogs.com' // Demo auth
        },
        body: JSON.stringify({ csv: text })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const data = await response.json();
      setResult(data);
      
      if (data.created > 0) {
        alert(`Successfully imported ${data.created} items!`);
        // Optionally refresh the page
        window.location.reload();
      } else {
        alert('No new items were imported. All items may already be in your collection.');
      }
      
    } catch (error: any) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="file"
          accept=".csv"
          className="hidden"
          disabled={importing}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileSelect(file);
            }
          }}
        />
        <Button 
          variant="outline" 
          disabled={importing}
          className="flex items-center gap-2"
          asChild
        >
          <span>
            <Upload className="h-4 w-4" />
            {importing ? 'Importing...' : 'Import CSV'}
          </span>
        </Button>
      </label>

      {result && result.errors && result.errors.length > 0 && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            Import completed with warnings
          </div>
          <div className="mt-1">
            Imported: {result.created} items, Errors: {result.errors.length}
          </div>
        </div>
      )}
    </div>
  );
}

export function ImportExportHelp() {
  return (
    <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-4 space-y-3">
      <div className="flex items-start gap-2">
        <FileText className="h-4 w-4 mt-0.5 text-gray-400" />
        <div>
          <h3 className="font-medium text-gray-900">CSV Import/Export</h3>
          <p>Easily backup your collection or import from other platforms.</p>
        </div>
      </div>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Required CSV columns:</strong> series, issue, title
        </div>
        <div>
          <strong>Optional columns:</strong> grade, format, tags, notes, acquiredAt, year, coverUrl
        </div>
        <div>
          <strong>Tags format:</strong> Separate multiple tags with "|" (e.g., "key-issue|bronze-age")
        </div>
        <div>
          <strong>Date format:</strong> ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)
        </div>
      </div>
    </div>
  );
}
