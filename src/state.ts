import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

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

// Palette Store
interface ColorBox {
  value: string
  color: string
}

export interface PaletteRow {
  id: string
  name: string
  description: string
  colors: ColorBox[]
}

interface SelectedColor {
  rowId: string
  colorIndex: number
}

interface PaletteState {
  rows: PaletteRow[]
  selectedColor: SelectedColor | null
  addRow: () => void
  deleteRow: (id: string) => void
  updateRowField: (
    rowId: string,
    field: 'name' | 'description',
    value: string
  ) => void
  updateColorValue: (rowId: string, colorIndex: number, value: string) => void
  reorderRows: (oldIndex: number, newIndex: number) => void
  selectColor: (rowId: string, colorIndex: number) => void
  clearSelection: () => void
}

const defaultColors: ColorBox[] = [
  { value: '50', color: 'var(--c-neut-050)' },
  { value: '100', color: 'var(--c-neut-100)' },
  { value: '200', color: 'var(--c-neut-200)' },
  { value: '300', color: 'var(--c-neut-300)' },
  { value: '400', color: 'var(--c-neut-400)' },
  { value: '500', color: 'var(--c-neut-500)' },
  { value: '600', color: 'var(--c-neut-600)' },
  { value: '700', color: 'var(--c-neut-700)' },
  { value: '800', color: 'var(--c-neut-800)' },
  { value: '900', color: 'var(--c-neut-900)' },
  { value: '950', color: 'var(--c-neut-950)' },
]

export const usePaletteStore = create<PaletteState>()(
  persist(
    (set) => ({
      rows: [
        {
          id: '1',
          name: 'Primary',
          description: 'Main brand colors',
          colors: defaultColors,
        },
      ],
      selectedColor: null,
      addRow: () =>
        set((state) => ({
          rows: [
            ...state.rows,
            {
              id: Date.now().toString(),
              name: 'Untitled Row',
              description: 'Description',
              colors: defaultColors,
            },
          ],
        })),
      deleteRow: (id) =>
        set((state) => ({
          rows: state.rows.filter((row) => row.id !== id),
        })),
      updateRowField: (rowId, field, value) =>
        set((state) => ({
          rows: state.rows.map((row) =>
            row.id === rowId ? { ...row, [field]: value } : row
          ),
        })),
      updateColorValue: (rowId, colorIndex, value) =>
        set((state) => ({
          rows: state.rows.map((row) => {
            if (row.id === rowId) {
              const newColors = [...row.colors]
              newColors[colorIndex] = { ...newColors[colorIndex], value }
              return { ...row, colors: newColors }
            }
            return row
          }),
        })),
      reorderRows: (oldIndex, newIndex) =>
        set((state) => {
          const newRows = [...state.rows]
          const [movedRow] = newRows.splice(oldIndex, 1)
          newRows.splice(newIndex, 0, movedRow)
          return { rows: newRows }
        }),
      selectColor: (rowId, colorIndex) =>
        set((state) => {
          // Toggle selection: if same color is clicked, deselect it
          if (
            state.selectedColor?.rowId === rowId &&
            state.selectedColor?.colorIndex === colorIndex
          ) {
            return { selectedColor: null }
          }
          return { selectedColor: { rowId, colorIndex } }
        }),
      clearSelection: () => set(() => ({ selectedColor: null })),
    }),
    {
      name: 'palette-storage',
    }
  )
)
