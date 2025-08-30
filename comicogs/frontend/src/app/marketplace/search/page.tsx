"use client";

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Star, MapPin, Calendar, DollarSign, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MarketplaceSearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [sortBy, setSortBy] = useState("relevance");

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  const searchResults = [
    {
      id: 1,
      title: "Amazing Spider-Man #1 (1963)",
      condition: "VG+ 4.5",
      price: "$12,500",
      seller: "ComicCollector92",
      location: "New York, NY",
      images: 8,
      watchers: 23,
      relevance: query.toLowerCase().includes('spider') ? 'high' : 'medium'
    },
    {
      id: 2,
      title: "Spider-Man #1 (1990)",
      condition: "NM 9.4",
      price: "$85",
      seller: "ModernComics",
      location: "Portland, OR",
      images: 5,
      watchers: 7,
      relevance: query.toLowerCase().includes('spider') ? 'high' : 'medium'
    },
    {
      id: 3,
      title: "Ultimate Spider-Man #1 (2000)",
      condition: "VF 8.0",
      price: "$45",
      seller: "UltimateCollector",
      location: "Austin, TX",
      images: 4,
      watchers: 12,
      relevance: query.toLowerCase().includes('spider') ? 'high' : 'medium'
    }
  ].filter(item => 
    query === '' || 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.seller.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Link href="/marketplace">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {query ? `Search Results for "${query}"` : 'Search Marketplace'}
              </h1>
              <p className="text-muted-foreground">
                Find comics, creators, and collectors in our marketplace.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search for comics, series, creators..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button>Search</Button>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Search Suggestions */}
        {!query && (
          <Card>
            <CardHeader>
              <CardTitle>Popular Searches</CardTitle>
              <CardDescription>Try searching for these popular items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["Spider-Man", "Batman", "X-Men", "Superman", "Hulk", "Iron Man", "Thor", "Captain America"].map((term) => (
                  <Button key={term} variant="outline" size="sm" asChild>
                    <Link href={`/marketplace/search?query=${encodeURIComponent(term)}`}>
                      {term}
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {query && (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {searchResults.length} results for "{query}"
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">View:</span>
                <Button variant="outline" size="sm">Grid</Button>
                <Button variant="ghost" size="sm">List</Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Image placeholder */}
                    <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/5 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <div className="text-6xl">📚</div>
                          <p className="text-sm text-muted-foreground">{listing.images} images</p>
                        </div>
                      </div>
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        {listing.watchers} watching
                      </Badge>
                      {listing.relevance === 'high' && (
                        <Badge className="absolute top-2 left-2" variant="default">
                          High Match
                        </Badge>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-1">{listing.title}</CardTitle>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{listing.condition}</Badge>
                        <div className="text-2xl font-bold text-primary">{listing.price}</div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Star className="h-4 w-4" />
                          <span>{listing.seller}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{listing.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>7 days left</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Make Offer
                        </Button>
                        <Button variant="outline">Watch</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Results Found</CardTitle>
                  <CardDescription>
                    We couldn't find any listings matching "{query}". Try adjusting your search terms.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Suggestions:</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Check your spelling</li>
                      <li>• Try more general terms</li>
                      <li>• Use different keywords</li>
                      <li>• Browse categories instead</li>
                    </ul>
                    <Button asChild>
                      <Link href="/marketplace">Browse All Listings</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  );
}
