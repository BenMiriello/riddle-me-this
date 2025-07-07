import { Workflow } from './Workflow'
import { isReservedKeyword } from './utils'

// Stage interface with known input/output
export interface Stage<TInput, TOutput> {
  (input: TInput): TOutput | Promise<TOutput>
}

// Pipeline-specific conflicts that would break our context object
type PipelineConflicts = 'last' | 'result'

// For TypeScript compile-time checking, we use a minimal set
// Runtime validation uses the dynamic function above
type ReservedWords = keyof typeof Object.prototype | PipelineConflicts

// Validate step name isn't reserved (compile-time check)
type ValidStepName<T extends string> = T extends ReservedWords ? never : T

// Runtime validation for step names
function validateStepName(name: string): void {
  if (isReservedKeyword(name)) {
    throw new Error(`Step name '${name}' is a reserved JavaScript keyword`)
  }
  if (name === 'last' || name === 'result') {
    throw new Error(
      `Step name '${name}' conflicts with pipeline context properties`
    )
  }
}

// Extract step names from registry
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StepNames<T extends Record<string, any>> = keyof T & string

// Build pipeline context from step registry
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PipelineContext<TSteps extends Record<string, any>> = {
  [K in keyof TSteps]: { result: TSteps[K] }
} & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  last: { result: any }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface StepOptions<TSteps extends Record<string, any>> {
  when?: string | ((pl: PipelineContext<TSteps>) => boolean)
  after?: readonly string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  merge?: (pl: PipelineContext<TSteps>) => Record<string, any>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BranchStage<
  TInput,
  TOutput,
  TSteps extends Record<string, any>,
> {
  stage: Stage<TInput, TOutput>
  when?: (pl: PipelineContext<TSteps>) => boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BranchOptions<TSteps extends Record<string, any>> {
  after?: readonly string[]
  split?: (pl: PipelineContext<TSteps>) => string
}

export interface Step {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stage?: any
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  mergerFn?: Function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
export class PipelineBuilder<TSteps extends Record<string, any> = {}> {
  private steps: Map<string, Step> = new Map()
  private dependencies: Map<string, string[]> = new Map()

  step<TName extends string, TInput, TOutput>(
    name: ValidStepName<TName> extends never
      ? never
      : TName extends StepNames<TSteps>
        ? never // Prevent duplicate names
        : TName,
    stage: Stage<TInput, TOutput>,
    options?: StepOptions<TSteps>
  ): PipelineBuilder<TSteps & Record<TName, TOutput>> {
    // Runtime validation
    validateStepName(name as string)
    if (this.steps.has(name as string)) {
      throw new Error(`Step name '${name}' is already used`)
    }

    if (options?.merge && !options?.after) {
      throw new Error(
        `Step '${name}' has merge function but no 'after' dependencies`
      )
    }

    this.steps.set(name as string, { stage, options })

    if (options?.after) {
      this.dependencies.set(name as string, options.after as string[])
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this as any
  }

  branch<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TBranches extends Record<
      string,
      Stage<any, any> | BranchStage<any, any, TSteps>
    >,
  >(
    stages: {
      [K in keyof TBranches]: K extends StepNames<TSteps>
        ? never // Prevent duplicate names
        : TBranches[K]
    },
    options?: BranchOptions<TSteps>
  ): PipelineBuilder<
    TSteps & {
      [K in keyof TBranches]: TBranches[K] extends Stage<any, infer TOutput>
        ? TOutput
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          TBranches[K] extends BranchStage<any, infer TOutput, any>
          ? TOutput
          : never
    }
  > {
    Object.entries(stages).forEach(([stepName, stageConfig]) => {
      if (this.steps.has(stepName)) {
        throw new Error(`Step name '${stepName}' is already used`)
      }

      if (
        typeof stageConfig === 'object' &&
        stageConfig !== null &&
        'stage' in stageConfig
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { stage, when } = stageConfig as BranchStage<any, any, TSteps>
        this.steps.set(stepName, {
          stage,
          options: { when, after: options?.after },
        })
      } else {
        this.steps.set(stepName, {
          stage: stageConfig,
          options,
        })
      }

      if (options?.after) {
        this.dependencies.set(stepName, options.after as string[])
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this as any
  }

  merge<TName extends string, TOutput>(
    name: ValidStepName<TName> extends never
      ? never
      : TName extends StepNames<TSteps>
        ? never
        : TName,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mergerFn: (input: any) => TOutput,
    options: { after: readonly string[] }
  ): PipelineBuilder<TSteps & Record<TName, TOutput>> {
    if (this.steps.has(name as string)) {
      throw new Error(`Step name '${name}' is already used`)
    }

    this.steps.set(name as string, { mergerFn, options })
    this.dependencies.set(name as string, options.after as string[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this as any
  }

  build(): Workflow {
    // Validate no circular dependencies
    this.validateNoCycles()

    return new Workflow(this.steps, this.dependencies)
  }

  private validateNoCycles(): void {
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (stepName: string) => {
      if (visiting.has(stepName)) {
        throw new Error(
          `Circular dependency detected involving step: ${stepName}`
        )
      }
      if (visited.has(stepName)) return

      visiting.add(stepName)
      const deps = this.dependencies.get(stepName) || []
      for (const dep of deps) {
        if (!this.steps.has(dep)) {
          throw new Error(
            `Step '${stepName}' depends on non-existent step '${dep}'`
          )
        }
        visit(dep)
      }
      visiting.delete(stepName)
      visited.add(stepName)
    }

    for (const stepName of this.steps.keys()) {
      if (!visited.has(stepName)) {
        visit(stepName)
      }
    }
  }
}

export function pipeline(): PipelineBuilder {
  return new PipelineBuilder()
}
