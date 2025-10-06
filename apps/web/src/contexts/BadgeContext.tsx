import React, { createContext, useContext, useState, useCallback } from 'react'

interface BadgeData {
  id: string
  name: string
  description: string
  tier: 'silver' | 'gold'
  awardedAt: number
  triggerText: string
  awardEventId: string
}

interface BadgeContextType {
  badges: BadgeData[]
  currentAwardEventId: string | null
  newlyAwardedBadgeId: string | null
  awardBadge: (badge: Omit<BadgeData, 'awardedAt' | 'awardEventId'>) => void
  hasBadge: (id: string, tier?: 'silver' | 'gold') => boolean
  clearNewlyAwardedBadge: () => void
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined)

const STORAGE_KEY = 'riddle-badges'

// Check if localStorage is available at module level
const isLocalStorageSupported = (() => {
  try {
    if (typeof window === 'undefined' || typeof Storage === 'undefined') {
      return false
    }
    const test = '__localStorage_test__'
    localStorage.setItem(test, 'test')
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
})()

// Safe localStorage wrapper
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isLocalStorageSupported) return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isLocalStorageSupported) return
    try {
      localStorage.setItem(key, value)
    } catch {
      // Silently fail
    }
  },
}

export const BadgeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [badges, setBadges] = useState<BadgeData[]>(() => {
    // Initialize state from localStorage on first render only
    if (!isLocalStorageSupported) {
      console.warn(
        'localStorage is not available in this environment, badges will not persist'
      )
      return []
    }

    const stored = safeLocalStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.error('Failed to parse stored badges:', error)
        return []
      }
    }
    return []
  })
  const [currentAwardEventId, setCurrentAwardEventId] = useState<string | null>(
    null
  )
  const [newlyAwardedBadgeId, setNewlyAwardedBadgeId] = useState<string | null>(
    null
  )

  const awardBadge = useCallback(
    (badge: Omit<BadgeData, 'awardedAt' | 'awardEventId'>) => {
      const awardEventId = Date.now().toString()
      setCurrentAwardEventId(awardEventId)
      setNewlyAwardedBadgeId(badge.id)

      // Don't clear the newly awarded flag automatically - let it persist until next question

      const newBadge: BadgeData = {
        ...badge,
        awardedAt: Date.now(),
        awardEventId,
      }

      setBadges((current) => {
        // Remove any existing badge with same id (to upgrade silver to gold or replay animation)
        const filtered = current.filter((b) => b.id !== badge.id)

        // Check if we're downgrading from gold to silver
        const hasGold = current.some(
          (b) => b.id === badge.id && b.tier === 'gold'
        )
        if (hasGold && badge.tier === 'silver') {
          // Keep the gold but update timestamp and award event for animation
          const goldBadge = current.find(
            (b) => b.id === badge.id && b.tier === 'gold'
          )
          if (goldBadge) {
            const updatedGold = {
              ...goldBadge,
              awardedAt: Date.now(),
              awardEventId,
            }
            const updated = [...filtered, updatedGold]
            safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            return updated
          }
        }

        // Add new badge (or replace existing with same tier)
        const updated = [...filtered, newBadge]
        safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return updated
      })
    },
    []
  )

  const hasBadge = useCallback(
    (id: string, tier?: 'silver' | 'gold') => {
      return badges.some(
        (badge) => badge.id === id && (tier ? badge.tier === tier : true)
      )
    },
    [badges]
  )

  const clearNewlyAwardedBadge = useCallback(() => {
    setNewlyAwardedBadgeId(null)
    setCurrentAwardEventId(null)
  }, [])

  return (
    <BadgeContext.Provider
      value={{
        badges,
        currentAwardEventId,
        newlyAwardedBadgeId,
        awardBadge,
        hasBadge,
        clearNewlyAwardedBadge,
      }}
    >
      {children}
    </BadgeContext.Provider>
  )
}

export const useBadges = () => {
  const context = useContext(BadgeContext)
  if (context === undefined) {
    throw new Error('useBadges must be used within a BadgeProvider')
  }
  return context
}
