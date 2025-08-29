import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchQuery } from "@/types/search";

type SavedSearch = {
  id: string;
  name: string;
  cadence: "daily" | "weekly";
  createdAt: string;
  lastRunAt?: string;
  queryJson: SearchQuery;
};

async function getSavedSearches(): Promise<{ savedSearches: SavedSearch[] }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saved-searches`, { 
      cache: "no-store",
      headers: {
        'x-user-email': 'demo@comicogs.com' // Demo auth
      }
    });
    
    if (!res.ok) {
      throw new Error("Failed to load saved searches");
    }
    
    return res.json();
  } catch (error) {
    console.error("Failed to fetch saved searches:", error);
    return { savedSearches: [] };
  }
}

function buildQueryString(query: SearchQuery): string {
  const params = new URLSearchParams();
  
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === undefined) continue;
    
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)));
    } else {
      params.append(key, String(value));
    }
  }
  
  return params.toString();
}

function formatQuerySummary(query: SearchQuery): string {
  const parts = [];
  
  if (query.search) parts.push(`Text: "${query.search}"`);
  if (query.series?.length) parts.push(`Series: ${query.series.join(', ')}`);
  if (query.issue) parts.push(`Issue: ${query.issue}`);
  if (query.grade?.length) parts.push(`Grade: ${query.grade.join(', ')}`);
  if (query.format?.length) parts.push(`Format: ${query.format.join(', ')}`);
  if (query.minPrice || query.maxPrice) {
    const priceRange = [
      query.minPrice ? `$${query.minPrice}` : '',
      query.maxPrice ? `$${query.maxPrice}` : ''
    ].filter(Boolean).join(' - ');
    if (priceRange) parts.push(`Price: ${priceRange}`);
  }
  if (query.tags?.length) parts.push(`Tags: ${query.tags.join(', ')}`);
  
  return parts.length > 0 ? parts.join(' • ') : 'All listings';
}

export default async function SavedSearchesPage() {
  const { savedSearches } = await getSavedSearches();

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Saved Searches</h1>
        <p className="text-gray-600 mt-2">
          Manage your alerts and quick filters. Get notified when new comics match your criteria.
        </p>
      </div>

      {savedSearches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl text-gray-300 mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved searches yet</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Save searches from the marketplace to get notified when new comics match your criteria.
            </p>
            <Link href="/marketplace">
              <Button>Browse Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {savedSearches.map((search) => (
            <Card key={search.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-gray-900">
                      {search.name}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <Badge variant={search.cadence === 'daily' ? 'default' : 'secondary'}>
                        {search.cadence === 'daily' ? '📅 Daily' : '📆 Weekly'}
                      </Badge>
                      <span>Created {new Date(search.createdAt).toLocaleDateString()}</span>
                      {search.lastRunAt && (
                        <span>Last run {new Date(search.lastRunAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/marketplace?${buildQueryString(search.queryJson)}`}
                      className="inline-flex"
                    >
                      <Button variant="outline" size="sm">
                        🔍 Open Search
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={async () => {
                        if (!confirm("Delete this saved search?")) return;
                        
                        try {
                          const response = await fetch(`/api/saved-searches/${search.id}`, {
                            method: 'DELETE',
                            headers: {
                              'x-user-email': 'demo@comicogs.com' // Demo auth
                            }
                          });
                          
                          if (response.ok) {
                            window.location.reload();
                          } else {
                            alert('Failed to delete search');
                          }
                        } catch (error) {
                          alert('Failed to delete search');
                        }
                      }}
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Search Criteria</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
                      {formatQuerySummary(search.queryJson)}
                    </p>
                  </div>
                  
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                      <span className="group-open:hidden">Show detailed filters ▶</span>
                      <span className="hidden group-open:inline">Hide detailed filters ▼</span>
                    </summary>
                    <div className="mt-2 text-xs">
                      <pre className="bg-gray-100 rounded-md p-3 overflow-x-auto text-gray-700">
                        {JSON.stringify(search.queryJson, null, 2)}
                      </pre>
                    </div>
                  </details>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Change Alert Frequency</h4>
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={search.cadence}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
                        onChange={async (e) => {
                          try {
                            const response = await fetch(`/api/saved-searches/${search.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'x-user-email': 'demo@comicogs.com' // Demo auth
                              },
                              body: JSON.stringify({
                                ...search,
                                cadence: e.target.value
                              })
                            });
                            
                            if (response.ok) {
                              // Optionally show success message
                              const updatedValue = e.target.value;
                              alert(`Alert frequency updated to ${updatedValue}`);
                            } else {
                              alert('Failed to update frequency');
                            }
                          } catch (error) {
                            alert('Failed to update frequency');
                          }
                        }}
                      >
                        <option value="daily">Daily alerts</option>
                        <option value="weekly">Weekly alerts</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 How Saved Searches Work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• We'll email you when new comics match your search criteria</li>
          <li>• Daily alerts check for matches every 24 hours</li>
          <li>• Weekly alerts check for matches every 7 days</li>
          <li>• You can save up to 10 searches and change frequencies anytime</li>
        </ul>
      </div>
    </main>
  );
}
