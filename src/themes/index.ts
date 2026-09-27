/**
 * Brain AI - Themes Central Export
 */

export { colors, palette, lightThemeColors, darkThemeColors, gradients } from './colors'
export type { ColorPalette, LightThemeColors, DarkThemeColors, ThemeGradients } from './colors'

export { fonts, fontFamilies, fontSizes, fontWeights, lineHeights, letterSpacings, textStyles } from './fonts'
export type { FontFamilies, FontSizes, FontWeights, LineHeights, LetterSpacings, TextStyles } from './fonts'

export { constants, spacing, borderRadius, shadows, transitions, breakpoints, zIndex } from './constants'
export type { Spacing, BorderRadius, Shadows, Transitions, Breakpoints, ZIndex } from './constants'

import colors from './colors'
import fonts from './fonts'
import constants from './constants'

export const theme = {
  colors,
  fonts,
  ...constants,
}

export type Theme = typeof theme

export default theme
