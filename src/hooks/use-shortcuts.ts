'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Tool } from '@/redux/slice/shapes'

export interface ShortcutAction {
  id: string
  description: string
  category: string
  defaultKeys: string[]
  action: 'tool' | 'navigation' | 'action' | 'help'
  tool?: Tool
}

export interface CustomShortcuts {
  [actionId: string]: string[]
}

const STORAGE_KEY = 'canvas-keyboard-shortcuts'

// Default shortcuts configuration
export const defaultShortcuts: ShortcutAction[] = [
  // Tools
  { id: 'tool-select', description: 'Select tool', category: 'Tools', defaultKeys: ['V'], action: 'tool', tool: 'select' },
  { id: 'tool-frame', description: 'Frame tool', category: 'Tools', defaultKeys: ['F'], action: 'tool', tool: 'frame' },
  { id: 'tool-rect', description: 'Rectangle tool', category: 'Tools', defaultKeys: ['R'], action: 'tool', tool: 'rect' },
  { id: 'tool-ellipse', description: 'Ellipse tool', category: 'Tools', defaultKeys: ['E'], action: 'tool', tool: 'ellipse' },
  { id: 'tool-freedraw', description: 'Free Draw tool', category: 'Tools', defaultKeys: ['P'], action: 'tool', tool: 'freedraw' },
  { id: 'tool-arrow', description: 'Arrow tool', category: 'Tools', defaultKeys: ['A'], action: 'tool', tool: 'arrow' },
  { id: 'tool-line', description: 'Line tool', category: 'Tools', defaultKeys: ['L'], action: 'tool', tool: 'line' },
  { id: 'tool-text', description: 'Text tool', category: 'Tools', defaultKeys: ['T'], action: 'tool', tool: 'text' },
  { id: 'tool-eraser', description: 'Eraser tool', category: 'Tools', defaultKeys: ['X'], action: 'tool', tool: 'eraser' },
  
  // Navigation
  { id: 'pan-hold', description: 'Pan canvas (hold)', category: 'Navigation', defaultKeys: ['Shift'], action: 'navigation' },
  { id: 'zoom-in', description: 'Zoom in', category: 'Navigation', defaultKeys: ['Ctrl', '+'], action: 'navigation' },
  { id: 'zoom-out', description: 'Zoom out', category: 'Navigation', defaultKeys: ['Ctrl', '-'], action: 'navigation' },
  { id: 'zoom-reset', description: 'Reset zoom to 100%', category: 'Navigation', defaultKeys: ['Ctrl', '0'], action: 'navigation' },
  
  // Actions
  { id: 'delete', description: 'Delete selected shapes', category: 'Actions', defaultKeys: ['Delete'], action: 'action' },
  { id: 'backspace', description: 'Delete selected shapes', category: 'Actions', defaultKeys: ['Backspace'], action: 'action' },
  { id: 'clear-selection', description: 'Clear selection', category: 'Actions', defaultKeys: ['Escape'], action: 'action' },
  
  // Help
  { id: 'show-shortcuts', description: 'Show keyboard shortcuts', category: 'Help', defaultKeys: ['?'], action: 'help' },
]

export const useShortcuts = () => {
  const [customShortcuts, setCustomShortcuts] = useState<CustomShortcuts>({})

  // Load shortcuts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setCustomShortcuts(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load shortcuts from localStorage:', error)
    }
  }, [])

  // Save shortcuts to localStorage
  const saveShortcuts = useCallback((shortcuts: CustomShortcuts) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts))
      setCustomShortcuts(shortcuts)
    } catch (error) {
      console.error('Failed to save shortcuts to localStorage:', error)
    }
  }, [])

  // Get the actual keys for an action (custom or default)
  const getKeysForAction = useCallback((actionId: string): string[] => {
    return customShortcuts[actionId] || defaultShortcuts.find(s => s.id === actionId)?.defaultKeys || []
  }, [customShortcuts])

  // Get action ID from key press
  const getActionFromKeys = useCallback((key: string, modifiers: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }): string | null => {
    // Special case for Shift (pan hold) - must be checked first
    if (key === 'Shift' && modifiers.shift) {
      return 'pan-hold'
    }

    for (const shortcut of defaultShortcuts) {
      const keys = getKeysForAction(shortcut.id)
      
      // Skip pan-hold as it's handled above
      if (shortcut.id === 'pan-hold') continue
      
      // Check if this is a single key shortcut
      if (keys.length === 1) {
        const shortcutKey = keys[0]
        const pressedKey = key
        
        // Match the key (case-insensitive for letters, exact match for special keys)
        const keyMatches = shortcutKey.toLowerCase() === pressedKey.toLowerCase() ||
                          (shortcutKey === 'Delete' && pressedKey === 'Delete') ||
                          (shortcutKey === 'Backspace' && pressedKey === 'Backspace') ||
                          (shortcutKey === 'Escape' && pressedKey === 'Escape') ||
                          (shortcutKey === '?' && pressedKey === '?') ||
                          (shortcutKey === 'Shift' && pressedKey === 'Shift')
        
        if (keyMatches) {
          // For single key shortcuts, no modifiers should be pressed (except Shift for pan-hold which is handled above)
          if (!modifiers.ctrl && !modifiers.meta && !modifiers.alt && (!modifiers.shift || shortcut.id === 'pan-hold')) {
            return shortcut.id
          }
        }
      }
      
      // Check if this is a modifier + key shortcut
      if (keys.length === 2) {
        const [modifier, keyChar] = keys
        const hasModifier = (modifier === 'Ctrl' && (modifiers.ctrl || modifiers.meta)) || 
                           (modifier === 'Meta' && modifiers.meta) ||
                           (modifier === 'Shift' && modifiers.shift) ||
                           (modifier === 'Alt' && modifiers.alt)
        
        const keyMatches = keyChar.toLowerCase() === key.toLowerCase() ||
                         (keyChar === '+' && (key === '+' || key === '=')) ||
                         (keyChar === '-' && (key === '-' || key === '_')) ||
                         (keyChar === '0' && key === '0')
        
        if (hasModifier && keyMatches) {
          return shortcut.id
        }
      }
    }
    return null
  }, [getKeysForAction])

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setCustomShortcuts({})
  }, [])

  return {
    shortcuts: defaultShortcuts,
    customShortcuts,
    getKeysForAction,
    getActionFromKeys,
    saveShortcuts,
    resetToDefaults,
  }
}

