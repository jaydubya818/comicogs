import { OnboardingFlow } from '../OnboardingProvider'
import { WelcomeStep } from '../steps/WelcomeStep'
import { ProfileSetupStep } from '../steps/ProfileSetupStep'
import { FeatureTourStep } from '../steps/FeatureTourStep'
import { FirstComicStep } from '../steps/FirstComicStep'
import { CompletionStep } from '../steps/CompletionStep'

export const newUserOnboardingFlow: OnboardingFlow = {
  id: 'new-user-onboarding',
  name: 'Welcome to Comicogs',
  description: 'Get started with your comic collection journey',
  currentStepIndex: 0,
  isCompleted: false,
  canRestart: true,
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Comicogs',
      description: 'Learn what you can do with your comic collection',
      component: <WelcomeStep />,
      isRequired: false,
      isCompleted: false,
      canSkip: true,
      nextStep: 'profile-setup'
    },
    {
      id: 'profile-setup',
      title: 'Set Up Your Profile',
      description: 'Tell us about yourself and your collecting preferences',
      component: <ProfileSetupStep />,
      isRequired: false,
      isCompleted: false,
      canSkip: true,
      nextStep: 'feature-tour',
      prevStep: 'welcome',
      validationFn: async () => {
        // Optional: validate profile data
        return true
      }
    },
    {
      id: 'feature-tour',
      title: 'Explore Features',
      description: 'Discover what Comicogs can do for your collection',
      component: <FeatureTourStep />,
      isRequired: false,
      isCompleted: false,
      canSkip: true,
      nextStep: 'first-comic',
      prevStep: 'profile-setup'
    },
    {
      id: 'first-comic',
      title: 'Add Your First Comic',
      description: 'Start building your collection',
      component: <FirstComicStep />,
      isRequired: false,
      isCompleted: false,
      canSkip: true,
      nextStep: 'completion',
      prevStep: 'feature-tour'
    },
    {
      id: 'completion',
      title: 'Setup Complete',
      description: 'You\'re ready to start collecting!',
      component: <CompletionStep />,
      isRequired: true,
      isCompleted: false,
      canSkip: false,
      prevStep: 'first-comic',
      completionFn: async () => {
        // Mark user as onboarded
        console.log('User onboarding completed')
        // You might want to call an API to update user status
      }
    }
  ],
  metadata: {
    onComplete: () => {
      // Redirect to dashboard or show success message
      console.log('New user onboarding flow completed')
    },
    estimatedTime: '3-5 minutes',
    category: 'getting-started'
  }
}

// Alternative quick flow for users who want to skip detailed setup
export const quickStartFlow: OnboardingFlow = {
  id: 'quick-start',
  name: 'Quick Start',
  description: 'Jump straight into collecting',
  currentStepIndex: 0,
  isCompleted: false,
  canRestart: true,
  steps: [
    {
      id: 'quick-welcome',
      title: 'Welcome',
      description: 'Ready to start collecting?',
      component: <WelcomeStep />,
      isRequired: false,
      isCompleted: false,
      canSkip: false,
      nextStep: 'quick-first-comic'
    },
    {
      id: 'quick-first-comic',
      title: 'Add a Comic',
      description: 'Add your first comic to get started',
      component: <FirstComicStep />,
      isRequired: true,
      isCompleted: false,
      canSkip: false,
      nextStep: 'quick-completion',
      prevStep: 'quick-welcome'
    },
    {
      id: 'quick-completion',
      title: 'Ready to Go',
      description: 'Start exploring your collection',
      component: <CompletionStep />,
      isRequired: true,
      isCompleted: false,
      canSkip: false,
      prevStep: 'quick-first-comic'
    }
  ],
  metadata: {
    onComplete: () => {
      console.log('Quick start flow completed')
    },
    estimatedTime: '1 minute',
    category: 'quick-start'
  }
}

// Feature-specific flows for existing users
export const collectionManagementFlow: OnboardingFlow = {
  id: 'collection-management',
  name: 'Collection Management',
  description: 'Learn to organize and track your comics',
  currentStepIndex: 0,
  isCompleted: false,
  canRestart: true,
  steps: [
    {
      id: 'collection-intro',
      title: 'Collection Features',
      description: 'Discover powerful collection management tools',
      component: <FeatureTourStep />,
      isRequired: false,
      isCompleted: false,
      canSkip: true,
      nextStep: 'collection-setup'
    },
    {
      id: 'collection-setup',
      title: 'Organize Your Collection',
      description: 'Set up categories and preferences',
      component: <ProfileSetupStep />,
      isRequired: false,
      isCompleted: false,
      canSkip: true,
      nextStep: 'collection-completion',
      prevStep: 'collection-intro'
    },
    {
      id: 'collection-completion',
      title: 'Collection Ready',
      description: 'Your collection management is set up',
      component: <CompletionStep />,
      isRequired: true,
      isCompleted: false,
      canSkip: false,
      prevStep: 'collection-setup'
    }
  ],
  metadata: {
    onComplete: () => {
      console.log('Collection management flow completed')
    },
    estimatedTime: '2-3 minutes',
    category: 'feature-introduction',
    prerequisites: ['new-user-onboarding']
  }
}