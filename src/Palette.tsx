import React, { useState, useEffect, useRef } from 'react'
import { Sortable } from '@shopify/draggable'
import { usePaletteStore } from './state'
import cn from './Palette.module.css'
import { clsx } from 'clsx'

// TODO: why is SortableStopEvent not exported from @shopify/draggable?
interface SortableStopEvent {
  oldIndex: number
  newIndex: number
}

// Icon Components
const GripVerticalIcon = ({
  width = 24,
  height = 24,
}: {
  width?: number
  height?: number
}) =>
  // prettier-ignore
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a1 1 0 1 0 2 0a1 1 0 1 0-2 0m0 7a1 1 0 1 0 2 0a1 1 0 1 0-2 0m0 7a1 1 0 1 0 2 0a1 1 0 1 0-2 0m6-14a1 1 0 1 0 2 0a1 1 0 1 0-2 0m0 7a1 1 0 1 0 2 0a1 1 0 1 0-2 0m0 7a1 1 0 1 0 2 0a1 1 0 1 0-2 0"/></svg>

const TrashIcon = ({
  width = 24,
  height = 24,
}: {
  width?: number
  height?: number
}) =>
  // prettier-ignore
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>

const PlusIcon = ({
  width = 24,
  height = 24,
}: {
  width?: number
  height?: number
}) =>
  // prettier-ignore
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0m6 0h6m-3-3v6"/></svg>

export type PaletteProps = Omit<React.ComponentProps<'div'>, 'children'>

export function Palette({className, ...props}: PaletteProps) {
  const {
    rows,
    selectedColor,
    addRow,
    deleteRow,
    updateRowField,
    updateColorValue,
    reorderRows,
    selectColor,
  } = usePaletteStore()

  const [editingField, setEditingField] = useState<{
    rowId: string
    field: 'name' | 'description' | 'value'
    colorIndex?: number
  } | null>(null)

  // Temporary input values for fields being edited
  const [tempInputValue, setTempInputValue] = useState<string>('')

  const containerRef = useRef<HTMLDivElement>(null)
  const sortableRef = useRef<Sortable | null>(null)

  useEffect(() => {
    if (containerRef.current) {
      sortableRef.current = new Sortable(containerRef.current, {
        draggable: `.${cn['palette-row']}`,
        handle: `.${cn['drag-handle']}`,
        mirror: {
          constrainDimensions: true,
        },
      })

      sortableRef.current.on('sortable:stop', (event: SortableStopEvent) => {
        const oldIndex = event.oldIndex
        const newIndex = event.newIndex

        if (oldIndex !== newIndex) {
          reorderRows(oldIndex, newIndex)
        }
      })

      return () => {
        if (sortableRef.current) {
          sortableRef.current.destroy()
        }
      }
    }
  }, [rows, reorderRows])

  const handleFieldClick = (
    rowId: string,
    field: 'name' | 'description' | 'value',
    colorIndex?: number
  ) => {
    setEditingField({ rowId, field, colorIndex })

    // Set initial temp value when starting to edit
    if (field === 'name' || field === 'description') {
      const row = rows.find((r) => r.id === rowId)
      if (row) {
        setTempInputValue(row[field])
      }
    } else if (field === 'value' && colorIndex !== undefined) {
      const row = rows.find((r) => r.id === rowId)
      if (row) {
        setTempInputValue(row.colors[colorIndex].value)
      }
    }
  }

  const handleFieldBlur = (
    rowId: string,
    field: 'name' | 'description',
    colorIndex?: number
  ) => {
    return () => {
      // Apply the update on blur with default values for empty inputs
      const finalValue = tempInputValue.trim() || getDefaultValue(field)

      if (field === 'name' || field === 'description') {
        updateRowField(rowId, field, finalValue)
      } else if (field === 'value' && colorIndex !== undefined) {
        updateColorValue(rowId, colorIndex, finalValue)
      }

      setEditingField(null)
      setTempInputValue('')
    }
  }

  const handleColorValueBlur = (rowId: string, colorIndex: number) => {
    return () => {
      // Apply the update on blur with default values for empty inputs
      const finalValue = tempInputValue.trim() || getDefaultValue('value')
      updateColorValue(rowId, colorIndex, finalValue)
      setEditingField(null)
      setTempInputValue('')
    }
  }

  const getDefaultValue = (field: 'name' | 'description' | 'value'): string => {
    switch (field) {
      case 'name':
        return 'Untitled Palette'
      case 'description':
        return 'No description'
      case 'value':
        return '0'
      default:
        return ''
    }
  }

  const handleFieldKeyDown = (
    rowId: string,
    field: 'name' | 'description',
    colorIndex?: number
  ) => {
    return (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Apply the update on Enter with default values for empty inputs
        const finalValue = tempInputValue.trim() || getDefaultValue(field)

        if (field === 'name' || field === 'description') {
          updateRowField(rowId, field, finalValue)
        } else if (field === 'value' && colorIndex !== undefined) {
          updateColorValue(rowId, colorIndex, finalValue)
        }

        setEditingField(null)
        setTempInputValue('')
      }
    }
  }

  const handleColorValueKeyDown = (rowId: string, colorIndex: number) => {
    return (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Apply the update on Enter with default values for empty inputs
        const finalValue = tempInputValue.trim() || getDefaultValue('value')
        updateColorValue(rowId, colorIndex, finalValue)
        setEditingField(null)
        setTempInputValue('')
      }
    }
  }

  return (
    <div className={clsx(className, cn['palette-container'])} {...props}>
      {rows.length > 0 && (
        <div className={cn['value-labels-row']}>
          <div className={cn['row-left-spacer']} />
          <div className={cn['value-labels']}>
            {rows[0].colors.map((colorBox, index) => {
              const isEditing =
                editingField?.field === 'value' &&
                editingField.colorIndex === index
              return (
                <input
                  type="text"
                  key={index}
                  className={cn['value-label']}
                  value={isEditing ? tempInputValue : colorBox.value}
                  onChange={(e) => setTempInputValue(e.target.value)}
                  onBlur={handleColorValueBlur(rows[0].id, index)}
                  onKeyDown={handleColorValueKeyDown(rows[0].id, index)}
                  onClick={() => handleFieldClick(rows[0].id, 'value', index)}
                  readOnly={!isEditing}
                  autoFocus={isEditing}
                />
              )
            })}
          </div>
          <div className={cn['delete-button-spacer']} />
        </div>
      )}

      <div ref={containerRef} className={cn['palette-rows']}>
        {rows.map((row) => (
          <div key={row.id} className={cn['palette-row']} data-row-id={row.id}>
            <div className={cn['row-left']}>
              <div className={cn['drag-handle']}>
                <GripVerticalIcon width={20} height={20} />
              </div>
              <div className={cn['row-info']}>
                {editingField?.rowId === row.id &&
                editingField.field === 'name' ? (
                  <input
                    type="text"
                    className={cn['row-name-input']}
                    value={tempInputValue}
                    onChange={(e) => setTempInputValue(e.target.value)}
                    onBlur={handleFieldBlur(row.id, 'name')}
                    onKeyDown={handleFieldKeyDown(row.id, 'name')}
                    autoFocus
                  />
                ) : (
                  <div
                    className={cn['row-name']}
                    onClick={() => handleFieldClick(row.id, 'name')}
                  >
                    {row.name}
                  </div>
                )}
                {editingField?.rowId === row.id &&
                editingField.field === 'description' ? (
                  <input
                    type="text"
                    className={cn['row-description-input']}
                    value={tempInputValue}
                    onChange={(e) => setTempInputValue(e.target.value)}
                    onBlur={handleFieldBlur(row.id, 'description')}
                    onKeyDown={handleFieldKeyDown(row.id, 'description')}
                    autoFocus
                  />
                ) : (
                  <div
                    className={cn['row-description']}
                    onClick={() => handleFieldClick(row.id, 'description')}
                  >
                    {row.description}
                  </div>
                )}
              </div>
            </div>

            <div className={cn['row-colors']}>
              {row.colors.map((colorBox, index) => {
                const isSelected =
                  selectedColor?.rowId === row.id &&
                  selectedColor?.colorIndex === index
                return (
                  <div
                    key={index}
                    className={clsx(cn['color-box'], {
                      [cn['color-box-selected']]: isSelected,
                    })}
                    style={{ backgroundColor: colorBox.color }}
                    onClick={() => selectColor(row.id, index)}
                    aria-label={`Select color ${colorBox.value}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        selectColor(row.id, index)
                      }
                    }}
                  />
                )
              })}
            </div>

            <button
              className={cn['delete-button']}
              onClick={() => deleteRow(row.id)}
              aria-label="Delete row"
            >
              <TrashIcon width={20} height={20} />
            </button>
          </div>
        ))}
      </div>

      <button
        className={cn['add-button']}
        onClick={addRow}
        aria-label="Add row"
      >
        <PlusIcon width={24} height={24} />
      </button>
    </div>
  )
}
