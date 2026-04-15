'use client'

import React from 'react'

interface ShapeProps {
  shape: string
  size?: number
  color?: string
  filled?: boolean
}

/**
 * Renders SVG shapes for pattern puzzle visualization
 * Supports both English and Dutch shape names
 */
export function ShapeVisualizer({
  shape,
  size = 40,
  color = '#A81D7B',
  filled = true
}: ShapeProps) {
  const shapeKey = shape.toLowerCase()
  const radius = size / 2

  // Circle / Cirkel
  if (shapeKey === 'circle' || shapeKey === 'cirkel') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="inline-block">
        <circle
          cx={radius}
          cy={radius}
          r={radius - 2}
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={filled ? '0' : '2'}
        />
      </svg>
    )
  }

  // Square / Vierkant
  if (shapeKey === 'square' || shapeKey === 'vierkant') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="inline-block">
        <rect
          x="2"
          y="2"
          width={size - 4}
          height={size - 4}
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={filled ? '0' : '2'}
        />
      </svg>
    )
  }

  // Triangle / Driehoek
  if (shapeKey === 'triangle' || shapeKey === 'driehoek') {
    const points = `${radius},2 ${size - 2},${size - 2} 2,${size - 2}`
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="inline-block">
        <polygon
          points={points}
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={filled ? '0' : '2'}
        />
      </svg>
    )
  }

  // Heart / Hart
  if (shapeKey === 'heart' || shapeKey === 'hart') {
    const heartPath = `M ${size / 2},${size * 0.4}
      C ${size / 2},${size * 0.2} ${size * 0.3},${size * 0.05} ${size * 0.2},${size * 0.15}
      C ${size * 0.05},${size * 0.3} ${size * 0.1},${size * 0.5} ${size / 2},${size * 0.85}
      C ${size * 0.9},${size * 0.5} ${size * 0.95},${size * 0.3} ${size * 0.8},${size * 0.15}
      C ${size * 0.7},${size * 0.05} ${size / 2},${size * 0.2} ${size / 2},${size * 0.4} Z`
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="inline-block">
        <path
          d={heartPath}
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={filled ? '0' : '1.5'}
        />
      </svg>
    )
  }

  // Star / Ster
  if (shapeKey === 'star' || shapeKey === 'ster') {
    const points = []
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2
      const dist = i % 2 === 0 ? radius - 2 : radius * 0.4
      points.push(`${radius + dist * Math.cos(angle)},${radius + dist * Math.sin(angle)}`)
    }
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="inline-block">
        <polygon
          points={points.join(' ')}
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={filled ? '0' : '2'}
        />
      </svg>
    )
  }

  // Diamond / Ruit
  if (shapeKey === 'diamond' || shapeKey === 'ruit') {
    const points = `${radius},2 ${size - 2},${radius} ${radius},${size - 2} 2,${radius}`
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="inline-block">
        <polygon
          points={points}
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={filled ? '0' : '2'}
        />
      </svg>
    )
  }

  // Pentagon / Vijfhoek
  if (shapeKey === 'pentagon' || shapeKey === 'vijfhoek') {
    const points = []
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
      points.push(`${radius + (radius - 2) * Math.cos(angle)},${radius + (radius - 2) * Math.sin(angle)}`)
    }
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="inline-block">
        <polygon
          points={points.join(' ')}
          fill={filled ? color : 'none'}
          stroke={color}
          strokeWidth={filled ? '0' : '2'}
        />
      </svg>
    )
  }

  // Fallback: show shape name
  return (
    <span className="text-sm font-medium text-gray-500">
      {shape}
    </span>
  )
}

/**
 * Render multiple shapes in a group
 */
export function ShapeGroup({
  shapes,
  counts,
  color = '#A81D7B',
  size = 36,
}: {
  shapes: string[]
  counts: Record<string, number>
  color?: string
  size?: number
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {shapes.map((shape) => {
        const count = counts[shape] || 0
        return (
          <div key={shape} className="flex gap-1">
            {Array.from({ length: count }).map((_, i) => (
              <ShapeVisualizer
                key={`${shape}-${i}`}
                shape={shape}
                size={size}
                color={color}
                filled
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
