"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Star, Clock, Eye } from "lucide-react";

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Comic Marketplace</h1>
          <p className="text-muted-foreground">
            Discover and purchase comics from collectors around the world.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search comics, series, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Featured Listings */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Featured Listings</h2>
            <Button variant="outline">View All Listings</Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              {
                id: 1,
                title: "Amazing Spider-Man #1",
                year: 1963,
                condition: "VG+ 4.5",
                price: "$12,500",
                seller: "ComicVault92",
                watchers: 23,
                timeLeft: "3d 12h",
                isKey: true
              },
              {
                id: 2,
                title: "Batman #1",
                year: 1940,
                condition: "GD 2.0",
                price: "$8,750",
                seller: "VintageComics",
                watchers: 45,
                timeLeft: "1d 8h",
                isKey: true
              },
              {
                id: 3,
                title: "X-Men #1",
                year: 1963,
                condition: "FN 6.0",
                price: "$3,200",
                seller: "MarvelMaster",
                watchers: 18,
                timeLeft: "5d 2h",
                isKey: true
              },
              {
                id: 4,
                title: "Superman #1",
                year: 1939,
                condition: "PR 0.5",
                price: "$15,000",
                seller: "GoldenAge",
                watchers: 67,
                timeLeft: "2d 18h",
                isKey: true
              },
              {
                id: 5,
                title: "Incredible Hulk #181",
                year: 1974,
                condition: "VF 8.0",
                price: "$2,850",
                seller: "KeyIssues",
                watchers: 34,
                timeLeft: "4d 6h",
                isKey: true
              },
              {
                id: 6,
                title: "Amazing Fantasy #15",
                year: 1962,
                condition: "GD+ 2.5",
                price: "$18,500",
                seller: "SpiderFan",
                watchers: 89,
                timeLeft: "6d 14h",
                isKey: true
              },
              {
                id: 7,
                title: "Fantastic Four #1",
                year: 1961,
                condition: "VG 4.0",
                price: "$4,200",
                seller: "FantasticDeals",
                watchers: 28,
                timeLeft: "1d 22h",
                isKey: true
              },
              {
                id: 8,
                title: "Tales of Suspense #39",
                year: 1963,
                condition: "FN+ 6.5",
                price: "$5,500",
                seller: "IronManFan",
                watchers: 41,
                timeLeft: "3d 9h",
                isKey: true
              }
            ].map((comic) => (
              <div key={comic.id} className="border rounded-lg bg-card hover:shadow-lg transition-shadow overflow-hidden">
                {/* Comic Cover */}
                <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 to-primary/5 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="text-4xl">📚</div>
                      <div className="text-xs text-muted-foreground px-2 text-center">
                        {comic.title}
                      </div>
                    </div>
                  </div>
                  {comic.isKey && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded px-2 py-1">
                      <div className="text-xs font-medium flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Key
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-background/90 rounded px-2 py-1">
                    <div className="text-xs font-medium flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {comic.watchers}
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-red-500 text-white rounded px-2 py-1">
                    <div className="text-xs font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {comic.timeLeft}
                    </div>
                  </div>
                </div>
                
                {/* Comic Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-1">{comic.title}</h3>
                    <p className="text-xs text-muted-foreground">({comic.year})</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-secondary px-2 py-1 rounded">{comic.condition}</span>
                    <span className="text-lg font-bold text-primary">{comic.price}</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Seller: {comic.seller}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">Bid Now</Button>
                    <Button size="sm" variant="outline">
                      <Star className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Categories */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Golden Age", count: "1,234 comics", color: "bg-yellow-500" },
              { name: "Silver Age", count: "2,567 comics", color: "bg-gray-400" },
              { name: "Modern Age", count: "4,891 comics", color: "bg-blue-500" },
              { name: "Key Issues", count: "892 comics", color: "bg-purple-500" }
            ].map((category, i) => (
              <div key={i} className="p-6 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className={`w-12 h-12 ${category.color} rounded-lg mb-4 flex items-center justify-center text-white font-bold text-xl`}>
                  {category.name.charAt(0)}
                </div>
                <h3 className="font-semibold mb-1">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-8 space-y-4">
          <h3 className="text-xl font-semibold">Ready to Start Collecting?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of collectors buying and selling comics on Comicogs. 
            Find rare issues, track your collection, and connect with fellow enthusiasts.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">Browse All Listings</Button>
            <Button size="lg" variant="outline">Start Selling</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
