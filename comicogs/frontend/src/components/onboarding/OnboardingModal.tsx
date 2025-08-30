'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useOnboarding } from './OnboardingProvider'
import { ArrowLeft, ArrowRight, X, SkipForward, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingModalProps {
  showCloseButton?: boolean
  showSkipButton?: boolean
  showProgress?: boolean
  className?: string
}

export function OnboardingModal({
  showCloseButton = true,
  showSkipButton = true,
  showProgress = true,
  className
}: OnboardingModalProps) {
  const {
    currentFlow,
    isOnboarding,
    nextStep,
    prevStep,
    skipStep,
    dismissFlow,
    getFlowProgress
  } = useOnboarding()

  if (!isOnboarding || !currentFlow) return null

  const currentStep = currentFlow.steps[currentFlow.currentStepIndex]
  const progress = getFlowProgress(currentFlow.id)
  
  const isFirstStep = currentFlow.currentStepIndex === 0
  const isLastStep = currentFlow.currentStepIndex === currentFlow.steps.length - 1

  return (
    <Dialog open={isOnboarding}>
      <DialogContent 
        className={cn(
          "max-w-2xl max-h-[90vh] overflow-auto",
          className
        )}
        onPointerDownOutside={(e: Event) => e.preventDefault()}
        onEscapeKeyDown={(e: KeyboardEvent) => e.preventDefault()}
      >
        <DialogHeader>
          {/* Flow header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl">{currentFlow.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {currentFlow.description}
              </p>
            </div>
            
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissFlow(currentFlow.id)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress indicator */}
          {showProgress && (
            <div className="space-y-2 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Step {currentFlow.currentStepIndex + 1} of {currentFlow.steps.length}
                </span>
                <Badge variant="secondary">
                  {progress.percentage}% Complete
                </Badge>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>
          )}

          {/* Step indicators */}
          <div className="flex items-center gap-2 pt-2">
            {currentFlow.steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentFlow.currentStepIndex
                    ? "bg-primary"
                    : step.isCompleted
                    ? "bg-green-500"
                    : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </DialogHeader>

        {/* Step content */}
        <div className="py-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{currentStep.title}</h3>
                {currentStep.isCompleted && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {currentStep.isRequired && (
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {currentStep.description}
              </p>
            </div>

            {/* Step component */}
            <div className="min-h-[200px]">
              {currentStep.component}
            </div>
          </div>
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {showSkipButton && currentStep.canSkip && !isLastStep && (
              <Button
                variant="ghost"
                onClick={skipStep}
                className="flex items-center gap-2"
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
            )}

            <Button
              onClick={nextStep}
              className="flex items-center gap-2"
            >
              {isLastStep ? (
                <>
                  Complete
                  <CheckCircle className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Alternative compact modal for quick onboarding
export function OnboardingModalCompact() {
  const {
    currentFlow,
    isOnboarding,
    nextStep,
    dismissFlow,
    getFlowProgress
  } = useOnboarding()

  if (!isOnboarding || !currentFlow) return null

  const currentStep = currentFlow.steps[currentFlow.currentStepIndex]
  const progress = getFlowProgress(currentFlow.id)
  const isLastStep = currentFlow.currentStepIndex === currentFlow.steps.length - 1

  return (
    <Dialog open={isOnboarding}>
      <DialogContent className="max-w-md">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{currentStep.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissFlow(currentFlow.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              {progress.current} of {progress.total} steps
            </div>
            <Progress value={progress.percentage} className="h-1" />
          </div>

          {/* Content */}
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-3">
              {currentStep.description}
            </p>
            {currentStep.component}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => dismissFlow(currentFlow.id)}
            >
              Skip Tour
            </Button>
            <Button onClick={nextStep}>
              {isLastStep ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}