"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  DollarSign, 
  Camera, 
  FileText, 
  TrendingUp, 
  Star,
  AlertCircle,
  CheckCircle,
  Plus
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export default function SellPage() {
  const [activeListings, setActiveListings] = useState(12);
  const [soldItems, setSoldItems] = useState(45);

  const recentSales = [
    { id: 1, title: "Amazing Spider-Man #14", condition: "VF 8.0", soldPrice: "$125", soldDate: "2 hours ago" },
    { id: 2, title: "Batman #232", condition: "FN+ 6.5", soldPrice: "$85", soldDate: "1 day ago" },
    { id: 3, title: "X-Men #101", condition: "NM 9.4", soldPrice: "$45", soldDate: "3 days ago" }
  ];

  const tips = [
    "High-quality photos increase your chances of selling by 40%",
    "Accurate condition grading builds trust with buyers", 
    "Competitive pricing based on recent sales drives faster sales",
    "Detailed descriptions help buyers make confident decisions"
  ];

  return (
    <AppShell
      pageTitle="Sell Your Comics"
      pageDescription="List your comics for sale on the Comicogs marketplace"
    >
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Sell Your Comics</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of sellers on Comicogs marketplace. List your comics and reach collectors worldwide.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeListings}</p>
                    <p className="text-muted-foreground">Active Listings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg dark:bg-green-900/20">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{soldItems}</p>
                    <p className="text-muted-foreground">Items Sold</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-100 rounded-lg dark:bg-yellow-900/20">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">4.8</p>
                    <p className="text-muted-foreground">Seller Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="list" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="list">List New Item</TabsTrigger>
              <TabsTrigger value="active">Active Listings</TabsTrigger>
              <TabsTrigger value="sold">Sales History</TabsTrigger>
              <TabsTrigger value="tips">Selling Tips</TabsTrigger>
            </TabsList>

            {/* List New Item Tab */}
            <TabsContent value="list" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create New Listing
                  </CardTitle>
                  <CardDescription>
                    Fill out the details below to list your comic for sale
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Comic Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input placeholder="e.g., Amazing Spider-Man" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Issue Number</label>
                        <Input placeholder="e.g., #1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Publisher</label>
                        <Input placeholder="e.g., Marvel Comics" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Year</label>
                        <Input placeholder="e.g., 1963" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Condition</label>
                        <Input placeholder="e.g., VF 8.0" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Starting Price</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="0.00" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Buy It Now Price (Optional)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="0.00" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Auction Duration</label>
                        <select className="w-full px-3 py-2 border border-border rounded-md">
                          <option>7 days</option>
                          <option>5 days</option>
                          <option>3 days</option>
                          <option>1 day</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Photos */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium">Photos</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8">
                      <div className="text-center space-y-4">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Upload photos of your comic</p>
                          <p className="text-xs text-muted-foreground">Front cover, back cover, and any damage (JPG, PNG, up to 5MB each)</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Camera className="h-4 w-4 mr-2" />
                          Choose Files
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea 
                      className="w-full h-32 px-3 py-2 border border-border rounded-md"
                      placeholder="Describe the comic's condition, any notable features, or defects..."
                    />
                  </div>

                  <Button className="w-full" size="lg">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Listing
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Active Listings Tab */}
            <TabsContent value="active" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Active Listings</CardTitle>
                  <CardDescription>
                    {activeListings} comics currently listed for sale
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">No active listings yet</p>
                    <p className="text-sm">Create your first listing to start selling!</p>
                    <Button className="mt-4" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Listing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sales History Tab */}
            <TabsContent value="sold" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>
                    Your successfully sold items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-16 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/10 rounded flex items-center justify-center">
                            <span className="text-lg">📚</span>
                          </div>
                          <div>
                            <h4 className="font-medium">{sale.title}</h4>
                            <p className="text-sm text-muted-foreground">{sale.condition}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{sale.soldPrice}</p>
                          <p className="text-xs text-muted-foreground">{sale.soldDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Selling Tips Tab */}
            <TabsContent value="tips" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Photography Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Camera className="h-5 w-5 mt-1 text-primary" />
                      <div>
                        <p className="font-medium">Use natural lighting</p>
                        <p className="text-sm text-muted-foreground">Avoid flash, use window light or daylight</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Camera className="h-5 w-5 mt-1 text-primary" />
                      <div>
                        <p className="font-medium">Show front and back covers</p>
                        <p className="text-sm text-muted-foreground">Include spine and any damage or defects</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pricing Guidelines</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <DollarSign className="h-5 w-5 mt-1 text-primary" />
                      <div>
                        <p className="font-medium">Research recent sales</p>
                        <p className="text-sm text-muted-foreground">Check sold listings for similar items</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <DollarSign className="h-5 w-5 mt-1 text-primary" />
                      <div>
                        <p className="font-medium">Start competitive</p>
                        <p className="text-sm text-muted-foreground">Slightly below market rate for faster sales</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Success Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tips.map((tip, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                        <p className="text-sm">{tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </AppShell>
  );
}