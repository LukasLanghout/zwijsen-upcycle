import type { TransformedExercise } from './types'

/**
 * Normalize pattern puzzle totals - ensures total = sum(count × value) for all groups.
 * This protects against LLM errors where the total doesn't match the math.
 *
 * Only recalculates totals when ALL shape values are known (e.g. digit composition
 * puzzles where triangle=1000, heart=100, square=10, circle=1).
 */
export function normalizePatternPuzzle(
  transformed: TransformedExercise | null | undefined
): TransformedExercise | null {
  if (!transformed) return null
  if (transformed.question_type !== 'pattern_puzzle') return transformed
  const puzzle = transformed.pattern_puzzle
  if (!puzzle || !Array.isArray(puzzle.shapes) || !Array.isArray(puzzle.groups)) {
    return transformed
  }

  // Build a lookup of shape name -> value
  const shapeValues: Record<string, number | null> = {}
  for (const shape of puzzle.shapes) {
    shapeValues[shape.name] = typeof shape.value === 'number' ? shape.value : null
  }

  // Only recalculate if all shapes have known values
  const allValuesKnown = Object.values(shapeValues).every(
    (v) => v !== null && v !== undefined
  )
  if (!allValuesKnown) return transformed

  // Recalculate each group's total based on counts × values
  const normalizedGroups = puzzle.groups.map((group) => {
    const counts = group.counts || {}
    let calculatedTotal = 0
    for (const [shapeName, count] of Object.entries(counts)) {
      const value = shapeValues[shapeName] ?? 0
      calculatedTotal += (count as number) * value
    }
    return {
      ...group,
      total: calculatedTotal,
      is_known: group.is_known ?? true,
    }
  })

  return {
    ...transformed,
    pattern_puzzle: {
      ...puzzle,
      groups: normalizedGroups,
    },
  }
}
