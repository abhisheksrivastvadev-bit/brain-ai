import React from 'react'
import { cn } from '../../../utils'
import './Loader.css'

export type LoaderVariant = 'spinner' | 'dots' | 'pulse' | 'bars' | 'skeleton'
export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
export type LoaderColor = 'primary' | 'accent' | 'purple' | 'white' | 'current' | string

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: LoaderVariant
  size?: LoaderSize
  color?: LoaderColor
  text?: string
  textPosition?: 'bottom' | 'right'
  overlay?: boolean
  fullscreen?: boolean
  className?: string
  skeletonWidth?: string | number
  skeletonHeight?: string | number
}

const SIZE_MAP: Record<string, number> = {
  xs: 14,
  sm: 18,
  md: 24,
  lg: 36,
  xl: 48,
}

const COLOR_MAP: Record<string, string> = {
  primary: 'var(--color-primary-500, #6366f1)',
  accent: 'var(--color-accent-500, #06b6d4)',
  purple: 'var(--color-purple-500, #a855f7)',
  white: '#ffffff',
  current: 'currentColor',
}

export const Loader: React.FC<LoaderProps> = ({
  variant = 'spinner',
  size = 'md',
  color = 'primary',
  text,
  textPosition = 'bottom',
  overlay = false,
  fullscreen = false,
  className = '',
  skeletonWidth = '100%',
  skeletonHeight = '20px',
  style,
  ...props
}) => {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 24
  const resolvedColor = COLOR_MAP[color] || color

  const renderContent = () => {
    switch (variant) {
      case 'dots': {
        const sizeClass = typeof size === 'string' ? `brain-loader-dots--${size}` : ''
        return (
          <div
            className={cn('brain-loader-dots', sizeClass)}
            style={{ color: resolvedColor }}
            aria-hidden="true"
          >
            <span className="brain-loader-dot" />
            <span className="brain-loader-dot" />
            <span className="brain-loader-dot" />
          </div>
        )
      }

      case 'pulse':
        return (
          <div
            className="brain-loader-pulse"
            style={{
              width: pixelSize,
              height: pixelSize,
              color: resolvedColor,
            }}
            aria-hidden="true"
          >
            <div className="brain-loader-pulse-core" />
            <div className="brain-loader-pulse-ring" />
          </div>
        )

      case 'bars': {
        const sizeClass = typeof size === 'string' ? `brain-loader-bars--${size}` : ''
        return (
          <div
            className={cn('brain-loader-bars', sizeClass)}
            style={{ color: resolvedColor }}
            aria-hidden="true"
          >
            <span className="brain-loader-bar" />
            <span className="brain-loader-bar" />
            <span className="brain-loader-bar" />
            <span className="brain-loader-bar" />
          </div>
        )
      }

      case 'skeleton':
        return (
          <span
            className="brain-loader-skeleton"
            style={{
              width: skeletonWidth,
              height: skeletonHeight,
            }}
            aria-hidden="true"
          />
        )

      case 'spinner':
      default: {
        const strokeWidth = pixelSize <= 18 ? 3 : 2.5
        const radius = (pixelSize - strokeWidth * 2) / 2
        const circumference = 2 * Math.PI * radius
        const offset = circumference * 0.25

        return (
          <svg
            className="brain-loader-spinner"
            width={pixelSize}
            height={pixelSize}
            viewBox={`0 0 ${pixelSize} ${pixelSize}`}
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="brain-loader-spinner-track"
              cx={pixelSize / 2}
              cy={pixelSize / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeOpacity="0.2"
            />
            <circle
              className="brain-loader-spinner-circle"
              cx={pixelSize / 2}
              cy={pixelSize / 2}
              r={radius}
              stroke={resolvedColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
        )
      }
    }
  }

  const loaderElement = (
    <div
      role="status"
      aria-label={text || 'Loading'}
      className={cn(
        'brain-loader-container',
        `brain-loader-container--direction-${textPosition}`,
        className
      )}
      style={{
        color: resolvedColor,
        ...style,
      }}
      {...props}
    >
      {renderContent()}
      {text && <span className="brain-loader-text">{text}</span>}
      <span className="brain-sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }}>
        {text || 'Loading...'}
      </span>
    </div>
  )

  if (overlay || fullscreen) {
    return (
      <div
        className={cn(
          'brain-loader-overlay',
          fullscreen && 'brain-loader-fullscreen'
        )}
      >
        {loaderElement}
      </div>
    )
  }

  return loaderElement
}

export default Loader
