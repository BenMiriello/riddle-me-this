import { PipelineContext, Step } from './Builder'

export class Workflow {
  constructor(
    private steps: Map<string, Step>,
    private dependencies: Map<string, string[]>
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(initialInput: any): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context: Partial<PipelineContext<any>> = {
      last: { result: initialInput },
    }
    const executed = new Set<string>()
    const results = new Map<string, unknown>()

    // Topological sort to determine execution order
    const executionOrder = this.topologicalSort()

    for (const stepName of executionOrder) {
      const step = this.steps.get(stepName)!

      // Check if step should be executed based on 'when' condition
      if (step.options?.when) {
        const shouldExecute =
          typeof step.options.when === 'string'
            ? this.evaluateStringCondition(step.options.when, context)
            : // eslint-disable-next-line @typescript-eslint/no-explicit-any
              step.options.when(context as PipelineContext<any>)

        if (!shouldExecute) {
          continue
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let stepInput: any = {}

      // Combine outputs from dependencies + merge function
      if (step.options?.merge && step.options?.after) {
        // Collect outputs from dependency steps
        for (const depName of step.options.after) {
          const depResult = results.get(depName)
          if (depResult) {
            stepInput = { ...stepInput, ...depResult }
          }
        }

        // Apply merge function and add its output
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mergeResult = step.options.merge(context as PipelineContext<any>)
        stepInput = { ...stepInput, ...mergeResult }
      } else if (step.options?.after) {
        // Regular dependency handling
        for (const depName of step.options.after) {
          const depResult = results.get(depName)
          if (depResult) {
            stepInput = { ...stepInput, ...depResult }
          }
        }
      } else {
        // Use initial input for first step
        stepInput = initialInput
      }

      // Execute step
      let result: unknown
      if (step.stage) {
        result = await step.stage(stepInput)
      } else if (step.mergerFn) {
        // Handle standalone merge steps
        result = step.mergerFn(stepInput)
      }

      // Store result and update context
      results.set(stepName, result)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(context as any)[stepName] = { result }
      context.last = { result }
      executed.add(stepName)
    }

    const finalSteps = executionOrder.filter((name) => {
      return !Array.from(this.steps.keys()).some((otherStep) =>
        this.dependencies.get(otherStep)?.includes(name)
      )
    })

    return results.get(finalSteps[finalSteps.length - 1])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private evaluateStringCondition(
    condition: string,
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
