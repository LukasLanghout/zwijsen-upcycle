'use client'

import React from 'react'
import { ShapeVisualizer } from './ShapeVisualizer'

interface PatternPuzzleGroup {
  shapes: string[]
  counts: Record<string, number>
  total?: number
  isKnown?: boolean
}

interface PatternPuzzleVisualizerProps {
  groups: PatternPuzzleGroup[]
  color?: string
  shapeSize?: number
}

/**
 * Enhanced pattern puzzle visualizer that mimics the original Zwijsen layout
 * Shows shapes distributed in a natural grid pattern like the original workbook
 */
export function PatternPuzzleVisualizer({
  groups,
  color = '#A81D7B',
  shapeSize = 32,
}: PatternPuzzleVisualizerProps) {
  if (!groups || groups.length === 0) {
    return <div className="text-gray-500 text-sm">Geen patroongroepen beschikbaar</div>
  }

  return (
    <div className="space-y-6">
      {groups.map((group, groupIdx) => (
        <div key={groupIdx} className="flex flex-col gap-3">
          {/* Shape Grid - Mimics original layout */}
          <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 min-h-32">
            <ShapeGrid shapes={group.shapes} counts={group.counts} color={color} size={shapeSize} />
          </div>

          {/* Total Box */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-700">= </span>
            {group.isKnown !== false ? (
              <div className="px-4 py-2 bg-zwijsen-primary-100 text-zwijsen-primary-700 font-bold text-lg rounded-lg border-2 border-zwijsen-primary-300">
                {group.total ?? '?'}
              </div>
            ) : (
              <input
                type="number"
                placeholder="?"
                className="px-4 py-2 w-20 border-2 border-gray-400 rounded-lg font-bold text-lg text-center focus:outline-none focus:ring-2 focus:ring-zwijsen-primary-500"
                aria-label="Antwoord invoer"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

interface ShapeGridProps {
  shapes: string[]
  counts: Record<string, number>
  color?: string
  size?: number
}

/**
 * Renders shapes in a natural, scattered grid pattern like the original Zwijsen workbook
 * This mimics the visual layout of the original exercises
 */
function ShapeGrid({ shapes, counts, color = '#A81D7B', size = 32 }: ShapeGridProps) {
  // Flatten all shapes with their counts
  const allShapes: string[] = []
  for (const shape of shapes) {
    const count = counts[shape] || 0
    for (let i = 0; i < count; i++) {
      allShapes.push(shape)
    }
  }

  if (allShapes.length === 0) {
    return <div className="text-gray-500 text-sm text-center">Geen vormen</div>
  }

  // Create a grid with pseudo-random positioning for natural look
  return (
    <div className="relative w-full" style={{ height: `${Math.ceil(allShapes.length / 5) * (size + 20)}px` }}>
      <div className="flex flex-wrap gap-3 justify-center items-start">
        {allShapes.map((shape, idx) => (
          <div
            key={`${shape}-${idx}`}
            className="transform transition-transform duration-200 hover:scale-125"
            style={{
              // Add slight random rotation and offset for natural look
              transform: `rotate(${(idx % 3) * 5 - 5}deg)`,
            }}
          >
            <ShapeVisualizer shape={shape} size={size} color={color} filled={true} />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Pattern puzzle legend showing shape values
 */
export function PatternPuzzleLegend({
  shapes,
  color = '#A81D7B',
  size = 24,
}: {
  shapes: Array<{ name: string; value?: number }>
  color?: string
  size?: number
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Vormen waarden</p>
      <div className="space-y-2">
        {shapes.map((shape) => (
          <div key={shape.name} className="flex items-center gap-3 text-sm">
            <ShapeVisualizer shape={shape.name} size={size} color={color} filled={true} />
            <span className="font-medium text-gray-700">=</span>
            {shape.value !== undefined ? (
              <span className="font-bold text-zwijsen-primary-600 text-lg">{shape.value}</span>
            ) : (
              <span className="text-gray-500 italic">onbekend</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
