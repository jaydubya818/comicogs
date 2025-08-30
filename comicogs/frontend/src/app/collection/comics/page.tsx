"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book, Search, Filter, ArrowLeft, Star, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";

export default function CollectionComicsPage() {
  const [sortBy, setSortBy] = useState("title");
  const [filterBy, setFilterBy] = useState("all");

  const comics = [
    {
      id: 1,
      title: "Amazing Spider-Man #1",
      year: 1963,
      condition: "VG+ 4.5",
      value: 12500,
      series: "Amazing Spider-Man",
      volume: 1,
      issue: 1,
      acquired: "2024-01-15",
      isKey: true,
      publisher: "Marvel",
      creators: ["Stan Lee", "Steve Ditko"]
    },
    {
      id: 2,
      title: "Batman #1",
      year: 1940,
      condition: "GD 2.0",
      value: 8750,
      series: "Batman",
      volume: 1,
      issue: 1,
      acquired: "2023-11-22",
      isKey: true,
      publisher: "DC Comics",
      creators: ["Bob Kane", "Bill Finger"]
    },
    {
      id: 3,
      title: "X-Men #1",
      year: 1963,
      condition: "FN 6.0",
      value: 3200,
      series: "X-Men",
      volume: 1,
      issue: 1,
      acquired: "2023-08-10",
      isKey: true,
      publisher: "Marvel",
      creators: ["Stan Lee", "Jack Kirby"]
    },
    {
      id: 4,
      title: "Amazing Spider-Man #129",
      year: 1974,
      condition: "VF 8.0",
      value: 850,
      series: "Amazing Spider-Man",
      volume: 1,
      issue: 129,
      acquired: "2024-02-01",
      isKey: false,
      publisher: "Marvel",
      creators: ["Gerry Conway", "Ross Andru"]
    },
    {
      id: 5,
      title: "Superman #1",
      year: 1939,
      condition: "PR 0.5",
      value: 15000,
      series: "Superman",
      volume: 1,
      issue: 1,
      acquired: "2023-12-05",
      isKey: true,
      publisher: "DC Comics",
      creators: ["Jerry Siegel", "Joe Shuster"]
    }
  ];

  const filteredComics = comics.filter(comic => {
    if (filterBy === "all") return true;
    if (filterBy === "key") return comic.isKey;
    if (filterBy === "marvel") return comic.publisher === "Marvel";
    if (filterBy === "dc") return comic.publisher === "DC Comics";
    return true;
  });

  const sortedComics = [...filteredComics].sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title);
      case "value-high":
        return b.value - a.value;
      case "value-low":
        return a.value - b.value;
      case "year":
        return a.year - b.year;
      case "acquired":
        return new Date(b.acquired).getTime() - new Date(a.acquired).getTime();
      default:
        return 0;
    }
  });

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Link href="/collection">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Collection
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Book className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Comic Books</h1>
                <p className="text-muted-foreground">
                  Detailed view of all comics in your collection
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search your comics..." className="pl-10" />
          </div>

          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Comics</SelectItem>
              <SelectItem value="key">Key Issues</SelectItem>
              <SelectItem value="marvel">Marvel</SelectItem>
              <SelectItem value="dc">DC Comics</SelectItem>
            </SelectContent>
          </Select>

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

          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
          </Button>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {sortedComics.length} of {comics.length} comics
          </p>
          <div className="text-sm text-muted-foreground">
            Total Value: ${sortedComics.reduce((sum, comic) => sum + comic.value, 0).toLocaleString()}
          </div>
        </div>

        {/* Comics List */}
        <div className="space-y-4">
          {sortedComics.map((comic) => (
            <Card key={comic.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-6">
                  {/* Comic Cover */}
                  <div className="w-20 h-28 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                    <span className="text-3xl">📚</span>
                    {comic.isKey && (
                      <Badge className="absolute -top-2 -right-2 text-xs" variant="default">
                        <Star className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>

                  {/* Comic Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{comic.title}</h3>
                          {comic.isKey && (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Key Issue
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {comic.series} Vol. {comic.volume} #{comic.issue} ({comic.year})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {comic.publisher} • {comic.creators.join(", ")}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-xl font-bold text-primary">
                          ${comic.value.toLocaleString()}
                        </div>
                        <Badge variant="outline">{comic.condition}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Added {new Date(comic.acquired).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>Est. {comic.condition} Grade</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">Edit Details</Button>
                      <Button size="sm" variant="outline">View Images</Button>
                      <Button size="sm" variant="outline">Price History</Button>
                      <Button size="sm" variant="outline">Similar Listings</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        {sortedComics.length < comics.length && (
          <div className="text-center">
            <Button variant="outline" size="lg">Load More Comics</Button>
          </div>
        )}
      </div>
    </main>
  );
}
