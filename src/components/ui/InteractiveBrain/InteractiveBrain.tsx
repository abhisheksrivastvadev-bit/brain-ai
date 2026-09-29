import React, { useId, useState } from 'react'
import './InteractiveBrain.css'

export interface InteractiveBrainProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  interactive?: boolean
  thinking?: boolean
  glow?: boolean
  className?: string
}

export const InteractiveBrain: React.FC<InteractiveBrainProps> = ({
  size = 24,
  interactive = true,
  thinking = false,
  glow = true,
  className = '',
  onClick,
  ...props
}) => {
  const uid = useId().replace(/:/g, '_')
  const [isFiring, setIsFiring] = useState(false)

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (interactive) {
      setIsFiring(true)
      setTimeout(() => setIsFiring(false), 650)
    }
    if (onClick) {
      onClick(e)
    }
  }

  const gradLeftId = `brain-grad-left-${uid}`
  const gradRightId = `brain-grad-right-${uid}`
  const gradCircuitId = `brain-grad-circ-${uid}`
  const glowFilterId = `brain-glow-filter-${uid}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`interactive-brain-root ${interactive ? 'is-interactive' : ''} ${
        thinking ? 'is-thinking' : ''
      } ${isFiring ? 'is-firing' : ''} ${className}`}
      onClick={handleClick}
      role="img"
      aria-label="Interactive Brain AI"
      {...props}
    >
      <defs>
        {/* Left hemisphere organic gradient: Indigo -> Violet */}
        <linearGradient id={gradLeftId} x1="4" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>

        {/* Right hemisphere organic gradient: Violet -> Neon Cyan */}
        <linearGradient id={gradRightId} x1="16" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="60%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>

        {/* Dynamic synaptic circuit gradient */}
        <linearGradient id={gradCircuitId} x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>

        {/* Luminescent glow filter */}
        {glow && (
          <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Atmospheric Neural Aura Glow Layer */}
      <g className="brain-ambient-aura" opacity={thinking || isFiring ? 0.45 : 0.2}>
        <ellipse cx="16" cy="16" rx="12" ry="11" fill="url(#brain-grad-circ-${uid})" filter={`url(#${glowFilterId})`} />
      </g>

      {/* Main Cortical Lobes Base (with soft fill) */}
      <g className="brain-cortex-base" filter={glow ? `url(#${glowFilterId})` : undefined}>
        {/* Left Hemisphere Lobe */}
        <path
          d="M 15 5.5 C 12.2 5.2 9.2 6.6 7.6 9.2 C 5.5 11.8 4.8 15.4 5.8 18.5 C 4.9 21.6 6.5 25.1 9.4 26.8 C 11.5 27.9 13.8 27.8 15 27"
          fill="rgba(99, 102, 241, 0.12)"
          stroke={`url(#${gradLeftId})`}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="brain-lobe lobe-left"
        />

        {/* Right Hemisphere Lobe */}
        <path
          d="M 17 5.5 C 19.8 5.2 22.8 6.6 24.4 9.2 C 26.5 11.8 27.2 15.4 26.2 18.5 C 27.1 21.6 25.5 25.1 22.6 26.8 C 20.5 27.9 18.2 27.8 17 27"
          fill="rgba(6, 182, 212, 0.12)"
          stroke={`url(#${gradRightId})`}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="brain-lobe lobe-right"
        />
      </g>

      {/* Central Longitudinal Fissure & Neural Axis */}
      <g className="brain-neural-axis">
        <path
          d="M 16 5.5 L 16 27"
          stroke="url(#brain-grad-circ-${uid})"
          strokeWidth="1.4"
          strokeDasharray="1 2.5"
          strokeLinecap="round"
          className="brain-axis-line"
        />
      </g>

      {/* Synaptic Circuit Pathways (Animated) */}
      <g className="brain-synaptic-pathways" stroke={`url(#${gradCircuitId})`} strokeWidth="1.3" strokeLinecap="round">
        {/* Left internal sulci circuits */}
        <path d="M 15 9 C 12.2 9 10 11.2 10.6 13.8" className="circuit-path path-1" />
        <path d="M 6.5 15 C 9.2 14.5 12 15.8 14.5 16.2" className="circuit-path path-2" />
        <path d="M 7.2 20 C 9.5 19.5 11.2 20.8 11.8 22.8" className="circuit-path path-3" />
        <path d="M 10.5 25.2 C 12.5 25.8 14 24.2 14.8 23" className="circuit-path path-4" />

        {/* Right internal sulci circuits */}
        <path d="M 17 9 C 19.8 9 22 11.2 21.4 13.8" className="circuit-path path-5" />
        <path d="M 25.5 15 C 22.8 14.5 20 15.8 17.5 16.2" className="circuit-path path-6" />
        <path d="M 24.8 20 C 22.5 19.5 20.8 20.8 20.2 22.8" className="circuit-path path-7" />
        <path d="M 21.5 25.2 C 19.5 25.8 18 24.2 17.2 23" className="circuit-path path-8" />

        {/* Inter-hemispheric Synaptic Bridges */}
        <path d="M 13.5 11 L 18.5 11" className="circuit-bridge bridge-top" />
        <path d="M 13 16.2 L 19 16.2" className="circuit-bridge bridge-mid" />
        <path d="M 13.5 21.8 L 18.5 21.8" className="circuit-bridge bridge-bot" />
      </g>

      {/* Synaptic Energy Nodes (Glowing Dots) */}
      <g className="brain-synaptic-nodes">
        {/* Left hemisphere nodes */}
        <circle cx="10.6" cy="13.8" r="1.3" fill="#ffffff" className="synapse-node node-l1" />
        <circle cx="6.5" cy="15" r="1.2" fill="#818cf8" className="synapse-node node-l2" />
        <circle cx="11.8" cy="22.8" r="1.3" fill="#a855f7" className="synapse-node node-l3" />
        <circle cx="14.8" cy="23" r="1.1" fill="#38bdf8" className="synapse-node node-l4" />
        <circle cx="8" cy="9.5" r="1.2" fill="#6366f1" className="synapse-node node-l5" />

        {/* Right hemisphere nodes */}
        <circle cx="21.4" cy="13.8" r="1.3" fill="#ffffff" className="synapse-node node-r1" />
        <circle cx="25.5" cy="15" r="1.2" fill="#22d3ee" className="synapse-node node-r2" />
        <circle cx="20.2" cy="22.8" r="1.3" fill="#38bdf8" className="synapse-node node-r3" />
        <circle cx="17.2" cy="23" r="1.1" fill="#a855f7" className="synapse-node node-r4" />
        <circle cx="24" cy="9.5" r="1.2" fill="#06b6d4" className="synapse-node node-r5" />

        {/* Center Nexus Core Nodes */}
        <circle cx="16" cy="11" r="1.4" fill="#38bdf8" className="synapse-node nexus-top" />
        <circle cx="16" cy="16.2" r="1.7" fill="#ffffff" className="synapse-node nexus-core" />
        <circle cx="16" cy="21.8" r="1.4" fill="#a855f7" className="synapse-node nexus-bot" />
      </g>

      {/* Active Synapse Firing Pulse Rings */}
      <g className="brain-pulse-rings" opacity={isFiring || thinking ? 1 : 0}>
        <circle cx="16" cy="16.2" r="4.5" stroke="#38bdf8" strokeWidth="0.8" fill="none" className="ring-pulse" />
      </g>
    </svg>
  )
}
