"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUpload from "@/components/ui/ImageUpload";
import { ArrowLeft, DollarSign, Package, Camera, FileText } from "lucide-react";
import Link from "next/link";

export default function SellComicPage() {
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    series: "",
    issue: "",
    year: "",
    publisher: "",
    condition: "",
    grade: "",
    description: "",
    startingBid: "",
    buyNowPrice: "",
    auctionDuration: "7",
    shippingCost: "15.99",
    returnPolicy: "30"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data:", formData);
    console.log("Images:", images);
    // Here you would submit to your API
  };

  return (
    <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/marketplace">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Button>
          </Link>
          
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sell Your Comic</h1>
            <p className="text-muted-foreground">
              List your comic book for sale on the Comicogs marketplace
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Images
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="shipping" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Shipping
              </TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Comic Information</CardTitle>
                  <CardDescription>
                    Provide detailed information about your comic book
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Amazing Spider-Man"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="series">Series *</Label>
                      <Input
                        id="series"
                        placeholder="e.g., Amazing Spider-Man Vol. 1"
                        value={formData.series}
                        onChange={(e) => handleInputChange("series", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="issue">Issue Number *</Label>
                      <Input
                        id="issue"
                        placeholder="e.g., #1, #300, Annual #1"
                        value={formData.issue}
                        onChange={(e) => handleInputChange("issue", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Publication Year *</Label>
                      <Input
                        id="year"
                        type="number"
                        placeholder="e.g., 1963"
                        min="1930"
                        max={new Date().getFullYear()}
                        value={formData.year}
                        onChange={(e) => handleInputChange("year", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="publisher">Publisher *</Label>
                      <Select value={formData.publisher} onValueChange={(value) => handleInputChange("publisher", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select publisher" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marvel">Marvel Comics</SelectItem>
                          <SelectItem value="dc">DC Comics</SelectItem>
                          <SelectItem value="image">Image Comics</SelectItem>
                          <SelectItem value="dark-horse">Dark Horse Comics</SelectItem>
                          <SelectItem value="idw">IDW Publishing</SelectItem>
                          <SelectItem value="boom">Boom! Studios</SelectItem>
                          <SelectItem value="dynamite">Dynamite Entertainment</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition *</Label>
                      <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mint">Mint (M) 10.0</SelectItem>
                          <SelectItem value="near-mint-plus">Near Mint+ (NM+) 9.6</SelectItem>
                          <SelectItem value="near-mint">Near Mint (NM) 9.4</SelectItem>
                          <SelectItem value="near-mint-minus">Near Mint- (NM-) 9.2</SelectItem>
                          <SelectItem value="very-fine-plus">Very Fine+ (VF+) 8.5</SelectItem>
                          <SelectItem value="very-fine">Very Fine (VF) 8.0</SelectItem>
                          <SelectItem value="very-fine-minus">Very Fine- (VF-) 7.5</SelectItem>
                          <SelectItem value="fine-plus">Fine+ (FN+) 6.5</SelectItem>
                          <SelectItem value="fine">Fine (FN) 6.0</SelectItem>
                          <SelectItem value="fine-minus">Fine- (FN-) 5.5</SelectItem>
                          <SelectItem value="very-good-plus">Very Good+ (VG+) 4.5</SelectItem>
                          <SelectItem value="very-good">Very Good (VG) 4.0</SelectItem>
                          <SelectItem value="very-good-minus">Very Good- (VG-) 3.5</SelectItem>
                          <SelectItem value="good-plus">Good+ (GD+) 2.5</SelectItem>
                          <SelectItem value="good">Good (GD) 2.0</SelectItem>
                          <SelectItem value="fair">Fair (FR) 1.5</SelectItem>
                          <SelectItem value="poor">Poor (PR) 1.0</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the condition, any defects, and other relevant details about your comic..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Images */}
            <TabsContent value="images" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Comic Images</CardTitle>
                  <CardDescription>
                    Upload high-quality images of your comic. The first image will be used as the main cover.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    onImagesChange={setImages}
                    maxImages={8}
                    maxSize={10}
                    className="w-full"
                  />
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Photography Tips:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Use good lighting - natural light works best</li>
                      <li>• Include front cover, back cover, and spine</li>
                      <li>• Show any defects or damage clearly</li>
                      <li>• Keep images sharp and in focus</li>
                      <li>• Use a plain background</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing */}
            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Auction Settings</CardTitle>
                  <CardDescription>
                    Set your starting bid, buy now price, and auction duration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startingBid">Starting Bid ($) *</Label>
                      <Input
                        id="startingBid"
                        type="number"
                        placeholder="0.99"
                        min="0.01"
                        step="0.01"
                        value={formData.startingBid}
                        onChange={(e) => handleInputChange("startingBid", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buyNowPrice">Buy Now Price ($)</Label>
                      <Input
                        id="buyNowPrice"
                        type="number"
                        placeholder="Optional"
                        min="0.01"
                        step="0.01"
                        value={formData.buyNowPrice}
                        onChange={(e) => handleInputChange("buyNowPrice", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="auctionDuration">Auction Duration</Label>
                      <Select value={formData.auctionDuration} onValueChange={(value) => handleInputChange("auctionDuration", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="5">5 days</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="10">10 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold mb-2">Pricing Tips:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Research recent sales of similar comics</li>
                      <li>• Consider the condition when pricing</li>
                      <li>• Lower starting bids can generate more interest</li>
                      <li>• Buy Now prices should be competitive</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shipping */}
            <TabsContent value="shipping" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping & Returns</CardTitle>
                  <CardDescription>
                    Configure shipping options and return policy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingCost">Shipping Cost ($) *</Label>
                      <Input
                        id="shippingCost"
                        type="number"
                        placeholder="15.99"
                        min="0"
                        step="0.01"
                        value={formData.shippingCost}
                        onChange={(e) => handleInputChange("shippingCost", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="returnPolicy">Return Period (days)</Label>
                      <Select value={formData.returnPolicy} onValueChange={(value) => handleInputChange("returnPolicy", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">No returns</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-semibold mb-2">Shipping Best Practices:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Use proper comic book packaging materials</li>
                      <li>• Include tracking and insurance for valuable items</li>
                      <li>• Ship within 1-2 business days of payment</li>
                      <li>• Communicate with buyers about shipping updates</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/marketplace">Cancel</Link>
            </Button>
            <Button type="submit" size="lg">
              List Your Comic
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
