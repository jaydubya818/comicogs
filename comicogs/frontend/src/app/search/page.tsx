"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Star, BookOpen, Users, TrendingUp, Clock, Zap } from "lucide-react";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate search
    setTimeout(() => setIsLoading(false), 1000);
  };

  const popularSearches = [
    "Spider-Man",
    "Batman",
    "X-Men",
    "Superman",
    "Wolverine",
    "Deadpool",
    "Iron Man",
    "Captain America"
  ];

  const trendingTopics = [
    { name: "Amazing Spider-Man #1", type: "Comic", trend: "+15%" },
    { name: "Batman Who Laughs", type: "Series", trend: "+22%" },
    { name: "House of X", type: "Event", trend: "+8%" },
    { name: "Miles Morales", type: "Character", trend: "+12%" }
  ];

  const recentSearches = [
    "Batman #1 1940",
    "Amazing Spider-Man #129",
    "X-Men #1 1963",
    "Incredible Hulk #181"
  ];

  const searchSuggestions = {
    comics: [
      { title: "Amazing Spider-Man #1 (1963)", year: 1963, value: "$12,500", rarity: "Key Issue" },
      { title: "Batman #1 (1940)", year: 1940, value: "$8,750", rarity: "Golden Age" },
      { title: "X-Men #1 (1963)", year: 1963, value: "$3,200", rarity: "Silver Age" }
    ],
    creators: [
      { name: "Stan Lee", role: "Writer", knownFor: "Spider-Man, X-Men, Fantastic Four" },
      { name: "Jack Kirby", role: "Artist", knownFor: "Thor, Fantastic Four, New Gods" },
      { name: "Frank Miller", role: "Writer/Artist", knownFor: "Daredevil, Batman: The Dark Knight Returns" }
    ],
    characters: [
      { name: "Spider-Man", firstAppearance: "Amazing Fantasy #15 (1962)", publisher: "Marvel" },
      { name: "Batman", firstAppearance: "Detective Comics #27 (1939)", publisher: "DC Comics" },
      { name: "Wolverine", firstAppearance: "Incredible Hulk #180 (1974)", publisher: "Marvel" }
    ]
  };

  return (
    <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Search Comicogs</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find comics, creators, characters, and collectors in our comprehensive database
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                placeholder="Search for comics, series, creators, characters..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
            <Button type="submit" size="lg" disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Advanced
            </Button>
          </div>
        </form>

        {/* Quick Search Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <BookOpen className="h-6 w-6" />
            <span>Comics</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <Users className="h-6 w-6" />
            <span>Creators</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <Star className="h-6 w-6" />
            <span>Characters</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <TrendingUp className="h-6 w-6" />
            <span>Trending</span>
          </Button>
        </div>

        {/* Search Results or Suggestions */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Results</TabsTrigger>
            <TabsTrigger value="comics">Comics</TabsTrigger>
            <TabsTrigger value="creators">Creators</TabsTrigger>
            <TabsTrigger value="characters">Characters</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {!searchQuery ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Popular Searches */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Popular Searches
                    </CardTitle>
                    <CardDescription>What others are searching for</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {popularSearches.map((search, i) => (
                        <Button 
                          key={i} 
                          variant="ghost" 
                          className="w-full justify-start"
                          onClick={() => setSearchQuery(search)}
                        >
                          {search}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Trending Topics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Trending Now
                    </CardTitle>
                    <CardDescription>Hot topics in the comic world</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trendingTopics.map((topic, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{topic.name}</div>
                            <div className="text-sm text-muted-foreground">{topic.type}</div>
                          </div>
                          <Badge variant="secondary" className="text-green-600">
                            {topic.trend}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Searches */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Searches
                    </CardTitle>
                    <CardDescription>Your search history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentSearches.map((search, i) => (
                        <Button 
                          key={i} 
                          variant="ghost" 
                          className="w-full justify-start text-muted-foreground"
                          onClick={() => setSearchQuery(search)}
                        >
                          {search}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Search Results for "{searchQuery}"</CardTitle>
                  <CardDescription>Found 127 results across all categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Search functionality coming soon!</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comic Books</CardTitle>
                <CardDescription>Browse our extensive comic database</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchSuggestions.comics.map((comic, i) => (
                    <Card key={i} className="border">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{comic.title}</h4>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{comic.year}</span>
                            <Badge variant="outline">{comic.rarity}</Badge>
                          </div>
                          <div className="text-lg font-bold text-primary">{comic.value}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="creators" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comic Creators</CardTitle>
                <CardDescription>Find your favorite writers and artists</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchSuggestions.creators.map((creator, i) => (
                    <Card key={i} className="border">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{creator.name}</h4>
                            <Badge variant="outline">{creator.role}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Known for: {creator.knownFor}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="characters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comic Characters</CardTitle>
                <CardDescription>Explore iconic characters and their first appearances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchSuggestions.characters.map((character, i) => (
                    <Card key={i} className="border">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{character.name}</h4>
                            <Badge variant="outline">{character.publisher}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            First appeared in: {character.firstAppearance}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}