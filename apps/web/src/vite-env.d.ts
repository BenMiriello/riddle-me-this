/// <reference types="vite/client" />

declare const __GIT_SHA__: string

declare module '../../../package.json' {
  interface PackageJson {
    name: string
    version?: string
    private?: boolean
    type?: string
    workspaces?: string[]
    scripts?: Record<string, string>
    devDependencies?: Record<string, string>
    [key: string]: any
  }
  const packageJson: PackageJson
  export = packageJson
}
