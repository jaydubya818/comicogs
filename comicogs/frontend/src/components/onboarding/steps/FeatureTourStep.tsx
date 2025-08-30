'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Search, 
  Heart, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  BarChart3,
  Bell,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'

interface FeatureTourStepProps {
  onFeatureSelect?: (features: string[]) => void
}

export function FeatureTourStep({ onFeatureSelect }: FeatureTourStepProps) {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  const features = [
    {
      id: 'collection',
      name: 'Collection Management',
      icon: <BookOpen className="h-8 w-8" />,
      description: 'Organize and track your comic book collection',
      benefits: [
        'Add comics by scanning or searching',
        'Track condition and value',
        'Organize with custom tags and categories',
        'View collection statistics and insights'
      ],
      image: '📚'
    },
    {
      id: 'search',
      name: 'Advanced Search',
      icon: <Search className="h-8 w-8" />,
      description: 'Find any comic with powerful search and filtering',
      benefits: [
        'Search by title, creator, publisher, or character',
        'Filter by year, genre, condition, and more',
        'Save favorite searches',
        'Get recommendations based on your collection'
      ],
      image: '🔍'
    },
    {
      id: 'wishlist',
      name: 'Wishlist & Tracking',
      icon: <Heart className="h-8 w-8" />,
      description: 'Keep track of comics you want to collect',
      benefits: [
        'Create multiple wishlists',
        'Set price alerts for wanted issues',
        'Track availability across stores',
        'Share wishlists with friends'
      ],
      image: '❤️'
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      icon: <ShoppingCart className="h-8 w-8" />,
      description: 'Buy and sell comics safely',
      benefits: [
        'List comics for sale with photos',
        'Browse verified seller listings',
        'Secure payment processing',
        'Buyer protection guarantee'
      ],
      image: '🛒'
    },
    {
      id: 'analytics',
      name: 'Value Tracking',
      icon: <TrendingUp className="h-8 w-8" />,
      description: 'Monitor your collection\'s value and trends',
      benefits: [
        'Real-time market value tracking',
        'Portfolio performance analytics',
        'Price history and trend analysis',
        'Investment insights and reports'
      ],
      image: '📈'
    },
    {
      id: 'community',
      name: 'Community Features',
      icon: <Users className="h-8 w-8" />,
      description: 'Connect with other collectors',
      benefits: [
        'Join collector groups and discussions',
        'Share collection photos and stories',
        'Trade with trusted community members',
        'Get expert opinions and valuations'
      ],
      image: '👥'
    }
  ]

  const currentFeature = features[currentFeatureIndex]

  const nextFeature = () => {
    if (currentFeatureIndex < features.length - 1) {
      setCurrentFeatureIndex(currentFeatureIndex + 1)
    }
  }

  const prevFeature = () => {
    if (currentFeatureIndex > 0) {
      setCurrentFeatureIndex(currentFeatureIndex - 1)
    }
  }

  const toggleFeatureSelection = (featureId: string) => {
    const updated = selectedFeatures.includes(featureId)
      ? selectedFeatures.filter(id => id !== featureId)
      : [...selectedFeatures, featureId]
    
    setSelectedFeatures(updated)
    onFeatureSelect?.(updated)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Explore Comicogs Features</h3>
        <p className="text-sm text-muted-foreground">
          Discover what you can do with your collection
        </p>
      </div>

      {/* Feature showcase */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Feature header */}
            <div className="flex items-center gap-4">
              <div className="text-4xl">{currentFeature.image}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{currentFeature.name}</h4>
                  <Badge 
                    variant={selectedFeatures.includes(currentFeature.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleFeatureSelection(currentFeature.id)}
                  >
                    {selectedFeatures.includes(currentFeature.id) ? 'Selected' : 'Select'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentFeature.description}
                </p>
              </div>
            </div>

            {/* Feature benefits */}
            <div className="grid grid-cols-1 gap-2">
              {currentFeature.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={prevFeature}
              disabled={currentFeatureIndex === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                    index === currentFeatureIndex 
                      ? 'bg-primary' 
                      : 'bg-muted-foreground/30'
                  }`}
                  onClick={() => setCurrentFeatureIndex(index)}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={nextFeature}
              disabled={currentFeatureIndex === features.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected features summary */}
      {selectedFeatures.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Features you're interested in:</h5>
            <div className="flex flex-wrap gap-2">
              {selectedFeatures.map(featureId => {
                const feature = features.find(f => f.id === featureId)
                return (
                  <Badge key={featureId} variant="secondary">
                    {feature?.name}
                  </Badge>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              We'll highlight these features for you as you explore Comicogs.
            </p>
          </div>
        </div>
      )}

      {/* Quick tip */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          💡 Don't worry if you're not sure yet - you can explore all features anytime!
        </p>
      </div>
    </div>
  )
}