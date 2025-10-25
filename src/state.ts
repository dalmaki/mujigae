import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { parse, formatHex, formatRgb, formatHsl, converter } from 'culori'

// Generate a random UUID
const generateUUID = (): string => {
  return globalThis.crypto.randomUUID()
}

const DECIMAL_PLACES = 4 // Decimal places for displaying color numbers
const DECIMAL_ZERO = '0.' + '0'.repeat(DECIMAL_PLACES) // e.g.) '0.00'
const DECIMAL_UNIT = '0.' + '0'.repeat(DECIMAL_PLACES - 1) + '1' // e.g.) '0.01'

type Theme = 'light' | 'dark'
export type ColorFormat = 'rgb' | 'hex' | 'oklch' | 'hsl' | 'oklab'

export interface PaletteColor {
  id: string
  data: string
}

export interface Color extends PaletteColor {
  format: ColorFormat
}

// Converter functions for different color spaces
const toOklch = converter('oklch')
const toOklab = converter('oklab')

export const formatColor = (format: ColorFormat, color: Color): Color => {
  const parsed = parse(color.data)
  if (!parsed) return color

  switch (format) {
    case 'hex':
      return { id: color.id, format: 'hex', data: formatHex(parsed) }
    case 'rgb':
      return { id: color.id, format: 'rgb', data: formatRgb(parsed) }
    case 'hsl':
      return { id: color.id, format: 'hsl', data: formatHsl(parsed) }
    case 'oklch':
      const oklch = toOklch(parsed)
      if (!oklch) return color

      if (oklch.c !== undefined && oklch.c < +DECIMAL_UNIT) {
        return { id: color.id, format: 'oklch', data: `oklch(${oklch.l.toFixed(DECIMAL_PLACES)} ${oklch.c.toFixed(DECIMAL_PLACES)})` }
      }

      // Format with decimal places
      const l = oklch.l.toFixed(DECIMAL_PLACES)
      const c = oklch.c !== undefined ? oklch.c.toFixed(DECIMAL_PLACES) : DECIMAL_ZERO
      const h = oklch.h !== undefined ? oklch.h.toFixed(DECIMAL_PLACES) : DECIMAL_ZERO
      return { id: color.id, format: 'oklch', data: `oklch(${l} ${c} ${h})` }
    case 'oklab':
      const oklab = toOklab(parsed)
      if (!oklab) return color

      // Format with decimal places
      const l_lab = oklab.l.toFixed(DECIMAL_PLACES)
      const a = oklab.a !== undefined ? oklab.a.toFixed(DECIMAL_PLACES) : DECIMAL_ZERO
      const b = oklab.b !== undefined ? oklab.b.toFixed(DECIMAL_PLACES) : DECIMAL_ZERO
      return { id: color.id, format: 'oklab', data: `oklab(${l_lab} ${a} ${b})` }
    default:
      return { id: color.id, format: 'hex', data: formatHex(parsed) }
  }
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
    }),
    {
      name: 'theme',
    }
  )
)

// PaletteStore

export interface PaletteRow {
  id: string
  name: string
  description: string
  colors: Color[]
}

interface PaletteValues {
  values: string[]
}

interface PaletteState {
  values: PaletteValues
  rows: PaletteRow[]
  selectedColor: string | null
}

interface PaletteAction {
  addRow: () => void
  deleteRow: (id: string) => void
  reorderRows: (oldIndex: number, newIndex: number) => void
  reorderColors: (rowId: string, oldIndex: number, newIndex: number) => void

  updateRowName: (id: string, toName: string) => void
  updateRowDescription: (id: string, description: string) => void
  updateColor: (colorId: string, colorString: string) => void
  updateValues: (values: PaletteValues) => void

  selectColor: (colorId: string) => void
  clearSelection: () => void
}

const createDefaultColors = (): Color[] =>
  ['#fafafa', '#f5f5f5', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373', '#525252', '#404040', '#262626', '#171717', '#0a0a0a'].map(
    (data) => ({ id: generateUUID(), format: 'hex', data })
  )

const defaultValues: PaletteValues = {
  values: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
}

export const usePaletteStore = create<PaletteState & PaletteAction>()(
  persist(
    (set) => ({
      rows: [
        {
          id: generateUUID(),
          name: 'Neutral',
          description: 'Monochrome',
          colors: createDefaultColors(),
        },
      ],
      selectedColor: null,
      values: defaultValues,
      addRow: () =>
        set((state) => ({
          rows: [
            ...state.rows,
            {
              id: generateUUID(),
              name: 'Untitled Row',
              description: 'Description',
              colors: createDefaultColors(),
            },
          ],
        })),
      deleteRow: (id) =>
        set((state) => ({
          rows: state.rows.filter((row) => row.id !== id),
        })),
      reorderRows: (oldIndex, newIndex) =>
        set((state) => {
          const newRows = [...state.rows]
          const [movedRow] = newRows.splice(oldIndex, 1)
          newRows.splice(newIndex, 0, movedRow)
          return { rows: newRows }
        }),
      reorderColors: (rowId, oldIndex, newIndex) =>
        set((state) => ({
          rows: state.rows.map((row) => {
            if (row.id === rowId) {
              const newColors = [...row.colors]
              const [movedColor] = newColors.splice(oldIndex, 1)
              newColors.splice(newIndex, 0, movedColor)
              return { ...row, colors: newColors }
            }
            return row
          }),
        })),
      updateRowName: (id, toName) =>
        set((state) => ({
          rows: state.rows.map((row) =>
            row.id === id ? { ...row, name: toName } : row
          ),
        })),
      updateRowDescription: (id, description) =>
        set((state) => ({
          rows: state.rows.map((row) =>
            row.id === id ? { ...row, description } : row
          ),
        })),
      updateColor: (colorId, colorString) =>
        set((state) => ({
          rows: state.rows.map((row) => {
            const colorIndex = row.colors.findIndex((c) => c.id === colorId)
            if (colorIndex !== -1) {
              const newColors = [...row.colors]
              const parsedColor = parse(colorString)
              if (!parsedColor) return row // Invalid color, do not update
              if (!['rgb', 'hex', 'oklch', 'hsl', 'oklab'].includes(parsedColor.mode)) return row

              newColors[colorIndex] = {
                id: colorId,
                format: parsedColor.mode as ColorFormat,
                data: colorString,
              }
              return { ...row, colors: newColors }
            }
            return row
          }),
        })),
      updateValues: (values) => set(() => ({ values })),
      selectColor: (colorId) =>
        set((state) => {
          // Toggle selection: if same color is clicked, deselect it
          if (state.selectedColor === colorId) {
            return { selectedColor: null }
          }
          return { selectedColor: colorId }
        }),
      clearSelection: () => set(() => ({ selectedColor: null })),
    }),
    {
      name: 'palette-storage',
    }
  )
)
