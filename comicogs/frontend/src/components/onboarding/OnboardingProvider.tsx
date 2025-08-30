'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  component: ReactNode
  isRequired: boolean
  isCompleted: boolean
  canSkip: boolean
  nextStep?: string
  prevStep?: string
  validationFn?: () => boolean | Promise<boolean>
  completionFn?: () => void | Promise<void>
}

export interface OnboardingFlow {
  id: string
  name: string
  description: string
  steps: OnboardingStep[]
  currentStepIndex: number
  isCompleted: boolean
  canRestart: boolean
  metadata?: Record<string, any>
}

interface OnboardingContextValue {
  // Current flow state
  currentFlow: OnboardingFlow | null
  flows: OnboardingFlow[]
  
  // Flow management
  startFlow: (flowId: string, startFromStep?: string) => void
  completeFlow: (flowId: string) => void
  resetFlow: (flowId: string) => void
  dismissFlow: (flowId: string) => void
  
  // Step navigation
  goToStep: (stepId: string) => void
  nextStep: () => void
  prevStep: () => void
  skipStep: () => void
  completeStep: (stepId: string) => void
  
  // State checks
  isOnboarding: boolean
  shouldShowOnboarding: (flowId: string) => boolean
  getFlowProgress: (flowId: string) => { current: number; total: number; percentage: number }
  
  // User preferences
  updateUserPreferences: (preferences: Record<string, any>) => void
  getUserPreferences: () => Record<string, any>
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

interface OnboardingProviderProps {
  children: ReactNode
  flows: OnboardingFlow[]
  autoStart?: boolean
  persistProgress?: boolean
  userId?: string
}

export function OnboardingProvider({
  children,
  flows: initialFlows,
  autoStart = true,
  persistProgress = true,
  userId
}: OnboardingProviderProps) {
  const router = useRouter()
  const [flows, setFlows] = useState<OnboardingFlow[]>(initialFlows)
  const [currentFlow, setCurrentFlow] = useState<OnboardingFlow | null>(null)
  const [userPreferences, setUserPreferences] = useState<Record<string, any>>({})

  const storageKey = `onboarding-${userId || 'anonymous'}`

  // Load persisted state on mount
  useEffect(() => {
    if (persistProgress) {
      loadPersistedState()
    }
    
    // Auto-start first incomplete flow if enabled
    if (autoStart) {
      const incompleteFlow = flows.find(flow => !flow.isCompleted)
      if (incompleteFlow) {
        startFlow(incompleteFlow.id)
      }
    }
  }, [])

  // Save state when it changes
  useEffect(() => {
    if (persistProgress && flows.length > 0) {
      savePersistedState()
    }
  }, [flows, currentFlow, userPreferences])

  const loadPersistedState = () => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const { flows: savedFlows, userPreferences: savedPrefs } = JSON.parse(saved)
        if (savedFlows) {
          setFlows(savedFlows)
        }
        if (savedPrefs) {
          setUserPreferences(savedPrefs)
        }
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error)
    }
  }

  const savePersistedState = () => {
    try {
      const state = {
        flows,
        userPreferences,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save onboarding state:', error)
    }
  }

  const startFlow = (flowId: string, startFromStep?: string) => {
    const flow = flows.find(f => f.id === flowId)
    if (!flow) return

    let stepIndex = 0
    if (startFromStep) {
      stepIndex = flow.steps.findIndex(s => s.id === startFromStep)
      if (stepIndex === -1) stepIndex = 0
    }

    const updatedFlow = {
      ...flow,
      currentStepIndex: stepIndex
    }

    setCurrentFlow(updatedFlow)
    setFlows(prev => prev.map(f => f.id === flowId ? updatedFlow : f))
  }

  const completeFlow = (flowId: string) => {
    const updatedFlows = flows.map(f => 
      f.id === flowId 
        ? { ...f, isCompleted: true, currentStepIndex: f.steps.length - 1 }
        : f
    )
    
    setFlows(updatedFlows)
    setCurrentFlow(null)

    // Trigger completion callback if exists
    const flow = flows.find(f => f.id === flowId)
    if (flow?.metadata?.onComplete) {
      flow.metadata.onComplete()
    }
  }

  const resetFlow = (flowId: string) => {
    const flow = flows.find(f => f.id === flowId)
    if (!flow) return

    const resetFlow = {
      ...flow,
      currentStepIndex: 0,
      isCompleted: false,
      steps: flow.steps.map(step => ({ ...step, isCompleted: false }))
    }

    setFlows(prev => prev.map(f => f.id === flowId ? resetFlow : f))
    
    if (currentFlow?.id === flowId) {
      setCurrentFlow(resetFlow)
    }
  }

  const dismissFlow = (flowId: string) => {
    setFlows(prev => prev.map(f => 
      f.id === flowId ? { ...f, isCompleted: true } : f
    ))
    
    if (currentFlow?.id === flowId) {
      setCurrentFlow(null)
    }
  }

  const goToStep = (stepId: string) => {
    if (!currentFlow) return

    const stepIndex = currentFlow.steps.findIndex(s => s.id === stepId)
    if (stepIndex === -1) return

    const updatedFlow = { ...currentFlow, currentStepIndex: stepIndex }
    setCurrentFlow(updatedFlow)
    setFlows(prev => prev.map(f => f.id === currentFlow.id ? updatedFlow : f))
  }

  const nextStep = async () => {
    if (!currentFlow) return

    const currentStep = currentFlow.steps[currentFlow.currentStepIndex]
    
    // Validate current step if validation function exists
    if (currentStep.validationFn) {
      const isValid = await currentStep.validationFn()
      if (!isValid) return
    }

    // Complete current step
    if (currentStep.completionFn) {
      await currentStep.completionFn()
    }

    // Mark step as completed
    completeStep(currentStep.id)

    // Move to next step or complete flow
    if (currentFlow.currentStepIndex >= currentFlow.steps.length - 1) {
      completeFlow(currentFlow.id)
    } else {
      const nextStepIndex = currentFlow.currentStepIndex + 1
      const updatedFlow = { ...currentFlow, currentStepIndex: nextStepIndex }
      setCurrentFlow(updatedFlow)
      setFlows(prev => prev.map(f => f.id === currentFlow.id ? updatedFlow : f))
    }
  }

  const prevStep = () => {
    if (!currentFlow || currentFlow.currentStepIndex <= 0) return

    const updatedFlow = { 
      ...currentFlow, 
      currentStepIndex: currentFlow.currentStepIndex - 1 
    }
    setCurrentFlow(updatedFlow)
    setFlows(prev => prev.map(f => f.id === currentFlow.id ? updatedFlow : f))
  }

  const skipStep = () => {
    if (!currentFlow) return

    const currentStep = currentFlow.steps[currentFlow.currentStepIndex]
    if (!currentStep.canSkip) return

    nextStep()
  }

  const completeStep = (stepId: string) => {
    if (!currentFlow) return

    const updatedSteps = currentFlow.steps.map(step =>
      step.id === stepId ? { ...step, isCompleted: true } : step
    )

    const updatedFlow = { ...currentFlow, steps: updatedSteps }
    setCurrentFlow(updatedFlow)
    setFlows(prev => prev.map(f => f.id === currentFlow.id ? updatedFlow : f))
  }

  const shouldShowOnboarding = (flowId: string) => {
    const flow = flows.find(f => f.id === flowId)
    return flow ? !flow.isCompleted : false
  }

  const getFlowProgress = (flowId: string) => {
    const flow = flows.find(f => f.id === flowId)
    if (!flow) return { current: 0, total: 0, percentage: 0 }

    const completedSteps = flow.steps.filter(s => s.isCompleted).length
    const totalSteps = flow.steps.length
    const percentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

    return {
      current: completedSteps,
      total: totalSteps,
      percentage: Math.round(percentage)
    }
  }

  const updateUserPreferences = (preferences: Record<string, any>) => {
    setUserPreferences(prev => ({ ...prev, ...preferences }))
  }

  const getUserPreferences = () => userPreferences

  const contextValue: OnboardingContextValue = {
    currentFlow,
    flows,
    startFlow,
    completeFlow,
    resetFlow,
    dismissFlow,
    goToStep,
    nextStep,
    prevStep,
    skipStep,
    completeStep,
    isOnboarding: currentFlow !== null,
    shouldShowOnboarding,
    getFlowProgress,
    updateUserPreferences,
    getUserPreferences
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}