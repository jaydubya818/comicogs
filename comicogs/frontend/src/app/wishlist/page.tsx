"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Search, Filter, Star, DollarSign, Bell, Trash2, Plus } from "lucide-react";

export default function WishlistPage() {
  const [sortBy, setSortBy] = useState("date-added");
  const [filterBy, setFilterBy] = useState("all");

  const wishlistItems = [
    {
      id: 1,
      title: "Amazing Spider-Man #300",
      series: "Amazing Spider-Man",
      issue: "#300",
      year: 1988,
      publisher: "Marvel Comics",
      estimatedPrice: "$150 - $350",
      priority: "high",
      notes: "First appearance of Venom",
      dateAdded: "2024-01-15",
      alertPrice: 200,
      isKeyIssue: true
    },
    {
      id: 2,
      title: "Batman: The Killing Joke",
      series: "Batman: The Killing Joke",
      issue: "#1",
      year: 1988,
      publisher: "DC Comics",
      estimatedPrice: "$75 - $150",
      priority: "medium",
      notes: "Classic Joker story by Alan Moore",
      dateAdded: "2024-01-20",
      alertPrice: 100,
      isKeyIssue: true
    },
    {
      id: 3,
      title: "Watchmen #1",
      series: "Watchmen",
      issue: "#1",
      year: 1986,
      publisher: "DC Comics",
      estimatedPrice: "$25 - $50",
      priority: "medium",
      notes: "Complete the series",
      dateAdded: "2024-02-01",
      alertPrice: 30,
      isKeyIssue: false
    },
    {
      id: 4,
      title: "Saga #1",
      series: "Saga",
      issue: "#1",
      year: 2012,
      publisher: "Image Comics",
      estimatedPrice: "$40 - $80",
      priority: "low",
      notes: "Modern classic",
      dateAdded: "2024-02-10",
      alertPrice: 50,
      isKeyIssue: false
    }
  ];

  const filteredItems = wishlistItems.filter(item => {
    if (filterBy === "all") return true;
    if (filterBy === "high") return item.priority === "high";
    if (filterBy === "medium") return item.priority === "medium";
    if (filterBy === "low") return item.priority === "low";
    if (filterBy === "key") return item.isKeyIssue;
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "date-added":
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      case "title":
        return a.title.localeCompare(b.title);
      case "price":
        return a.alertPrice - b.alertPrice;
      default:
        return 0;
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Wishlist</h1>
                <p className="text-muted-foreground">
                  Comics you want to add to your collection
                </p>
              </div>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add to Wishlist
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">{wishlistItems.length}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">
                  {wishlistItems.filter(item => item.priority === "high").length}
                </div>
                <div className="text-sm text-muted-foreground">High Priority</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">
                  ${wishlistItems.reduce((sum, item) => sum + item.alertPrice, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Target Budget</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-primary">
                  {wishlistItems.filter(item => item.isKeyIssue).length}
                </div>
                <div className="text-sm text-muted-foreground">Key Issues</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search wishlist..." className="pl-10" />
          </div>

          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
              <SelectItem value="key">Key Issues</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-added">Date Added</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="price">Target Price</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            More Filters
          </Button>
        </div>

        {/* Wishlist Items */}
        <Tabs defaultValue="grid" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            <p className="text-sm text-muted-foreground">
              Showing {sortedItems.length} of {wishlistItems.length} items
            </p>
          </div>

          <TabsContent value="grid" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Comic Cover */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/5 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <div className="text-6xl">📚</div>
                        <div className="text-xs text-muted-foreground px-2">
                          {item.title}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      className={`absolute top-2 right-2`}
                      variant={getPriorityColor(item.priority) as any}
                    >
                      {item.priority}
                    </Badge>
                    {item.isKeyIssue && (
                      <Badge className="absolute top-2 left-2" variant="default">
                        <Star className="h-3 w-3 mr-1" />
                        Key
                      </Badge>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm line-clamp-2">{item.title}</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {item.series} {item.issue} ({item.year})
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Est. Price:</span>
                        <span className="font-medium">{item.estimatedPrice}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Alert at:</span>
                        <span className="font-medium text-primary">${item.alertPrice}</span>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.notes}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Bell className="h-3 w-3 mr-1" />
                        Alerts
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            {sortedItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded flex items-center justify-center">
                        <span className="text-2xl">📚</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{item.title}</h3>
                          <Badge variant={getPriorityColor(item.priority) as any} className="text-xs">
                            {item.priority}
                          </Badge>
                          {item.isKeyIssue && (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Key
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.series} {item.issue} ({item.year}) • {item.publisher}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.notes}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-sm text-muted-foreground">Est: {item.estimatedPrice}</div>
                      <div className="text-lg font-bold text-primary">Alert: ${item.alertPrice}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Bell className="h-3 w-3 mr-1" />
                          Alerts
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Empty State (when filtered results are empty) */}
        {sortedItems.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No items found</CardTitle>
              <CardDescription>
                Try adjusting your filters or add more items to your wishlist.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button>Add First Item</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
