import { useState, useEffect } from 'react'
import packageJson from '../../../../../package.json'

interface ApiHealth {
  status: string
  version: string
  buildTime: string
  environment: string
}

const VersionCheck = () => {
  const [apiVersion, setApiVersion] = useState<string>('')
  const [showMismatch, setShowMismatch] = useState(false)
  const webVersion = packageJson.version

  useEffect(() => {
    const checkApiVersion = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/health`)
        const data: ApiHealth = await response.json()
        setApiVersion(data.version)

        const apiIsDev = data.version.startsWith('dev@')
        const webIsDev = webVersion === 'dev'

        let versionsMatch = false
        if (apiIsDev && webIsDev) {
          versionsMatch = true
        } else if (!apiIsDev && !webIsDev) {
          versionsMatch = data.version === webVersion
        } else {
          versionsMatch = false
        }

        setShowMismatch(!versionsMatch)

        if (versionsMatch) {
          console.log(
            `✅ Versions match - API: ${data.version}, Web: ${webVersion}`
          )
        } else {
          console.warn(
            `⚠️ Version mismatch - API: ${data.version}, Web: ${webVersion}`
          )
        }
      } catch (error) {
        console.error('Failed to check API version:', error)
      }
    }

    checkApiVersion()
  }, [webVersion])

  if (!showMismatch) return null

  return (
    <p className="text-xs text-yellow-400 mb-1">
      ⚠️ API version {apiVersion} does not match Web version {webVersion}
    </p>
  )
}

export default VersionCheck
