'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Camera, User } from 'lucide-react'
import { useOnboarding } from '../OnboardingProvider'

interface ProfileData {
  displayName: string
  bio: string
  favoriteGenres: string[]
  collectorType: string
  avatar?: string
}

export function ProfileSetupStep() {
  const { updateUserPreferences, getUserPreferences } = useOnboarding()
  const [profileData, setProfileData] = useState<ProfileData>(() => {
    const prefs = getUserPreferences()
    return {
      displayName: prefs.displayName || '',
      bio: prefs.bio || '',
      favoriteGenres: prefs.favoriteGenres || [],
      collectorType: prefs.collectorType || '',
      avatar: prefs.avatar || ''
    }
  })

  const genres = [
    'Superhero', 'Science Fiction', 'Fantasy', 'Horror', 'Mystery',
    'Romance', 'Action', 'Adventure', 'Comedy', 'Drama',
    'Historical', 'Non-Fiction', 'Manga', 'Independent'
  ]

  const collectorTypes = [
    { id: 'casual', name: 'Casual Reader', description: 'I read for enjoyment' },
    { id: 'collector', name: 'Collector', description: 'I collect for value and completion' },
    { id: 'investor', name: 'Investor', description: 'I focus on investment potential' },
    { id: 'completionist', name: 'Completionist', description: 'I aim to complete series and runs' }
  ]

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    const updatedData = { ...profileData, [field]: value }
    setProfileData(updatedData)
    updateUserPreferences(updatedData)
  }

  const toggleGenre = (genre: string) => {
    const updatedGenres = profileData.favoriteGenres.includes(genre)
      ? profileData.favoriteGenres.filter(g => g !== genre)
      : [...profileData.favoriteGenres, genre]
    
    handleInputChange('favoriteGenres', updatedGenres)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Set up your profile</h3>
        <p className="text-sm text-muted-foreground">
          Tell us a bit about yourself to personalize your experience
        </p>
      </div>

      <div className="space-y-4">
        {/* Avatar and Display Name */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profileData.avatar} alt={profileData.displayName} />
                  <AvatarFallback className="text-lg">
                    {profileData.displayName ? getInitials(profileData.displayName) : <User className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0"
                  onClick={() => {
                    // In a real app, this would open file picker
                    console.log('Open avatar picker')
                  }}
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="How should we call you?"
                  value={profileData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell other collectors about yourself..."
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Collector Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What type of collector are you?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {collectorTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    profileData.collectorType === type.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleInputChange('collectorType', type.id)}
                >
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">{type.name}</h4>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Favorite Genres */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Favorite Genres</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select your favorite comic genres (you can change these later)
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <Badge
                  key={genre}
                  variant={profileData.favoriteGenres.includes(genre) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
            {profileData.favoriteGenres.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                Selected {profileData.favoriteGenres.length} genre{profileData.favoriteGenres.length !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save notice */}
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <p className="text-xs text-muted-foreground">
          Your profile information is saved automatically and can be updated anytime in your settings.
        </p>
      </div>
    </div>
  )
}