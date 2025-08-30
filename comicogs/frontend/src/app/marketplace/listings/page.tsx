"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Star, MapPin, Calendar, DollarSign } from "lucide-react";

export default function MarketplaceListingsPage() {
  const [sortBy, setSortBy] = useState("newest");

  const sampleListings = [
    {
      id: 1,
      title: "Amazing Spider-Man #1 (1963)",
      condition: "VG+ 4.5",
      price: "$12,500",
      seller: "ComicCollector92",
      location: "New York, NY",
      images: 8,
      watchers: 23
    },
    {
      id: 2,
      title: "Batman #1 (1940)",
      condition: "GD 2.0",
      price: "$8,750",
      seller: "VintageComics",
      location: "Los Angeles, CA",
      images: 12,
      watchers: 45
    },
    {
      id: 3,
      title: "X-Men #1 (1963)",
      condition: "FN 6.0",
      price: "$3,200",
      seller: "MarvelMaster",
      location: "Chicago, IL",
      images: 6,
      watchers: 18
    }
  ];

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Marketplace Listings</h1>
          <p className="text-muted-foreground">
            Browse and discover comics from sellers around the world.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input placeholder="Search listings..." className="w-full" />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              <SelectItem value="most-watched">Most Watched</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {sampleListings.length} of 1,247 listings
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <Button variant="outline" size="sm">Grid</Button>
            <Button variant="ghost" size="sm">List</Button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleListings.map((listing) => (
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

        {/* Load More */}
        <div className="text-center">
          <Button variant="outline" size="lg">Load More Listings</Button>
        </div>
      </div>
    </main>
  );
}
