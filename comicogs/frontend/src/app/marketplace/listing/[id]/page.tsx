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
  MapPin, 
  Shield, 
  ArrowLeft,
  DollarSign,
  History,
  MessageSquare,
  Flag
} from "lucide-react";
import Link from "next/link";

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = params.id as string;
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWatching, setIsWatching] = useState(false);

  // Mock data - in real app this would come from API based on listingId
  const listing = {
    id: listingId,
    title: "Amazing Spider-Man #1",
    series: "Amazing Spider-Man",
    issue: "#1",
    year: 1963,
    publisher: "Marvel Comics",
    condition: "VG+ 4.5",
    price: 12500,
    currentBid: 11200,
    buyNowPrice: 12500,
    timeLeft: "3d 12h 45m",
    watchers: 23,
    bidCount: 7,
    isKey: true,
    description: "First appearance of Spider-Man in his own title. This is a beautiful copy with excellent eye appeal. The cover is bright and colorful with only minor wear. A true key issue for any collector.",
    seller: {
      name: "ComicVault92",
      rating: 4.9,
      feedbackCount: 1247,
      location: "New York, NY",
      memberSince: "2019"
    },
    images: [
      "/api/placeholder/400/600?text=Amazing+Spider-Man+1+Front",
      "/api/placeholder/400/600?text=Amazing+Spider-Man+1+Back", 
      "/api/placeholder/400/600?text=Amazing+Spider-Man+1+Spine",
      "/api/placeholder/400/600?text=Amazing+Spider-Man+1+Detail"
    ],
    specifications: {
      grade: "VG+ 4.5",
      certification: "CGC",
      pages: "Off-white to white",
      creators: ["Stan Lee", "Steve Ditko"],
      firstAppearance: "Spider-Man (own title)",
      keyIssue: true,
      printRun: "Unknown",
      isbn: "N/A"
    },
    shippingInfo: {
      cost: 15.99,
      method: "USPS Priority Mail",
      handling: "1-2 business days",
      insurance: "Included up to $500"
    }
  };

  const similarListings = [
    { id: "2", title: "Amazing Spider-Man #2", condition: "FN 6.0", price: "$850", image: "/api/placeholder/200/300?text=ASM+2" },
    { id: "3", title: "Amazing Spider-Man #3", condition: "VF 8.0", price: "$650", image: "/api/placeholder/200/300?text=ASM+3" },
    { id: "4", title: "Amazing Fantasy #15", condition: "GD 2.0", price: "$8,500", image: "/api/placeholder/200/300?text=AF+15" }
  ];

  const bidHistory = [
    { bidder: "collector***", amount: 11200, time: "2 hours ago" },
    { bidder: "spider***", amount: 11000, time: "4 hours ago" },
    { bidder: "marvel***", amount: 10500, time: "6 hours ago" },
    { bidder: "comic***", amount: 10000, time: "1 day ago" }
  ];

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
          <span className="text-muted-foreground">›</span>
          <Link href="/marketplace" className="text-muted-foreground hover:text-foreground">Marketplace</Link>
          <span className="text-muted-foreground">›</span>
          <span className="text-foreground">{listing.title}</span>
        </div>

        {/* Back Button */}
        <div>
          <Link href="/marketplace">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="space-y-4">
              <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="text-8xl">📚</div>
                    <div className="text-lg font-semibold text-muted-foreground px-4">
                      {listing.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Click thumbnails below to view different angles
                    </div>
                  </div>
                </div>
                {listing.isKey && (
                  <Badge className="absolute top-4 left-4" variant="default">
                    <Star className="h-3 w-3 mr-1" />
                    Key Issue
                  </Badge>
                )}
              </div>

              {/* Thumbnail Images */}
              <div className="grid grid-cols-4 gap-2">
                {["Front Cover", "Back Cover", "Spine", "Detail"].map((label, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-[3/4] bg-gradient-to-br from-secondary/50 to-secondary/20 rounded border-2 transition-colors ${
                      currentImageIndex === index ? 'border-primary' : 'border-transparent hover:border-muted-foreground'
                    }`}
                  >
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl mb-1">📷</div>
                        <div className="text-xs text-muted-foreground">{label}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Listing Details */}
            <Tabs defaultValue="description" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="specifications">Specs</TabsTrigger>
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
                <TabsTrigger value="seller">Seller Info</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Item Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {listing.description}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="specifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Specifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Grade:</span>
                        <p className="text-muted-foreground">{listing.specifications.grade}</p>
                      </div>
                      <div>
                        <span className="font-medium">Certification:</span>
                        <p className="text-muted-foreground">{listing.specifications.certification}</p>
                      </div>
                      <div>
                        <span className="font-medium">Pages:</span>
                        <p className="text-muted-foreground">{listing.specifications.pages}</p>
                      </div>
                      <div>
                        <span className="font-medium">Key Issue:</span>
                        <p className="text-muted-foreground">{listing.specifications.keyIssue ? "Yes" : "No"}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Creators:</span>
                        <p className="text-muted-foreground">{listing.specifications.creators.join(", ")}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">First Appearance:</span>
                        <p className="text-muted-foreground">{listing.specifications.firstAppearance}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="shipping" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Shipping Cost:</span>
                        <span>${listing.shippingInfo.cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Method:</span>
                        <span>{listing.shippingInfo.method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Handling Time:</span>
                        <span>{listing.shippingInfo.handling}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Insurance:</span>
                        <span>{listing.shippingInfo.insurance}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seller" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Seller Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{listing.seller.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{listing.seller.rating}</span>
                            <span>({listing.seller.feedbackCount} feedback)</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{listing.seller.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Member since {listing.seller.memberSince}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Bidding */}
          <div className="space-y-6">
            {/* Auction Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{listing.title}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsWatching(!isWatching)}
                    >
                      <Heart className={`h-4 w-4 ${isWatching ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Flag className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  {listing.series} {listing.issue} ({listing.year}) • {listing.publisher}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Bid:</span>
                    <span className="text-2xl font-bold text-primary">${listing.currentBid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Buy Now:</span>
                    <span className="font-semibold">${listing.buyNowPrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{listing.timeLeft}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{listing.watchers} watching</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" size="lg">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Place Bid
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    Buy Now - ${listing.buyNowPrice.toLocaleString()}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground text-center">
                  {listing.bidCount} bids • Shipping: ${listing.shippingInfo.cost}
                </div>
              </CardContent>
            </Card>

            {/* Bid History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Bid History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bidHistory.map((bid, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{bid.bidder}</span>
                      <div className="text-right">
                        <div className="font-semibold">${bid.amount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{bid.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Similar Listings */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {similarListings.map((item) => (
                    <Link key={item.id} href={`/marketplace/listing/${item.id}`}>
                      <div className="flex gap-3 p-2 rounded hover:bg-secondary/50 transition-colors">
                        <div className="w-12 h-16 bg-gradient-to-br from-secondary/50 to-secondary/20 rounded flex items-center justify-center">
                          <span className="text-lg">📚</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.title}</h4>
                          <p className="text-xs text-muted-foreground">{item.condition}</p>
                          <p className="text-sm font-semibold text-primary">{item.price}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
