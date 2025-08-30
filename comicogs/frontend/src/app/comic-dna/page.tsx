"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dna, Target, TrendingUp, Award, Users, BookOpen, Star, Zap } from "lucide-react";

export default function ComicDNAPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 3000);
  };

  const dnaData = {
    preferences: {
      marvel: 65,
      dc: 25,
      independent: 10
    },
    genres: {
      superhero: 80,
      horror: 15,
      scifi: 30,
      fantasy: 25,
      mystery: 10
    },
    eras: {
      golden: 15,
      silver: 45,
      bronze: 25,
      modern: 15
    },
    creators: [
      { name: "Stan Lee", affinity: 95, works: 23 },
      { name: "Jack Kirby", affinity: 88, works: 18 },
      { name: "Frank Miller", affinity: 75, works: 8 },
      { name: "Alan Moore", affinity: 70, works: 5 }
    ]
  };

  const recommendations = [
    {
      title: "Amazing Spider-Man #50",
      reason: "Based on your love for Silver Age Marvel",
      match: 94,
      price: "$450"
    },
    {
      title: "Fantastic Four #48",
      reason: "Jack Kirby artwork aligns with your preferences",
      match: 91,
      price: "$320"
    },
    {
      title: "Daredevil #1 (1964)",
      reason: "Stan Lee + Marvel + Silver Age = Perfect match",
      match: 89,
      price: "$890"
    }
  ];

  const insights = [
    {
      icon: <Target className="h-5 w-5" />,
      title: "Key Focus Areas",
      description: "You gravitate toward Silver Age Marvel with strong character development"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Collection Growth",
      description: "Your taste has evolved toward more sophisticated storytelling over time"
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Expertise Level",
      description: "Advanced collector with deep knowledge of Marvel continuity"
    }
  ];

  return (
    <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Dna className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Comic DNA</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover your unique comic book preferences and get personalized recommendations
            based on your collection and reading habits.
          </p>
        </div>

        {/* Analysis Button */}
        <div className="text-center">
          <Button 
            size="lg" 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            <Zap className="h-5 w-5" />
            {isAnalyzing ? "Analyzing Your DNA..." : "Analyze My Comic DNA"}
          </Button>
          {isAnalyzing && (
            <div className="mt-4 max-w-md mx-auto">
              <Progress value={33} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                Analyzing your collection patterns...
              </p>
            </div>
          )}
        </div>

        {/* DNA Results */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-primary">85</div>
                    <div className="text-sm text-muted-foreground">DNA Score</div>
                    <Badge variant="secondary">Expert Collector</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-primary">247</div>
                    <div className="text-sm text-muted-foreground">Comics Analyzed</div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-primary">12</div>
                    <div className="text-sm text-muted-foreground">Recommendations</div>
                    <Badge variant="secondary">Ready</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-primary">94%</div>
                    <div className="text-sm text-muted-foreground">Match Accuracy</div>
                    <Badge variant="default">High</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Comic DNA Profile</CardTitle>
                <CardDescription>
                  Based on analysis of your collection, purchases, and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Publisher Preference</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Marvel Comics</span>
                        <span className="text-sm text-muted-foreground">65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center justify-between">
                        <span>DC Comics</span>
                        <span className="text-sm text-muted-foreground">25%</span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center justify-between">
                        <span>Independent</span>
                        <span className="text-sm text-muted-foreground">10%</span>
                      </div>
                      <Progress value={10} className="h-2" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Era Preference</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Silver Age</span>
                          <span className="text-sm text-muted-foreground">45%</span>
                        </div>
                        <Progress value={45} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Bronze Age</span>
                          <span className="text-sm text-muted-foreground">25%</span>
                        </div>
                        <Progress value={25} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Golden Age</span>
                          <span className="text-sm text-muted-foreground">15%</span>
                        </div>
                        <Progress value={15} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Modern Age</span>
                          <span className="text-sm text-muted-foreground">15%</span>
                        </div>
                        <Progress value={15} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Genre Preferences</CardTitle>
                  <CardDescription>Your favorite comic genres</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(dnaData.genres).map(([genre, value]) => (
                      <div key={genre}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="capitalize">{genre}</span>
                          <span className="text-sm text-muted-foreground">{value}%</span>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Favorite Creators</CardTitle>
                  <CardDescription>Based on your collection</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dnaData.creators.map((creator, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{creator.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {creator.works} works in collection
                          </div>
                        </div>
                        <Badge variant="secondary">{creator.affinity}% match</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Personalized Recommendations
                </CardTitle>
                <CardDescription>
                  Comics tailored to your unique preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((rec, i) => (
                    <Card key={i} className="border">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold">{rec.title}</h4>
                            <Badge variant="default">{rec.match}% match</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{rec.reason}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">{rec.price}</span>
                            <Button size="sm">View Details</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {insights.map((insight, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {insight.icon}
                      {insight.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{insight.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Collection Insights</CardTitle>
                <CardDescription>Advanced analysis of your collecting patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Most Active Era</div>
                      <div className="text-sm text-muted-foreground">
                        Silver Age (1956-1970) - You have 45% of your collection from this period
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Collector Archetype</div>
                      <div className="text-sm text-muted-foreground">
                        "The Marvel Historian" - Deep knowledge of Marvel continuity and character development
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Investment Potential</div>
                      <div className="text-sm text-muted-foreground">
                        Your collection has strong investment potential with focus on key issues
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
