'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Search, Heart, TrendingUp } from 'lucide-react'

interface WelcomeStepProps {
  userName?: string
}

export function WelcomeStep({ userName }: WelcomeStepProps) {
  const features = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Build Your Collection",
      description: "Track and organize your comic book collection with detailed information and custom tags."
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: "Discover Comics",
      description: "Find new comics, explore series, and discover hidden gems with our powerful search."
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Create Wishlists",
      description: "Keep track of comics you want to read or buy, and get notified about price changes."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Market Intelligence",
      description: "Access real-time pricing data, market trends, and value tracking for your collection."
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="text-center space-y-3">
        <div className="text-4xl">🎉</div>
        <h2 className="text-2xl font-bold">
          Welcome{userName ? ` ${userName}` : ''} to Comicogs!
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Let's get you started with your comic book collection journey. 
          Here's what you can do with Comicogs:
        </p>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
                  {feature.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Getting started message */}
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <div className="space-y-2">
          <Badge variant="secondary" className="mb-2">Getting Started</Badge>
          <p className="text-sm text-muted-foreground">
            We'll walk you through the basics in just a few quick steps. 
            This should only take about 2-3 minutes.
          </p>
        </div>
      </div>
    </div>
  )
}