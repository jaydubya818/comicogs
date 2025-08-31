"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Star, 
  TrendingUp, 
  Calendar,
  BookOpen,
  Award,
  Flame
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

export default function ComicsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPublisher, setSelectedPublisher] = useState("all");

  const featuredComics = [
    {
      id: 1,
      title: "Amazing Spider-Man",
      issue: "#1",
      year: 1963,
      publisher: "Marvel",
      cover: "📚",
      description: "The wall-crawler's first solo adventure",
      significance: "First appearance in own title",
      keyIssue: true,
      estimatedValue: "$15,000 - $45,000"
    },
    {
      id: 2,
      title: "Batman",
      issue: "#1",
      year: 1940,
      publisher: "DC",
      cover: "🦇",
      description: "The Dark Knight's debut comic",
      significance: "First Batman comic",
      keyIssue: true,
      estimatedValue: "$25,000 - $85,000"
    },
    {
      id: 3,
      title: "X-Men",
      issue: "#1",
      year: 1963,
      publisher: "Marvel",
      cover: "⚡",
      description: "Meet the original X-Men team",
      significance: "First appearance of X-Men",
      keyIssue: true,
      estimatedValue: "$8,000 - $25,000"
    }
  ];

  const publishers = [
    { id: "marvel", name: "Marvel Comics", logo: "🕷️", count: "15,847" },
    { id: "dc", name: "DC Comics", logo: "🦇", count: "12,394" },
    { id: "image", name: "Image Comics", logo: "👁️", count: "3,421" },
    { id: "dark-horse", name: "Dark Horse", logo: "🐴", count: "2,156" },
    { id: "idw", name: "IDW Publishing", logo: "📖", count: "1,893" },
    { id: "boom", name: "Boom! Studios", logo: "💥", count: "987" }
  ];

  const newReleases = [
    { title: "Amazing Spider-Man #45", date: "This Week", cover: "🕸️" },
    { title: "Batman #134", date: "This Week", cover: "🦇" },
    { title: "X-Men #28", date: "Next Week", cover: "❌" },
    { title: "Wonder Woman #12", date: "Next Week", cover: "⚡" }
  ];

  const genres = [
    { name: "Superhero", count: "25,847", icon: "🦸" },
    { name: "Horror", count: "3,421", icon: "👻" },
    { name: "Sci-Fi", count: "5,193", icon: "🚀" },
    { name: "Fantasy", count: "4,276", icon: "🧙" },
    { name: "Romance", count: "1,847", icon: "💕" },
    { name: "Crime", count: "2,394", icon: "🕵️" }
  ];

  return (
    <AppShell
      pageTitle="Browse Comics"
      pageDescription="Discover and explore comic books from all publishers and eras"
    >
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Browse Comics</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore thousands of comic books from every publisher, era, and genre. Find your next great read or that missing issue from your collection.
            </p>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Search by title, character, creator, or series..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                </Button>
                <Button>Search</Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="featured" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="featured">Featured</TabsTrigger>
              <TabsTrigger value="publishers">Publishers</TabsTrigger>
              <TabsTrigger value="genres">Genres</TabsTrigger>
              <TabsTrigger value="new">New Releases</TabsTrigger>
            </TabsList>

            {/* Featured Comics Tab */}
            <TabsContent value="featured" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Key Issues & Hall of Fame</h2>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Most Valuable
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredComics.map((comic) => (
                    <Card key={comic.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="text-6xl">{comic.cover}</div>
                            {comic.keyIssue && (
                              <Badge className="flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                Key Issue
                              </Badge>
                            )}
                          </div>
                          
                          <div>
                            <h3 className="font-bold text-lg">{comic.title} {comic.issue}</h3>
                            <p className="text-muted-foreground">{comic.publisher} • {comic.year}</p>
                            <p className="text-sm mt-2">{comic.description}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium">Significance:</span>
                              <span className="text-muted-foreground">{comic.significance}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="font-medium">Est. Value:</span>
                              <span className="text-muted-foreground">{comic.estimatedValue}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button className="flex-1" asChild>
                              <Link href={`/comics/${comic.id}`}>
                                View Details
                              </Link>
                            </Button>
                            <Button variant="outline" asChild>
                              <Link href={`/marketplace?search=${encodeURIComponent(comic.title)}`}>
                                Find Copies
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">47K+</div>
                    <div className="text-sm text-muted-foreground">Total Comics</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">156</div>
                    <div className="text-sm text-muted-foreground">Publishers</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">2.3K</div>
                    <div className="text-sm text-muted-foreground">Key Issues</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">850</div>
                    <div className="text-sm text-muted-foreground">New This Week</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Publishers Tab */}
            <TabsContent value="publishers" className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Browse by Publisher</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publishers.map((publisher) => (
                    <Card key={publisher.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="text-4xl">{publisher.logo}</div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{publisher.name}</h3>
                            <p className="text-muted-foreground">{publisher.count} comics</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Genres Tab */}
            <TabsContent value="genres" className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Browse by Genre</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {genres.map((genre, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-2">{genre.icon}</div>
                        <h3 className="font-semibold">{genre.name}</h3>
                        <p className="text-sm text-muted-foreground">{genre.count} comics</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* New Releases Tab */}
            <TabsContent value="new" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">New Releases</h2>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    Hot
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {newReleases.map((comic, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-4">{comic.cover}</div>
                        <h3 className="font-semibold mb-2">{comic.title}</h3>
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{comic.date}</span>
                        </div>
                        <Button className="w-full mt-4" size="sm">
                          Pre-order
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      This Week's Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="text-3xl">🕸️</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">Amazing Spider-Man reaches milestone issue #45</h4>
                          <p className="text-sm text-muted-foreground">Major storyline conclusion featuring the return of classic villains</p>
                        </div>
                        <Badge>Featured</Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="text-3xl">🦇</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">New Batman creative team debuts</h4>
                          <p className="text-sm text-muted-foreground">Award-winning writer and artist take on Gotham's protector</p>
                        </div>
                        <Badge variant="secondary">New Team</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold">Start Your Comic Journey</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you're a seasoned collector or just getting started, Comicogs has everything you need to discover, collect, and trade comics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/marketplace">Browse Marketplace</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/collection">Track Collection</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}