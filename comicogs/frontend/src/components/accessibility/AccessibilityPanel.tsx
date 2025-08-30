'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Eye, 
  EyeOff, 
  Play, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Info,
  Bug,
  Zap
} from 'lucide-react'
import { accessibilityChecker, AccessibilityReport } from '@/lib/accessibility/AccessibilityChecker'
import { AccessibilityTestResult } from '@/lib/accessibility/axe-config'
import { cn } from '@/lib/utils'

interface AccessibilityPanelProps {
  showInProduction?: boolean
  autoStart?: boolean
  className?: string
}

export function AccessibilityPanel({
  showInProduction = false,
  autoStart = true,
  className
}: AccessibilityPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<AccessibilityTestResult[]>([])
  const [currentTest, setCurrentTest] = useState<string>('')
  const [report, setReport] = useState<AccessibilityReport | null>(null)

  // Only show in development or when explicitly enabled
  const shouldShow = process.env.NODE_ENV === 'development' || showInProduction

  useEffect(() => {
    if (!shouldShow) return

    // Check if accessibility testing is enabled
    const enabled = localStorage.getItem('accessibility-testing') === 'enabled'
    setIsEnabled(enabled)

    // Subscribe to results updates
    const unsubscribe = accessibilityChecker.subscribe((updatedResults) => {
      setResults(updatedResults)
      if (updatedResults.length > 0) {
        setReport(accessibilityChecker.generateReport())
      }
    })

    // Auto-start if enabled
    if (enabled && autoStart) {
      runFullAudit()
    }

    return unsubscribe
  }, [shouldShow, autoStart])

  const toggleEnabled = () => {
    const newEnabled = !isEnabled
    setIsEnabled(newEnabled)
    accessibilityChecker.setEnabled(newEnabled)
    
    if (!newEnabled) {
      accessibilityChecker.clearResults()
      setResults([])
      setReport(null)
    }
  }

  const runFullAudit = async () => {
    setIsRunning(true)
    
    const contexts = ['homepage', 'collection', 'search', 'marketplace', 'forms', 'navigation'] as const
    
    for (const context of contexts) {
      setCurrentTest(context)
      await accessibilityChecker.auditPage(context)
      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setCurrentTest('')
    setIsRunning(false)
  }

  const runSingleTest = async (context: string) => {
    setIsRunning(true)
    setCurrentTest(context)
    await accessibilityChecker.auditPage(context as any)
    setCurrentTest('')
    setIsRunning(false)
  }

  const clearResults = () => {
    accessibilityChecker.clearResults()
    setResults([])
    setReport(null)
  }

  const exportResults = () => {
    const data = accessibilityChecker.exportResults()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'serious':
        return <Bug className="h-4 w-4 text-orange-600" />
      case 'moderate':
        return <Info className="h-4 w-4 text-yellow-600" />
      case 'minor':
        return <Zap className="h-4 w-4 text-blue-600" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  if (!shouldShow) return null

  return (
    <>
      {/* Floating toggle button */}
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          onClick={() => setIsVisible(!isVisible)}
          variant={isEnabled ? "default" : "outline"}
          size="sm"
          className="relative shadow-lg"
        >
          {isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {results.length > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {report?.summary.totalViolations || 0}
            </Badge>
          )}
        </Button>
      </div>

      {/* Accessibility panel */}
      {isVisible && (
        <div className={cn("fixed bottom-32 right-4 w-96 max-h-[600px] z-50", className)}>
          <Card className="border-2 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Accessibility Audit</CardTitle>
                  <CardDescription>
                    Automated accessibility testing with axe-core
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsVisible(false)}
                  variant="ghost"
                  size="sm"
                >
                  ×
                </Button>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={toggleEnabled}
                  variant={isEnabled ? "default" : "outline"}
                  size="sm"
                >
                  {isEnabled ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </Button>
                
                {isEnabled && (
                  <Button
                    onClick={runFullAudit}
                    disabled={isRunning}
                    size="sm"
                    variant="outline"
                  >
                    {isRunning ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {isRunning ? 'Running...' : 'Run Audit'}
                  </Button>
                )}
              </div>

              {/* Running indicator */}
              {isRunning && currentTest && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Testing: {currentTest}
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-0">
              {!isEnabled ? (
                <div className="text-center py-6 text-muted-foreground">
                  <EyeOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Enable accessibility testing to start auditing</p>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No results yet. Run an audit to get started.</p>
                </div>
              ) : (
                <Tabs defaultValue="summary">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="space-y-4">
                    {report && (
                      <>
                        {/* Overall score */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Overall Score</span>
                            <span className={cn("text-lg font-bold", getScoreColor(report.summary.averageScore))}>
                              {report.summary.averageScore}%
                            </span>
                          </div>
                          <Progress value={report.summary.averageScore} className="h-2" />
                        </div>

                        {/* Violations summary */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {report.summary.criticalIssues}
                            </div>
                            <div className="text-xs text-muted-foreground">Critical</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {report.summary.seriousIssues}
                            </div>
                            <div className="text-xs text-muted-foreground">Serious</div>
                          </div>
                        </div>

                        {/* Recommendations */}
                        {report.recommendations.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Recommendations</h4>
                            <ScrollArea className="h-32">
                              <div className="space-y-1">
                                {report.recommendations.map((rec, index) => (
                                  <div key={index} className="text-xs p-2 bg-muted rounded text-muted-foreground">
                                    {rec}
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="results" className="space-y-3">
                    <ScrollArea className="h-80">
                      <div className="space-y-2">
                        {results.map((result) => (
                          <Card key={result.context} className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm capitalize">
                                {result.context}
                              </span>
                              <Badge
                                variant={result.score >= 90 ? "default" : result.score >= 70 ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                {result.score}%
                              </Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div>
                                <div className="text-sm font-medium text-red-600">
                                  {result.violations.critical}
                                </div>
                                <div className="text-xs text-muted-foreground">Critical</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-orange-600">
                                  {result.violations.serious}
                                </div>
                                <div className="text-xs text-muted-foreground">Serious</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-yellow-600">
                                  {result.violations.moderate}
                                </div>
                                <div className="text-xs text-muted-foreground">Moderate</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-green-600">
                                  {result.passes}
                                </div>
                                <div className="text-xs text-muted-foreground">Passes</div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-3">
                    <ScrollArea className="h-80">
                      <div className="space-y-2">
                        {results.flatMap(result => result.details).slice(0, 10).map((violation, index) => (
                          <Card key={index} className="p-3">
                            <div className="flex items-start gap-2 mb-2">
                              {getSeverityIcon(violation.impact)}
                              <div className="flex-1">
                                <h5 className="font-medium text-sm">{violation.description}</h5>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {violation.help}
                                </p>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Affected elements: {violation.nodes.length}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              )}

              {/* Actions */}
              {results.length > 0 && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={exportResults}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Button
                    onClick={clearResults}
                    size="sm"
                    variant="outline"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}