"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book, Search, Plus, Filter, Grid, List, Star, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";

export default function CollectionPage() {
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("title");

  const collectionStats = {
    totalComics: 247,
    totalValue: 4850,
    totalSeries: 18,
    keyIssues: 5,
    recentlyAdded: 3
  };

  const sampleComics = [
    {
      id: 1,
      title: "Amazing Spider-Man #1",
      year: 1963,
      condition: "VG+ 4.5",
      value: 12500,
      series: "Amazing Spider-Man",
      acquired: "2024-01-15",
      isKey: true
    },
    {
      id: 2,
      title: "Batman #1",
      year: 1940,
      condition: "GD 2.0",
      value: 8750,
      series: "Batman",
      acquired: "2023-11-22",
      isKey: true
    },
    {
      id: 3,
      title: "X-Men #1",
      year: 1963,
      condition: "FN 6.0",
      value: 3200,
      series: "X-Men",
      acquired: "2023-08-10",
      isKey: true
    },
    {
      id: 4,
      title: "Amazing Spider-Man #129",
      year: 1974,
      condition: "VF 8.0",
      value: 850,
      series: "Amazing Spider-Man",
      acquired: "2024-02-01",
      isKey: false
    }
  ];

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Book className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Collection</h1>
                <p className="text-muted-foreground">
                  Manage and track your comic book collection
                </p>
              </div>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Comics
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">{collectionStats.totalComics}</div>
                <div className="text-sm text-muted-foreground">Total Comics</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">${collectionStats.totalValue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Est. Value</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">{collectionStats.totalSeries}</div>
                <div className="text-sm text-muted-foreground">Series</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">{collectionStats.keyIssues}</div>
                <div className="text-sm text-muted-foreground">Key Issues</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">{collectionStats.recentlyAdded}</div>
                <div className="text-sm text-muted-foreground">Added This Week</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Comics</TabsTrigger>
              <TabsTrigger value="key">Key Issues</TabsTrigger>
              <TabsTrigger value="recent">Recently Added</TabsTrigger>
              <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search collection..." className="pl-10 w-64" />
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="value-high">Value: High to Low</SelectItem>
                  <SelectItem value="value-low">Value: Low to High</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                  <SelectItem value="acquired">Date Acquired</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex items-center border rounded-lg">
                <Button 
                  variant={viewMode === "grid" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === "list" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          <TabsContent value="all" className="space-y-6">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sampleComics.map((comic) => (
                  <Card key={comic.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Image placeholder */}
                    <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/5 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl">📚</div>
                      </div>
                      {comic.isKey && (
                        <Badge className="absolute top-2 right-2" variant="default">
                          <Star className="h-3 w-3 mr-1" />
                          Key Issue
                        </Badge>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm line-clamp-2">{comic.title}</CardTitle>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{comic.year}</span>
                        <Badge variant="outline">{comic.condition}</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">${comic.value.toLocaleString()}</span>
                        <Button size="sm" variant="outline">Edit</Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Added {new Date(comic.acquired).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sampleComics.map((comic) => (
                  <Card key={comic.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded flex items-center justify-center">
                            <span className="text-2xl">📚</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{comic.title}</h3>
                              {comic.isKey && <Badge variant="default" className="text-xs"><Star className="h-3 w-3 mr-1" />Key</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{comic.series} ({comic.year})</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span>Condition: {comic.condition}</span>
                              <span>Added: {new Date(comic.acquired).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="text-lg font-bold text-primary">${comic.value.toLocaleString()}</div>
                          <Button size="sm" variant="outline">Edit</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="key" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sampleComics.filter(comic => comic.isKey).map((comic) => (
                <Card key={comic.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/5 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl">📚</div>
                    </div>
                    <Badge className="absolute top-2 right-2" variant="default">
                      <Star className="h-3 w-3 mr-1" />
                      Key Issue
                    </Badge>
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm line-clamp-2">{comic.title}</CardTitle>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{comic.year}</span>
                      <Badge variant="outline">{comic.condition}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">${comic.value.toLocaleString()}</span>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sampleComics.filter(comic => new Date(comic.acquired) > new Date('2024-01-01')).map((comic) => (
                <Card key={comic.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/5 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl">📚</div>
                    </div>
                    <Badge className="absolute top-2 right-2" variant="secondary">
                      <Calendar className="h-3 w-3 mr-1" />
                      New
                    </Badge>
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm line-clamp-2">{comic.title}</CardTitle>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{comic.year}</span>
                      <Badge variant="outline">{comic.condition}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">${comic.value.toLocaleString()}</span>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="wishlist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Wishlist</CardTitle>
                <CardDescription>Comics you're looking to add to your collection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your wishlist is empty</p>
                  <Button className="mt-4">Add Comics to Wishlist</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
