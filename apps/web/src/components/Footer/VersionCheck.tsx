import { useState, useEffect } from 'react'
import packageJson from '../../../../../package.json'

interface ApiHealth {
  status: string
  version: string
  gitSha: string
  buildTime: string
  environment: string
}

const VersionCheck = () => {
  const [apiVersion, setApiVersion] = useState<string>('')
  const [apiSha, setApiSha] = useState<string>('')
  const [apiEnvironment, setApiEnvironment] = useState<string>('')
  const [showMismatch, setShowMismatch] = useState(false)
  const webVersion = (packageJson as { version?: string }).version || 'dev'
  const webSha = __GIT_SHA__.substring(0, 7)

  useEffect(() => {
    let cancelled = false

    const checkApiVersion = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/health`)
        const data: ApiHealth = await response.json()

        // This prevents printing the same thing twice
        if (cancelled) return

        setApiVersion(data.version)
        setApiSha(data.gitSha)
        setApiEnvironment(data.environment)

        // Always compare SHAs for true commit-level verification
        const versionsMatch = data.gitSha === webSha
        setShowMismatch(!versionsMatch)

        // Always log both version and SHA for visibility
        console.log(
          `🔍 API: ${data.version} (${data.gitSha}) | Web: ${webVersion} (${webSha}) | Env: ${data.environment}`
        )

        if (versionsMatch) {
          console.log(`✅ Versions match`)
        } else {
          console.warn(`⚠️ Version mismatch`)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to check API version:', error)
        }
      }
    }

    checkApiVersion()

    return () => {
      cancelled = true
    }
  }, [webVersion, webSha])

  if (!showMismatch) return null

  const isDevelopment = apiEnvironment !== 'production'
  const apiDisplay = isDevelopment
    ? `${apiVersion} (${apiSha})`
    : `${apiVersion} (${apiSha})`
  const webDisplay = isDevelopment
    ? `dev (${webSha})`
    : `${webVersion} (${webSha})`

  return (
    <p className="text-xs text-yellow-400 mb-1">
      ⚠️ API {apiDisplay} does not match Web {webDisplay}
    </p>
  )
}

export default VersionCheck
