// Main onboarding components
export { OnboardingProvider, useOnboarding } from './OnboardingProvider'
export { OnboardingModal, OnboardingModalCompact } from './OnboardingModal'

// Onboarding steps
export { WelcomeStep } from './steps/WelcomeStep'
export { ProfileSetupStep } from './steps/ProfileSetupStep'
export { FeatureTourStep } from './steps/FeatureTourStep'
export { FirstComicStep } from './steps/FirstComicStep'
export { CompletionStep } from './steps/CompletionStep'

// Predefined flows
export { 
  newUserOnboardingFlow, 
  quickStartFlow, 
  collectionManagementFlow 
} from './flows/newUserFlow'

// Types
export type { OnboardingStep, OnboardingFlow } from './OnboardingProvider'