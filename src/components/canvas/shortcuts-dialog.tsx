'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useShortcuts } from '@/hooks/use-shortcuts'
import { Edit2, Save, X, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

const formatKey = (key: string): string => {
  const keyMap: Record<string, string> = {
    'Shift': '⇧',
    'Ctrl': '⌃',
    'Alt': '⌥',
    'Meta': '⌘',
    'Delete': '⌫',
    'Backspace': '⌫',
    'Escape': 'Esc',
    'Enter': '↵',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
  }
  return keyMap[key] || key.toUpperCase()
}

const parseKeyString = (keyString: string): string[] => {
  if (!keyString.trim()) return []
  return keyString.split('+').map(k => k.trim()).filter(Boolean)
}

interface ShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ShortcutsDialog = ({ open, onOpenChange }: ShortcutsDialogProps) => {
  const { shortcuts, getKeysForAction, saveShortcuts, resetToDefaults } = useShortcuts()
  const [isEditing, setIsEditing] = useState(false)
  const [editingShortcuts, setEditingShortcuts] = useState<Record<string, string>>({})
  const [capturingKey, setCapturingKey] = useState<string | null>(null)

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)))

  // Initialize editing shortcuts when entering edit mode
  useEffect(() => {
    if (isEditing) {
      const initial: Record<string, string> = {}
      shortcuts.forEach(shortcut => {
        const keys = getKeysForAction(shortcut.id)
        initial[shortcut.id] = keys.join(' + ')
      })
      setEditingShortcuts(initial)
    }
  }, [isEditing, shortcuts, getKeysForAction])

  const handleStartEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingShortcuts({})
    setCapturingKey(null)
  }

  const handleSave = () => {
    const newCustomShortcuts: Record<string, string[]> = {}
    
    // Validate and convert editing shortcuts
    for (const [actionId, keyString] of Object.entries(editingShortcuts)) {
      const keys = parseKeyString(keyString)
      if (keys.length > 0) {
        newCustomShortcuts[actionId] = keys
      }
    }

    // Check for conflicts
    const keyMap = new Map<string, string>()
    for (const [actionId, keys] of Object.entries(newCustomShortcuts)) {
      const keyString = keys.join('+').toLowerCase()
      if (keyMap.has(keyString) && keyMap.get(keyString) !== actionId) {
        toast.error(`Conflict: Multiple actions assigned to the same key combination`)
        return
      }
      keyMap.set(keyString, actionId)
    }

    saveShortcuts(newCustomShortcuts)
    setIsEditing(false)
    setCapturingKey(null)
    toast.success('Shortcuts saved successfully!')
  }

  const handleReset = () => {
    resetToDefaults()
    setIsEditing(false)
    setEditingShortcuts({})
    toast.success('Shortcuts reset to defaults')
  }

  const handleKeyCapture = (actionId: string) => {
    setCapturingKey(actionId)
  }

  const handleKeyInput = (actionId: string, value: string) => {
    setEditingShortcuts(prev => ({
      ...prev,
      [actionId]: value
    }))
  }

  // Handle keyboard capture
  useEffect(() => {
    if (!capturingKey) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const keys: string[] = []
      
      // Add modifiers first
      if (e.metaKey) keys.push('Meta')
      else if (e.ctrlKey) keys.push('Ctrl')
      if (e.shiftKey && !keys.includes('Shift')) keys.push('Shift')
      if (e.altKey) keys.push('Alt')
      
      // Add the main key
      if (e.key === 'Delete' || e.key === 'Backspace' || e.key === 'Escape' || e.key === 'Enter') {
        keys.push(e.key)
      } else if (e.key.startsWith('Arrow')) {
        keys.push(e.key)
      } else if (e.key.length === 1) {
        // Single character key
        keys.push(e.key)
      } else if (e.key === '+' || e.key === '=') {
        keys.push('+')
      } else if (e.key === '-' || e.key === '_') {
        keys.push('-')
      } else if (e.key === '0') {
        keys.push('0')
      } else if (e.key === '?') {
        keys.push('?')
      }

      // Only save if we have at least one key
      if (keys.length > 0) {
        setEditingShortcuts(prev => ({
          ...prev,
          [capturingKey]: keys.join(' + ')
        }))
        setCapturingKey(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [capturingKey])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto backdrop-blur-xl bg-black/90 border border-white/[0.12]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white text-2xl">Keyboard Shortcuts</DialogTitle>
              <DialogDescription className="text-white/70">
                {isEditing 
                  ? 'Click on a key combination to change it, or type a new combination'
                  : 'Use these shortcuts to work faster in the canvas'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartEdit}
                    className="backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] text-white hover:bg-white/[0.12]"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] text-white hover:bg-white/[0.12]"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] text-white hover:bg-white/[0.12]"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    className="backdrop-blur-xl bg-white/[0.12] border border-white/[0.16] text-white hover:bg-white/[0.16]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {categories.map((category) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
                {category}
              </h3>
              <div className="space-y-1.5">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut) => {
                    const keys = isEditing && editingShortcuts[shortcut.id]
                      ? parseKeyString(editingShortcuts[shortcut.id])
                      : getKeysForAction(shortcut.id)
                    const isCapturing = capturingKey === shortcut.id

                    return (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.05] transition-colors"
                      >
                        <span className="text-sm text-white/80">{shortcut.description}</span>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingShortcuts[shortcut.id] || ''}
                                onChange={(e) => handleKeyInput(shortcut.id, e.target.value)}
                                onFocus={() => handleKeyCapture(shortcut.id)}
                                placeholder="Press keys..."
                                className="w-32 h-8 text-xs bg-white/[0.12] border-white/[0.16] text-white placeholder:text-white/50"
                              />
                              {isCapturing && (
                                <span className="text-xs text-white/50 animate-pulse">Press keys...</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {keys.map((key, keyIdx) => (
                                <React.Fragment key={keyIdx}>
                                  <kbd className="px-2 py-1 text-xs font-medium text-white/90 bg-white/[0.12] border border-white/[0.16] rounded backdrop-blur-sm">
                                    {formatKey(key)}
                                  </kbd>
                                  {keyIdx < keys.length - 1 && (
                                    <span className="text-white/40 text-xs">+</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
