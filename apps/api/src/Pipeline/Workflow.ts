import { PipelineContext, Step, YieldStep, YieldResponse } from './Builder'

// Session state interface (moved from SessionWorkflow)
export interface SessionState {
  sessionId: string
  currentStep: string
  context: Partial<PipelineContext<any>>
  results: Map<string, unknown>
  executed: Set<string>
  initialInput: any
  cancelled: boolean
  completed: boolean
  executionOrder: string[]
  yieldResponses: Map<string, YieldResponse<any>>
}

export interface SessionExecutionResult {
  sessionId: string
  data: any
  nextStep?: string
  canContinue: boolean
  progress: string
  completed: boolean
  actionWord?: string
  completedAction?: string
  isFirstResponse: boolean
  cancelled?: boolean
}

export class Workflow {
  private sessions: Map<string, SessionState> = new Map()

  constructor(
    private steps: Map<string, Step>,
    private dependencies: Map<string, string[]>,
    private yields: Map<string, YieldStep> = new Map(),
    private yieldOrder: string[] = []
  ) {}

  // Simple execution mode (v1/v2) - runs all steps and returns final result
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(initialInput: any): Promise<any> {
    const executionOrder = this.topologicalSort()
    const executionState = this.createExecutionState(initialInput, executionOrder)
    
    // Run all steps to completion
    await this.executeSteps(executionState, 'complete')
    
    return this.buildResponseData(executionState)
  }

  // Yielding execution mode (v3) - start session and run until first yield
  async start(initialInput: any, sessionId: string): Promise<SessionExecutionResult> {
    const executionOrder = this.topologicalSort()
    
    const sessionState: SessionState = {
      sessionId,
      currentStep: executionOrder[0],
      context: { last: { result: initialInput } },
      results: new Map(),
      executed: new Set(),
      initialInput,
      cancelled: false,
      completed: false,
      executionOrder,
      yieldResponses: new Map()
    }

    this.sessions.set(sessionId, sessionState)
    return await this.executeUntilYield(sessionState, true)
  }

  // Continue yielding execution from where we left off
  async continue(sessionId: string, expectedStep?: string): Promise<SessionExecutionResult> {
    const sessionState = this.sessions.get(sessionId)
    if (!sessionState) {
      throw new Error(`Session ${sessionId} not found`)
    }

    if (sessionState.cancelled) {
      return this.buildSessionResult(sessionState, false, 'Cancelled', true)
    }

    if (sessionState.completed) {
      return this.buildSessionResult(sessionState, false, 'Complete')
    }

    // Validate expected step if provided
    if (expectedStep && sessionState.currentStep !== expectedStep) {
      throw new Error(`Expected step '${expectedStep}' but session is at '${sessionState.currentStep}'`)
    }

    return await this.executeUntilYield(sessionState, false)
  }

  // Cancel a session
  cancel(sessionId: string): void {
    const sessionState = this.sessions.get(sessionId)
    if (sessionState) {
      sessionState.cancelled = true
    }
  }

  // Get session status
  getStatus(sessionId: string): SessionExecutionResult | null {
    const sessionState = this.sessions.get(sessionId)
    if (!sessionState) {
      return null
    }

    return this.buildSessionResult(sessionState, false, this.calculateProgress(sessionState))
  }

  // SHARED CORE EXECUTION ENGINE - 95% of logic is identical for both modes
  private async executeSteps(state: any, mode: 'complete' | 'yielding', startIndex = 0): Promise<void> {
    const { executionOrder, context, results, executed, initialInput } = state
    
    for (let i = startIndex; i < executionOrder.length; i++) {
      const stepName = executionOrder[i]
      
      // Skip already executed steps
      if (executed.has(stepName)) {
        continue
      }

      const step = this.steps.get(stepName)!

      // Check if step should be executed based on 'when' condition
      if (step.options?.when) {
        const shouldExecute = typeof step.options.when === 'string'
          ? this.evaluateStringCondition(step.options.when, context)
          : step.options.when(context as PipelineContext<any>)

        if (!shouldExecute) {
          continue
        }
      }

      // Prepare step input
      let stepInput: any = { ...initialInput }
      for (const [, resultValue] of results.entries()) {
        if (resultValue && typeof resultValue === 'object') {
          stepInput = { ...stepInput, ...resultValue }
        }
      }

      // Handle merge function if present
      if (step.options?.merge) {
        const mergeResult = step.options.merge(context as PipelineContext<any>)
        if (mergeResult && typeof mergeResult === 'object') {
          stepInput = { ...stepInput, ...mergeResult }
        }
      }

      // Execute step
      let result: unknown
      if (step.stage) {
        result = await step.stage(stepInput)
      } else if (step.mergerFn) {
        result = step.mergerFn(stepInput)
      }

      // Store result and update context
      results.set(stepName, result)
      ;(context as any)[stepName] = { result }
      context.last = { result }
      executed.add(stepName)

      // ONLY difference: Check for yield points in yielding mode
      if (mode === 'yielding') {
        const nextYieldPoint = this.findNextYieldPoint(stepName)
        if (nextYieldPoint) {
          // Store current position and yield
          state.currentStep = this.findNextStep(executionOrder, i) || ''
          return // Stop execution here, let executeUntilYield handle the yield response
        }
      }
    }

    // Mark as completed if we reach the end
    if (mode === 'yielding') {
      state.completed = true
      state.currentStep = ''
    }
  }

  // Yielding-specific execution wrapper
  private async executeUntilYield(sessionState: SessionState, isFirstResponse: boolean): Promise<SessionExecutionResult> {
    const startIndex = sessionState.executionOrder.indexOf(sessionState.currentStep)
    const actualStartIndex = startIndex === -1 ? 0 : startIndex
    
    await this.executeSteps(sessionState, 'yielding', actualStartIndex)
    
    // Check if we stopped at a yield point
    const lastExecutedStep = Array.from(sessionState.executed).pop()
    if (lastExecutedStep) {
      const yieldPoint = this.findNextYieldPoint(lastExecutedStep)
      if (yieldPoint) {
        const yieldStep = this.yields.get(yieldPoint)!
        const yieldResponse = yieldStep.yieldFn(this.buildResponseData(sessionState))
        
        sessionState.yieldResponses.set(yieldPoint, yieldResponse)
        sessionState.currentStep = yieldResponse.nextStep || sessionState.currentStep

        return {
          sessionId: sessionState.sessionId,
          data: this.buildResponseData(sessionState),
          nextStep: yieldResponse.nextStep,
          canContinue: !!yieldResponse.nextStep && !sessionState.completed,
          progress: this.calculateProgress(sessionState),
          completed: sessionState.completed,
          actionWord: yieldResponse.actionWord,
          completedAction: yieldResponse.completedAction,
          isFirstResponse
        }
      }
    }
    
    // No yield point found, workflow is complete
    return this.buildSessionResult(sessionState, isFirstResponse, 'Complete')
  }

  // Helper methods
  private createExecutionState(initialInput: any, executionOrder: string[]) {
    return {
      context: { last: { result: initialInput } },
      results: new Map<string, unknown>(),
      executed: new Set<string>(),
      initialInput,
      executionOrder
    }
  }

  private buildResponseData(state: any): any {
    const structuredResponse: Record<string, unknown> = {}
    structuredResponse.webRequest = state.initialInput
    for (const [stepName, stepResult] of state.results.entries()) {
      structuredResponse[stepName] = stepResult
    }
    return structuredResponse
  }

  private buildSessionResult(sessionState: SessionState, isFirstResponse: boolean, progress: string, cancelled = false): SessionExecutionResult {
    return {
      sessionId: sessionState.sessionId,
      data: this.buildResponseData(sessionState),
      nextStep: sessionState.currentStep,
      canContinue: !sessionState.completed && !sessionState.cancelled,
      progress,
      completed: sessionState.completed,
      cancelled,
      isFirstResponse
    }
  }

  private findNextYieldPoint(afterStep: string): string | null {
    for (const [yieldName, yieldStep] of this.yields.entries()) {
      if (yieldStep.options?.after?.includes(afterStep)) {
        return yieldName
      }
    }
    return null
  }

  private findNextStep(executionOrder: string[], currentIndex: number): string | undefined {
    return executionOrder[currentIndex + 1]
  }

  private calculateProgress(sessionState: SessionState): string {
    const totalSteps = sessionState.executionOrder.length
    const completedSteps = sessionState.executed.size
    return `${completedSteps}/${totalSteps} steps complete`
  }

  // Cleanup old sessions (call periodically)
  cleanup(): void {
    for (const [sessionId, sessionState] of this.sessions.entries()) {
      if (sessionState.completed || sessionState.cancelled) {
        this.sessions.delete(sessionId)
      }
    }
  }

  private evaluateStringCondition(
    condition: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: Partial<PipelineContext<any>>
  ): boolean {
    // Handle string conditions like 'detect.isRiddle'
    const [stepName, property] = condition.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!(context as any)[stepName]?.result?.[property]
  }

  private topologicalSort(): string[] {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const result: string[] = []

    const visit = (stepName: string) => {
      if (visiting.has(stepName)) {
        throw new Error(
          `Circular dependency detected involving step: ${stepName}`
        )
      }
      if (visited.has(stepName)) {
        return
      }

      visiting.add(stepName)
      const deps = this.dependencies.get(stepName) || []
      for (const dep of deps) {
        visit(dep)
      }
      visiting.delete(stepName)
      visited.add(stepName)
      result.push(stepName)
    }

    for (const stepName of this.steps.keys()) {
      if (!visited.has(stepName)) {
        visit(stepName)
      }
    }

    return result
  }
}
