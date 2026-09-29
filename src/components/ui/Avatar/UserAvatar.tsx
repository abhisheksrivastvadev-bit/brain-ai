import React, { useState } from 'react'
import type { User } from '../../../types'
import './UserAvatar.css'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number

export interface UserAvatarProps {
  user?: User | { name?: string; email?: string; avatar?: string; id?: string; user_id?: string } | null
  size?: AvatarSize
  showStatus?: boolean
  status?: 'online' | 'busy' | 'away' | 'offline'
  className?: string
  interactive?: boolean
  alt?: string
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
}

const GRADIENT_PALETTES = [
  'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',   // Cyber Indigo-Cyan
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',   // Neon Violet-Pink
  'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',   // Matrix Emerald-Cyan
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',   // Solar Amber-Red
  'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',   // Deep Royal Purple
  'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',   // Sunset Rose-Orange
  'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',   // Arctic Sky-Teal
  'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',   // Cosmic Magenta-Blue
]

function getHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    if (parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }
  if (email && email.trim()) {
    const local = email.trim().split('@')[0]
    return local.slice(0, 2).toUpperCase()
  }
  return 'AI'
}

export function getDeterministicAvatar(seed: string): string {
  // Uses dicebear modern bottts-neutral avatar with rich palette
  const encoded = encodeURIComponent(seed || 'BrainUser')
  return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encoded}&radius=50`
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'sm',
  showStatus = false,
  status = 'online',
  className = '',
  interactive = false,
  alt,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const name = user?.name || 'User'
  const email = user?.email || ''
  const seed = (user?.user_id || user?.id || name || email || 'BrainUser').toLowerCase()
  const initials = getInitials(name, email)
  const paletteIndex = getHash(seed) % GRADIENT_PALETTES.length
  const gradient = GRADIENT_PALETTES[paletteIndex]

  // Decide avatar image source: custom user avatar -> or deterministic generated avatar
  const avatarSrc = user?.avatar || getDeterministicAvatar(seed)

  const sizePixels = typeof size === 'number'
    ? size
    : size === 'xs'
    ? 22
    : size === 'sm'
    ? 28
    : size === 'md'
    ? 36
    : size === 'lg'
    ? 48
    : 64 // 'xl'

  const fontSize = Math.max(10, Math.floor(sizePixels * 0.38))
  const statusSize = Math.max(6, Math.floor(sizePixels * 0.28))

  return (
    <div
      className={`brain-user-avatar-root ${interactive ? 'interactive' : ''} ${className}`}
      style={{
        width: sizePixels,
        height: sizePixels,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={alt || `${name}'s profile avatar`}
      title={name}
    >
      {/* Background Gradient & Initials Fallback */}
      <div
        className="brain-avatar-initials-fallback"
        style={{
          background: gradient,
          fontSize: `${fontSize}px`,
        }}
        aria-hidden="true"
      >
        <span>{initials}</span>
      </div>

      {/* Avatar Image (custom or deterministic) */}
      {!imgError && avatarSrc && (
        <img
          src={avatarSrc}
          alt={alt || name}
          className={`brain-avatar-img ${imgLoaded ? 'loaded' : ''}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
      )}

      {/* Online Status Dot */}
      {showStatus && (
        <span
          className={`brain-avatar-status-dot status--${status}`}
          style={{
            width: statusSize,
            height: statusSize,
          }}
          title={status.charAt(0).toUpperCase() + status.slice(1)}
        />
      )}
    </div>
  )
}
