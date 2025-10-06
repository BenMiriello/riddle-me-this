import React, { useState, useEffect } from 'react'
import { Badge } from './Badge'
import { useBadges } from '../contexts/BadgeContext'

interface BadgeContainerProps {
  isTextFilling?: boolean
}

export const BadgeContainer: React.FC<BadgeContainerProps> = ({
  isTextFilling = false,
}) => {
  const { badges, currentAwardEventId, newlyAwardedBadgeId } = useBadges()
  const [, forceUpdate] = useState({})

  // Force re-render when badges change
  useEffect(() => {
    forceUpdate({})
  }, [badges])

  if (badges.length === 0) {
    return null
  }

  return (
    <div className="badge-container">
      {badges.map((badge) => (
        <Badge
          key={`${badge.id}-${badge.tier}-${badge.awardedAt}`}
          badge={badge}
          isTextFilling={
            isTextFilling && badge.awardEventId === currentAwardEventId
          }
          isNewlyAwarded={badge.id === newlyAwardedBadgeId}
        />
      ))}
    </div>
  )
}
