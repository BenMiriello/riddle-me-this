import React, { useState, useEffect } from 'react'

interface BadgeData {
  id: string
  name: string
  description: string
  tier: 'silver' | 'gold'
  awardedAt: number
  triggerText: string
  awardEventId: string
}

interface BadgeProps {
  badge: BadgeData
  isTextFilling?: boolean
  isNewlyAwarded?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  badge,
  isTextFilling = false,
  isNewlyAwarded = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState({})
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    if (isNewlyAwarded) {
      setAnimationKey((prev) => prev + 1) // Force re-animation
    }
  }, [isNewlyAwarded])

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const tooltipWidth = 200 // max-width from CSS

    let left = '50%'
    let transform = 'translateX(-50%)'

    // Check if tooltip would go off right edge
    if (rect.left + tooltipWidth / 2 > viewportWidth - 20) {
      left = 'auto'
      transform = 'translateX(-100%)'
      setTooltipStyle({ right: '0px', transform, left: 'auto' })
    }
    // Check if tooltip would go off left edge
    else if (rect.left - tooltipWidth / 2 < 20) {
      left = '0px'
      transform = 'translateX(0%)'
      setTooltipStyle({ left, transform })
    } else {
      setTooltipStyle({ left: '50%', transform: 'translateX(-50%)' })
    }

    setShowTooltip(true)
  }

  const tierStyles =
    badge.tier === 'gold'
      ? {
          background: 'linear-gradient(135deg, #CD7F32, #FFD700)',
          border: '1px solid #FFD700',
        }
      : {
          background: 'linear-gradient(135deg, #A8A8A8, #C0C0C0)',
          border: '1px solid #C0C0C0',
        }

  return (
    <div
      className="badge-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        key={animationKey}
        className={`badge ${isNewlyAwarded ? `newly-awarded tier-${badge.tier}` : ''} ${isTextFilling ? `badge-winner-glow-${badge.tier}` : ''}`}
        style={tierStyles}
        data-tier={badge.tier}
        data-is-text-filling={isTextFilling}
      />
      {showTooltip && (
        <div className={`badge-tooltip ${badge.tier}`} style={tooltipStyle}>
          <div className={`tooltip-title ${badge.tier}`}>{badge.name}</div>
          <div className="tooltip-description">{badge.description}</div>
          <div className="tooltip-tier">{badge.tier} tier</div>
        </div>
      )}
    </div>
  )
}
