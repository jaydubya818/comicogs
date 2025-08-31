"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, 
  Clock, 
  Eye, 
  Heart, 
  Share2, 
  ArrowLeft,
  TrendingUp,
  History,
  Award,
  BookOpen,
  Users,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

export default function ComicDetailPage() {
  const params = useParams();
  const comicId = params.id as string;
  
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Mock data - in real app this would come from API based on comicId
  const comic = {
    id: comicId,
    title: "Amazing Spider-Man",
    issue: "#1",
    year: 1963,
    month: "March",
    publisher: "Marvel Comics",
    creators: ["Stan Lee", "Steve Ditko"],
    cover: "📚",
    significance: "First appearance of Spider-Man in his own title",
    keyIssue: true,
    description: "The wall-crawler's first solo adventure begins! After his debut in Amazing Fantasy #15, Spider-Man gets his own comic book series. This landmark issue features the first appearance of J. Jonah Jameson and the Chameleon, establishing many of the series' core elements that would define Spider-Man comics for decades to come.",
    specifications: {
      pages: 22,
      format: "Comic Book",
      ageRating: "All Ages",
      barcode: "N/A",
      printRun: "Unknown",
      reprints: "Reprinted over 50 times"
    },
    marketData: {
      estimatedValue: "$15,000 - $45,000",
      averageGrade: "4.5 (VG+)",
      totalGraded: "2,847 copies",
      lastSale: "$28,500 (9.0 VF/NM)",
      priceHistory: [
        { date: "2023", price: "$35,000" },
        { date: "2022", price: "$32,000" },
        { date: "2021", price: "$28,000" },
        { date: "2020", price: "$25,000" }
      ]
    },
    characters: [
      "Spider-Man (Peter Parker)",
      "J. Jonah Jameson",
      "The Chameleon",
      "Aunt May",
      "Uncle Ben"
    ],
    storyline: {
      title: "Spider-Man's First Adventure",
      summary: "Peter Parker continues his superhero career as Spider-Man, facing new challenges and villains while trying to balance his personal life.",
      keyEvents: [
        "First appearance in own title",
        "Introduction of J. Jonah Jameson",
        "First encounter with The Chameleon",
        "Establishes the Daily Bugle connection"
      ]
    }
  };

  const availableIssues = [
    { issue: "#2", condition: "VF 8.0", price: "$850", seller: "ComicVault92" },
    { issue: "#3", condition: "FN+ 6.5", price: "$650", seller: "SpiderFan" },
    { issue: "#4", condition: "VG+ 4.5", price: "$425", seller: "MarvelCollector" }
  ];

  const relatedComics = [
    { title: "Amazing Fantasy #15", significance: "First Spider-Man appearance", year: "1962" },
    { title: "Spectacular Spider-Man #1", significance: "Second Spider-Man title", year: "1976" },
    { title: "Web of Spider-Man #1", significance: "Third Spider-Man title", year: "1985" }
  ];

  return (
    <AppShell
      pageTitle={`${comic.title} ${comic.issue}`}
      pageDescription={`Detailed information about ${comic.title} ${comic.issue} from ${comic.year}`}
    >
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <span className="text-muted-foreground">›</span>
            <Link href="/comics" className="text-muted-foreground hover:text-foreground">Comics</Link>
            <span className="text-muted-foreground">›</span>
            <span className="text-foreground">{comic.title} {comic.issue}</span>
          </div>

          {/* Back Button */}
          <div>
            <Link href="/comics">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Comics
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Cover and Actions */}
            <div className="space-y-6">
              {/* Comic Cover */}
              <Card>
                <CardContent className="p-6">
                  <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center relative mb-4">
                    <div className="text-center space-y-4">
                      <div className="text-8xl">{comic.cover}</div>
                      <div className="text-sm font-medium text-muted-foreground px-4">
                        {comic.title} {comic.issue}
                      </div>
                    </div>
                    {comic.keyIssue && (
                      <Badge className="absolute top-4 left-4" variant="default">
                        <Award className="h-3 w-3 mr-1" />
                        Key Issue
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      className="w-full" 
                      onClick={() => setIsInWishlist(!isInWishlist)}
                      variant={isInWishlist ? "secondary" : "default"}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isInWishlist ? 'fill-current' : ''}`} />
                      {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                    </Button>
                    
                    <Button className="w-full" variant="outline" asChild>
                      <Link href={`/marketplace?search=${encodeURIComponent(comic.title)}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Find Copies for Sale
                      </Link>
                    </Button>
                    
                    <Button className="w-full" variant="outline">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Comic
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Market Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Market Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Estimated Value:</span>
                      <span className="font-bold text-primary">{comic.marketData.estimatedValue}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Based on recent sales and condition
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Average Grade:</span>
                      <span>{comic.marketData.averageGrade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Graded:</span>
                      <span>{comic.marketData.totalGraded}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Sale:</span>
                      <span className="text-green-600 font-medium">{comic.marketData.lastSale}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">{comic.title} {comic.issue}</h1>
                    <p className="text-xl text-muted-foreground">
                      {comic.publisher} • {comic.month} {comic.year}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      By {comic.creators.join(", ")}
                    </p>
                  </div>
                </div>

                {comic.keyIssue && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{comic.significance}</span>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="characters">Characters</TabsTrigger>
                  <TabsTrigger value="market">Market</TabsTrigger>
                  <TabsTrigger value="related">Related</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Story Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        {comic.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Pages:</span>
                          <p className="text-muted-foreground">{comic.specifications.pages}</p>
                        </div>
                        <div>
                          <span className="font-medium">Format:</span>
                          <p className="text-muted-foreground">{comic.specifications.format}</p>
                        </div>
                        <div>
                          <span className="font-medium">Age Rating:</span>
                          <p className="text-muted-foreground">{comic.specifications.ageRating}</p>
                        </div>
                        <div>
                          <span className="font-medium">Print Run:</span>
                          <p className="text-muted-foreground">{comic.specifications.printRun}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Key Story Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {comic.storyline.keyEvents.map((event, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Star className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                            <span className="text-sm">{event}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="characters" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Featured Characters
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {comic.characters.map((character, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="text-2xl">🦸</div>
                            <div>
                              <h4 className="font-medium">{character}</h4>
                              {index === 0 && (
                                <p className="text-xs text-muted-foreground">Protagonist</p>
                              )}
                              {index === 2 && (
                                <p className="text-xs text-muted-foreground">Antagonist</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="market" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Price History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {comic.marketData.priceHistory.map((entry, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="font-medium">{entry.date}</span>
                            <span className="text-primary font-semibold">{entry.price}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Available Issues</CardTitle>
                      <CardDescription>Current marketplace listings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {availableIssues.map((issue, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{comic.title} {issue.issue}</h4>
                              <p className="text-sm text-muted-foreground">{issue.condition} • {issue.seller}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-primary">{issue.price}</p>
                              <Button size="sm" variant="outline">View</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="related" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Related Comics</CardTitle>
                      <CardDescription>Other important issues in the series</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {relatedComics.map((related, index) => (
                          <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="text-3xl">📚</div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{related.title}</h4>
                              <p className="text-sm text-muted-foreground">{related.significance}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3" />
                                <span>{related.year}</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}