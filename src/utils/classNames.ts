/**
 * Brain AI - ClassNames utility
 */

type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | Record<string, unknown>

export function classNames(...classes: ClassValue[]): string {
  return classes
    .flatMap((c) => {
      if (!c) return []
      if (typeof c === 'string') return c.trim()
      if (typeof c === 'number') return String(c)
      if (typeof c === 'object') {
        return Object.entries(c)
          .filter(([, val]) => Boolean(val))
          .map(([key]) => key.trim())
      }
      return []
    })
    .filter(Boolean)
    .join(' ')
}

export const cn = classNames

export default classNames
