import React, { useState, useEffect, useRef } from 'react'
import Sortable from 'sortablejs'
import { usePaletteStore } from './state'
import type { PaletteRow as PaletteRowType } from './state'
import cn from './Palette.module.css'
import { clsx } from 'clsx'

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

// PaletteValues Component - Displays the value labels for each color column
interface PaletteValuesProps {
  values: string[]
  editingIndex: number | null
  tempValue: string
  onStartEdit: (index: number, currentValue: string) => void
  onChangeValue: (value: string) => void
  onSaveValue: (index: number, value: string) => void
  onCancelEdit: () => void
}

function PaletteValues({
  values,
  editingIndex,
  tempValue,
  onStartEdit,
  onChangeValue,
  onSaveValue,
  onCancelEdit,
}: PaletteValuesProps) {
  return (
    <div className={cn['value-labels-row']}>
      <div className={cn['row-left-spacer']} />
      <div className={cn['value-labels']}>
        {values.map((value, index) => {
          const isEditing = editingIndex === index
          return (
            <input
              type="text"
              key={index}
              className={cn['value-label']}
              value={isEditing ? tempValue : value}
              onChange={(e) => onChangeValue(e.target.value)}
              onBlur={() => {
                if (isEditing) {
                  onSaveValue(index, tempValue.trim() || '500')
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSaveValue(index, tempValue.trim() || '500')
                } else if (e.key === 'Escape') {
                  onCancelEdit()
                }
              }}
              onClick={() => onStartEdit(index, value)}
              readOnly={!isEditing}
              autoFocus={isEditing}
            />
          )
        })}
      </div>
      <div className={cn['delete-button-spacer']} />
    </div>
  )
}

// PaletteMeta Component - Displays editable name and description for a row
interface PaletteMetaProps {
  name: string
  description: string
  isEditingName: boolean
  isEditingDescription: boolean
  tempName: string
  tempDescription: string
  onStartEditName: () => void
  onStartEditDescription: () => void
  onChangeName: (value: string) => void
  onChangeDescription: (value: string) => void
  onSaveName: (value: string) => void
  onSaveDescription: (value: string) => void
}

function PaletteMeta({
  name,
  description,
  isEditingName,
  isEditingDescription,
  tempName,
  tempDescription,
  onStartEditName,
  onStartEditDescription,
  onChangeName,
  onChangeDescription,
  onSaveName,
  onSaveDescription,
}: PaletteMetaProps) {
  return (
    <div className={cn['row-info']}>
      {isEditingName ? (
        <input
          type="text"
          className={cn['row-name-input']}
          value={tempName}
          onChange={(e) => onChangeName(e.target.value)}
          onBlur={() => onSaveName(tempName.trim() || 'Untitled')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSaveName(tempName.trim() || 'Untitled')
            }
          }}
          autoFocus
        />
      ) : (
        <div className={cn['row-name']} onClick={onStartEditName}>
          {name}
        </div>
      )}
      {isEditingDescription ? (
        <input
          type="text"
          className={cn['row-description-input']}
          value={tempDescription}
          onChange={(e) => onChangeDescription(e.target.value)}
          onBlur={() => onSaveDescription(tempDescription.trim() || 'Description')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSaveDescription(tempDescription.trim() || 'Description')
            }
          }}
          autoFocus
        />
      ) : (
        <div className={cn['row-description']} onClick={onStartEditDescription}>
          {description}
        </div>
      )}
    </div>
  )
}

// PaletteRow Component - A single palette row with colors
interface PaletteRowProps {
  row: PaletteRowType
  selectedColor: string | null
  onSelectColor: (colorId: string) => void
  onDeleteRow: (id: string) => void
  onUpdateName: (id: string, newName: string) => void
  onUpdateDescription: (id: string, newDescription: string) => void
  onReorderColors: (rowId: string, oldIndex: number, newIndex: number) => void
}

function PaletteRow({
  row,
  selectedColor,
  onSelectColor,
  onDeleteRow,
  onUpdateName,
  onUpdateDescription,
  onReorderColors,
}: PaletteRowProps) {
  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null)
  const [tempName, setTempName] = useState('')
  const [tempDescription, setTempDescription] = useState('')
  const colorsContainerRef = useRef<HTMLDivElement>(null)
  const colorsSortableRef = useRef<Sortable | null>(null)
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null)
  const isDraggingRef = useRef(false)

  const handleStartEditName = () => {
    setEditingField('name')
    setTempName(row.name)
  }

  const handleStartEditDescription = () => {
    setEditingField('description')
    setTempDescription(row.description)
  }

  const handleSaveName = (value: string) => {
    onUpdateName(row.id, value)
    setEditingField(null)
    setTempName('')
  }

  const handleSaveDescription = (value: string) => {
    onUpdateDescription(row.id, value)
    setEditingField(null)
    setTempDescription('')
  }

  // Handle mouse down to track drag start position
  const handleColorMouseDown = (e: React.MouseEvent) => {
    if (isDraggingRef.current) return
    dragStartPosRef.current = { x: e.clientX, y: e.clientY }
  }

  // Handle click - only select if not dragging
  const handleColorClick = (colorId: string) => {
    if (isDraggingRef.current) return
    onSelectColor(colorId)
  }

  // Sortable functionality for colors
  useEffect(() => {
    if (colorsContainerRef.current) {
      colorsSortableRef.current = Sortable.create(colorsContainerRef.current, {
        animation: 150,
        draggable: `.${cn['color-box']}`,
        direction: 'horizontal',
        onStart: () => {
          isDraggingRef.current = true
        },
        onEnd: (evt) => {
          const oldIndex = evt.oldIndex
          const newIndex = evt.newIndex

          if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
            // Revert the DOM change that SortableJS made
            if (evt.item.parentNode && evt.from === evt.to) {
              const items = Array.from(evt.from.children)
              const actualOldIndex = items.indexOf(evt.item)

              // Move the element back to its original position in the DOM
              if (actualOldIndex !== oldIndex) {
                if (oldIndex < items.length) {
                  evt.from.insertBefore(evt.item, items[oldIndex])
                } else {
                  evt.from.appendChild(evt.item)
                }
              }
            }

            // Let React handle the reordering via state
            onReorderColors(row.id, oldIndex, newIndex)
            // Note: No need to update selectedColor since it's now based on color ID
            // which remains constant during reordering
          }

          // Reset dragging state after a short delay to prevent click from firing
          setTimeout(() => {
            isDraggingRef.current = false
            dragStartPosRef.current = null
          }, 100)
        },
      })

      return () => {
        if (colorsSortableRef.current) {
          colorsSortableRef.current.destroy()
        }
      }
    }
  }, [row.id, row.colors, onReorderColors])

  return (
    <div className={cn['palette-row']} data-row-name={row.name}>
      <div className={cn['row-left']}>
        <div className={cn['drag-handle']}>
          <GripVerticalIcon width={20} height={20} />
        </div>
        <PaletteMeta
          name={row.name}
          description={row.description}
          isEditingName={editingField === 'name'}
          isEditingDescription={editingField === 'description'}
          tempName={tempName}
          tempDescription={tempDescription}
          onStartEditName={handleStartEditName}
          onStartEditDescription={handleStartEditDescription}
          onChangeName={setTempName}
          onChangeDescription={setTempDescription}
          onSaveName={handleSaveName}
          onSaveDescription={handleSaveDescription}
        />
      </div>

      <div ref={colorsContainerRef} className={cn['row-colors']}>
        {row.colors.map((color) => {
          const isSelected = selectedColor === color.id
          return (
            <div
              key={color.id}
              className={clsx(cn['color-box'], {
                [cn['color-box-selected']]: isSelected,
              })}
              style={{ backgroundColor: color.data }}
              onMouseDown={handleColorMouseDown}
              onClick={() => handleColorClick(color.id)}
              aria-label={`Select color ${color.data}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectColor(color.id)
                }
              }}
            />
          )
        })}
      </div>

      <button
        className={cn['delete-button']}
        onClick={() => onDeleteRow(row.id)}
        aria-label="Delete row"
      >
        <TrashIcon width={20} height={20} />
      </button>
    </div>
  )
}

// Main Palette Component
export type PaletteProps = Omit<React.ComponentProps<'div'>, 'children'>

export function Palette({ className, ...props }: PaletteProps) {
  const {
    rows,
    selectedColor,
    values,
    addRow,
    deleteRow,
    reorderRows,
    reorderColors,
    updateValues,
    selectColor,
    updateRowName,
    updateRowDescription,
  } = usePaletteStore()

  const [editingValueIndex, setEditingValueIndex] = useState<number | null>(null)
  const [tempValueInput, setTempValueInput] = useState<string>('')

  const containerRef = useRef<HTMLDivElement>(null)
  const sortableRef = useRef<Sortable | null>(null)

  // Sortable functionality
  useEffect(() => {
    if (containerRef.current) {
      sortableRef.current = Sortable.create(containerRef.current, {
        animation: 150,
        handle: `.${cn['drag-handle']}`,
        draggable: `.${cn['palette-row']}`,
        onEnd: (evt) => {
          const oldIndex = evt.oldIndex
          const newIndex = evt.newIndex

          if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
            // Revert the DOM change that SortableJS made
            if (evt.item.parentNode && evt.from === evt.to) {
              const items = Array.from(evt.from.children)
              const actualOldIndex = items.indexOf(evt.item)

              // Move the element back to its original position in the DOM
              if (actualOldIndex !== oldIndex) {
                if (oldIndex < items.length) {
                  evt.from.insertBefore(evt.item, items[oldIndex])
                } else {
                  evt.from.appendChild(evt.item)
                }
              }
            }

            // Let React handle the reordering via state
            reorderRows(oldIndex, newIndex)
          }
        },
      })

      return () => {
        if (sortableRef.current) {
          sortableRef.current.destroy()
        }
      }
    }
  }, [rows, reorderRows])

  const handleStartEditValue = (index: number, currentValue: string) => {
    setEditingValueIndex(index)
    setTempValueInput(currentValue)
  }

  const handleSaveValue = (index: number, value: string) => {
    const newValues = [...values.values]
    newValues[index] = value
    updateValues({ values: newValues })
    setEditingValueIndex(null)
    setTempValueInput('')
  }

  const handleCancelEditValue = () => {
    setEditingValueIndex(null)
    setTempValueInput('')
  }

  return (
    <div className={clsx(className, cn['palette-container'])} {...props}>
      {rows.length > 0 && (
        <PaletteValues
          values={values.values}
          editingIndex={editingValueIndex}
          tempValue={tempValueInput}
          onStartEdit={handleStartEditValue}
          onChangeValue={setTempValueInput}
          onSaveValue={handleSaveValue}
          onCancelEdit={handleCancelEditValue}
        />
      )}

      <div ref={containerRef} className={cn['palette-rows']}>
        {rows.map((row) => (
          <PaletteRow
            key={row.id}
            row={row}
            selectedColor={selectedColor}
            onSelectColor={selectColor}
            onDeleteRow={deleteRow}
            onUpdateName={updateRowName}
            onUpdateDescription={updateRowDescription}
            onReorderColors={reorderColors}
          />
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
