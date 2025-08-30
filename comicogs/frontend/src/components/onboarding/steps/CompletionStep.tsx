'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, BookOpen, Users, Lightbulb, ArrowRight } from 'lucide-react'
import { useOnboarding } from '../OnboardingProvider'

export function CompletionStep() {
  const { getUserPreferences } = useOnboarding()
  const preferences = getUserPreferences()

  const nextSteps = [
    {
      title: 'Explore Your Dashboard',
      description: 'See your collection overview and quick actions',
      icon: <BookOpen className="h-5 w-5" />,
      action: 'Go to Dashboard',
      href: '/dashboard'
    },
    {
      title: 'Join the Community',
      description: 'Connect with other collectors and share your finds',
      icon: <Users className="h-5 w-5" />,
      action: 'Browse Community',
      href: '/community'
    },
    {
      title: 'Learn Pro Tips',
      description: 'Discover advanced features and collecting strategies',
      icon: <Lightbulb className="h-5 w-5" />,
      action: 'View Tutorials',
      href: '/help/tutorials'
    }
  ]

  const achievements = [
    { text: 'Profile created', completed: !!preferences.displayName },
    { text: 'Preferences set', completed: !!preferences.collectorType },
    { text: 'Features explored', completed: preferences.favoriteGenres?.length > 0 },
    { text: 'Ready to collect!', completed: true }
  ]

  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Welcome to Comicogs!</h2>
          <p className="text-muted-foreground">
            You're all set up and ready to start building your comic collection.
          </p>
        </div>
      </div>

      {/* Achievement summary */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Setup Complete</h3>
            <div className="space-y-2">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle 
                    className={`h-4 w-4 ${
                      achievement.completed ? 'text-green-500' : 'text-muted-foreground'
                    }`} 
                  />
                  <span className="text-sm">{achievement.text}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User summary */}
      {preferences.displayName && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Your Profile</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="text-sm font-medium">{preferences.displayName}</span>
                </div>
                {preferences.collectorType && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <Badge variant="secondary" className="text-xs">
                      {preferences.collectorType === 'casual' && 'Casual Reader'}
                      {preferences.collectorType === 'collector' && 'Collector'}
                      {preferences.collectorType === 'investor' && 'Investor'}
                      {preferences.collectorType === 'completionist' && 'Completionist'}
                    </Badge>
                  </div>
                )}
                {preferences.favoriteGenres?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Favorite Genres:</span>
                    <div className="flex flex-wrap gap-1">
                      {preferences.favoriteGenres.slice(0, 4).map((genre: string) => (
                        <Badge key={genre} variant="outline" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                      {preferences.favoriteGenres.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{preferences.favoriteGenres.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next steps */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">What's next?</h3>
        <div className="space-y-2">
          {nextSteps.map((step, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{step.title}</h4>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pro tip */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-medium text-sm">Pro Tip</h4>
            <p className="text-xs text-muted-foreground">
              Start by adding a few comics you already own to get familiar with the system. 
              You can always bulk import or scan collections later!
            </p>
          </div>
        </div>
      </div>

      {/* Help section */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Need help getting started?
        </p>
        <div className="flex justify-center gap-4 text-xs">
          <Button variant="link" size="sm" className="h-auto p-0">
            View Help Center
          </Button>
          <Button variant="link" size="sm" className="h-auto p-0">
            Watch Video Tutorials
          </Button>
          <Button variant="link" size="sm" className="h-auto p-0">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  )
}