'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Star, EyeOff, Trash2 } from 'lucide-react';

interface Comic {
  id: string;
  title: string;
  series: string;
  issue: string;
  grade?: string;
  coverUrl?: string;
}

interface Seller {
  id: string;
  name?: string;
}

interface Listing {
  id: string;
  price: number;
  status: string;
  createdAt: string;
  comic: Comic;
  seller: Seller;
}

export default function ModerationPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate admin authentication for demo
  const adminEmail = 'admin@comicogs.com';

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/listings', {
        headers: {
          'x-user-email': adminEmail, // Demo auth header
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      
      const data = await response.json();
      setListings(data.listings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleFeature = async (listingId: string) => {
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': adminEmail,
        },
        body: JSON.stringify({ status: 'featured' }),
      });

      if (!response.ok) {
        throw new Error('Failed to feature listing');
      }

      // Refresh listings
      await fetchListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to feature listing');
    }
  };

  const handleHide = async (listingId: string) => {
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': adminEmail,
        },
        body: JSON.stringify({ status: 'draft' }),
      });

      if (!response.ok) {
        throw new Error('Failed to hide listing');
      }

      // Refresh listings
      await fetchListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hide listing');
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': adminEmail,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete listing');
      }

      // Refresh listings
      await fetchListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete listing');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      featured: 'secondary',
      draft: 'outline',
      sold: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading listings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Moderation</h1>
        <p className="text-muted-foreground mt-2">
          Manage and moderate marketplace listings
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Listings</CardTitle>
          <CardDescription>
            Latest marketplace listings requiring moderation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No listings found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comic</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {listing.comic.coverUrl && (
                          <img
                            src={listing.comic.coverUrl}
                            alt={`${listing.comic.series} #${listing.comic.issue}`}
                            className="w-12 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">
                            {listing.comic.series} #{listing.comic.issue}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {listing.comic.title}
                          </div>
                          {listing.comic.grade && (
                            <div className="text-xs text-muted-foreground">
                              Grade: {listing.comic.grade}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {listing.seller.name || 'Unknown Seller'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(listing.price)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(listing.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(listing.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFeature(listing.id)}
                          title="Feature this listing"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleHide(listing.id)}
                          title="Hide this listing"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(listing.id)}
                          title="Delete this listing"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
