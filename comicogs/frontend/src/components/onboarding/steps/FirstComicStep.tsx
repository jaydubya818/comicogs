'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Scan, BookPlus, Star } from 'lucide-react'

interface Comic {
  id: string
  title: string
  issue: string
  publisher: string
  year: number
  cover: string
  grade?: string
  value?: number
}

export function FirstComicStep() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null)
  const [addMethod, setAddMethod] = useState<'search' | 'scan' | 'manual'>('search')

  // Mock popular comics for demonstration
  const popularComics: Comic[] = [
    {
      id: '1',
      title: 'The Amazing Spider-Man',
      issue: '#1',
      publisher: 'Marvel Comics',
      year: 1963,
      cover: '🕷️',
      value: 45000
    },
    {
      id: '2',
      title: 'Batman',
      issue: '#1',
      publisher: 'DC Comics',
      year: 1940,
      cover: '🦇',
      value: 120000
    },
    {
      id: '3',
      title: 'X-Men',
      issue: '#1',
      publisher: 'Marvel Comics',
      year: 1963,
      cover: '⚡',
      value: 25000
    },
    {
      id: '4',
      title: 'Superman',
      issue: '#1',
      publisher: 'DC Comics',
      year: 1939,
      cover: '🦸‍♂️',
      value: 200000
    }
  ]

  const searchResults: Comic[] = searchQuery.length > 0 
    ? popularComics.filter(comic => 
        comic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comic.publisher.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const handleComicSelect = (comic: Comic) => {
    setSelectedComic(comic)
  }

  const handleAddToCollection = () => {
    if (selectedComic) {
      // In a real app, this would add the comic to the user's collection
      console.log('Adding comic to collection:', selectedComic)
      // You might want to call an API here or update local state
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Add your first comic</h3>
        <p className="text-sm text-muted-foreground">
          Let's start building your collection! Choose how you'd like to add your first comic.
        </p>
      </div>

      <Tabs value={addMethod} onValueChange={(value: string) => setAddMethod(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <Scan className="h-4 w-4" />
            Scan
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <BookPlus className="h-4 w-4" />
            Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a comic title or publisher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchQuery.length === 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Popular Comics</h4>
                <div className="grid grid-cols-1 gap-2">
                  {popularComics.map((comic) => (
                    <ComicCard
                      key={comic.id}
                      comic={comic}
                      isSelected={selectedComic?.id === comic.id}
                      onClick={() => handleComicSelect(comic)}
                    />
                  ))}
                </div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Search Results</h4>
                <div className="grid grid-cols-1 gap-2">
                  {searchResults.map((comic) => (
                    <ComicCard
                      key={comic.id}
                      comic={comic}
                      isSelected={selectedComic?.id === comic.id}
                      onClick={() => handleComicSelect(comic)}
                    />
                  ))}
                </div>
              </div>
            )}

            {searchQuery.length > 0 && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No comics found matching "{searchQuery}"</p>
                <p className="text-xs mt-1">Try a different search term or add manually.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scan" className="space-y-4">
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Scan className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Scan a comic book</h4>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Use your camera to scan the barcode or cover of a comic book for instant identification.
              </p>
            </div>
            <Button variant="outline" className="mt-4">
              <Scan className="h-4 w-4 mr-2" />
              Open Camera
            </Button>
            <p className="text-xs text-muted-foreground">
              Scanning feature coming soon in the mobile app!
            </p>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Comic Manually</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input placeholder="Comic title" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Issue #</label>
                  <Input placeholder="1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Publisher</label>
                  <Input placeholder="Marvel, DC, etc." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Input placeholder="2024" type="number" />
                </div>
              </div>
              <Button className="w-full">
                <BookPlus className="h-4 w-4 mr-2" />
                Add to Collection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedComic && (
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">Selected Comic</h4>
            <ComicCard comic={selectedComic} isSelected={true} />
          </div>
          <Button onClick={handleAddToCollection} className="w-full">
            <BookPlus className="h-4 w-4 mr-2" />
            Add "{selectedComic.title} {selectedComic.issue}" to Collection
          </Button>
        </div>
      )}

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          💡 You can always add more comics later from your dashboard
        </p>
      </div>
    </div>
  )
}

interface ComicCardProps {
  comic: Comic
  isSelected?: boolean
  onClick?: () => void
}

function ComicCard({ comic, isSelected, onClick }: ComicCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl flex-shrink-0">
            {comic.cover}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h5 className="font-medium text-sm truncate">
                {comic.title} {comic.issue}
              </h5>
              {comic.value && comic.value > 1000 && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Key Issue
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{comic.publisher}</span>
              <span>•</span>
              <span>{comic.year}</span>
              {comic.value && (
                <>
                  <span>•</span>
                  <span className="font-medium text-green-600">
                    ${comic.value.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}