'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { SplitPane } from './SplitPane'
import { cn } from '@/lib/utils'
import { 
  Braces, 
  Code, 
  Table as TableIcon, 
  Network, 
  Copy, 
  Download, 
  Upload,
  Trash2,
  Play,
  ArrowRightLeft,
  FileText,
  Minimize2,
  CheckCircle2,
  Wand2,
  XCircle,
  Search,
  PanelRightClose,
  PanelRightOpen,
  Quote,
  GitCompare,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'
import { 
  detectFormat, 
  formatJson, 
  formatXml, 
  formatYaml, 
  compressJson, 
  validateJson,
  convertFormat,
  tryFixJson,
  smartExtract,
  getJsonStats,
  escapeString,
  unescapeString
} from '@/lib/json-utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CommandPalette, CommandIcons } from '@/components/CommandPalette/CommandPalette'
import type { editor } from 'monaco-editor'

import { TreeView } from './Views/TreeView'
import { TableView } from './Views/TableView'
import { GraphView } from './Views/GraphView'

// Dynamic import for Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false })
const DiffEditor = dynamic(() => import('@monaco-editor/react').then(mod => mod.DiffEditor), { ssr: false })

type FormatType = 'json' | 'xml' | 'yaml'

// Helper function to format file size in human-readable format
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = bytes / Math.pow(k, i)
  // Show 1 decimal for KB and above, no decimal for bytes
  return i === 0 ? `${size} ${units[i]}` : `${size.toFixed(1)} ${units[i]}`
}

export default function Workbench() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'code' | 'tree' | 'table' | 'graph' | 'diff'>('code')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [format, setFormat] = useState<FormatType>('json')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [outputCollapsed, setOutputCollapsed] = useState(true)  // Default collapsed
  const [autoMode, setAutoMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const outputEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  
  const { theme, toggleTheme } = useTheme()
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'vs'

  // Calculate stats
  const stats = format === 'json' && output ? getJsonStats(output) : null

  // Open command palette
  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true)
  }, [])

  // Trigger search in editor
  const triggerSearch = useCallback((editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>) => {
    if (editorRef.current) {
      editorRef.current.focus()
      editorRef.current.trigger('keyboard', 'actions.find', null)
    }
  }, [])

  // Register keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openCommandPalette()
      }
      // Cmd/Ctrl + S: Save/Download
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleDownload()
      }
      // Cmd/Ctrl + Shift + F: Format
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault()
        handleFormatAction()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [input, format])

  // Auto format function
  const doAutoFormat = useCallback((value: string) => {
    if (!value.trim()) {
      setOutput('')
      setError(null)
      return
    }

    let result
    if (format === 'json') {
      result = formatJson(value)
    } else if (format === 'xml') {
      result = formatXml(value)
    } else if (format === 'yaml') {
      result = formatYaml(value)
    }

    if (result && result.success && result.result) {
      if (outputCollapsed) {
        setInput(result.result)
      } else {
        setOutput(result.result)
      }
      setError(null)
    } else {
      // Show raw input in output when format fails
      if (!outputCollapsed) {
        setOutput(value)
      }
      setError(result?.error || null)
    }
  }, [format, outputCollapsed])

  // Auto-detect format on input change (if empty or first paste)
  const handleInputChange = useCallback((value: string | undefined) => {
    const newVal = value || ''
    setInput(newVal)
    
    // Reset output if input is cleared
    if (!newVal.trim()) {
      setOutput('')
      setError(null)
      return
    }

    // Auto-detect format if not explicitly set (or simple heuristic)
    const detected = detectFormat(newVal)
    if (detected && detected !== format) {
      setFormat(detected)
    }

    // Auto mode: format on every change
    if (autoMode) {
      doAutoFormat(newVal)
    }
  }, [format, autoMode, doAutoFormat])

  // Smart Paste Logic
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text')
    
    // Try smart extraction for cURL, Base64, etc.
    const extracted = smartExtract(text)
    if (extracted.success && extracted.result && extracted.detectedType && extracted.detectedType !== 'JSON') {
      e.preventDefault()
      setInput(extracted.result)
      setOutput(extracted.result)
      setFormat('json')
      setSuccess(`Detected and extracted: ${extracted.detectedType}`)
      setTimeout(() => setSuccess(null), 3000)
    }
  }, [])

  // Core Action: Format / Run
  const handleFormatAction = useCallback(() => {
    if (!input.trim()) return

    let result
    if (format === 'json') {
      result = formatJson(input)
    } else if (format === 'xml') {
      result = formatXml(input)
    } else if (format === 'yaml') {
      result = formatYaml(input)
    }

    if (result && result.success && result.result) {
      setInput(result.result)
      if (!outputCollapsed) {
        setOutput(result.result)
      }
      setError(null)
      setSuccess('Formatted successfully')
      setTimeout(() => setSuccess(null), 2000)
    } else {
      setError(result?.error || 'Format failed')
      setSuccess(null)
    }
  }, [input, format, outputCollapsed])

  // Try Fix JSON
  const handleTryFix = useCallback(() => {
    if (format !== 'json') return
    
    const result = tryFixJson(input)
    if (result.success && result.result) {
      setInput(result.result)
      if (!outputCollapsed) {
        setOutput(result.result)
      }
      setError(null)
      const fixMsg = result.fixes?.length ? `Fixed: ${result.fixes.join(', ')}` : 'Fixed successfully'
      setSuccess(fixMsg)
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Could not fix JSON')
    }
  }, [input, format, outputCollapsed])

  const handleCompress = useCallback(() => {
    if (format !== 'json') return
    const result = compressJson(input)
    if (result.success && result.result) {
      setInput(result.result)
      if (!outputCollapsed) {
        setOutput(result.result)
      }
      setSuccess('Compressed successfully')
      setTimeout(() => setSuccess(null), 2000)
    } else {
      setError(result.error || 'Compression failed')
    }
  }, [input, format, outputCollapsed])

  const handleValidate = useCallback(() => {
    if (format === 'json') {
        const result = validateJson(input)
        if (result.valid) {
            setSuccess('Valid JSON ✓')
            setError(null)
        } else {
            setError(result.error || 'Invalid JSON')
            setSuccess(null)
        }
        setTimeout(() => setSuccess(null), 2000)
    } else {
        handleFormatAction()
    }
  }, [input, format, handleFormatAction])

  const handleConvert = useCallback((targetFormat: FormatType) => {
    if (!input.trim()) return
    
    const result = convertFormat(input, format, targetFormat)
    if (result.success && result.result) {
        setInput(result.result)
        if (!outputCollapsed) {
          setOutput(result.result)
        }
        setFormat(targetFormat)
        setSuccess(`Converted to ${targetFormat.toUpperCase()}`)
        setError(null)
    } else {
        setError(result.error || 'Conversion failed')
    }
    setTimeout(() => setSuccess(null), 2000)
  }, [input, format, outputCollapsed])

  // Escape string
  const handleEscape = useCallback(() => {
    if (!input.trim()) return
    
    const result = escapeString(input)
    if (result.success && result.result) {
      if (outputCollapsed) {
        setInput(result.result)
      } else {
        setOutput(result.result)
      }
      setSuccess('Escaped successfully')
      setError(null)
    } else {
      setError(result.error || 'Escape failed')
    }
    setTimeout(() => setSuccess(null), 2000)
  }, [input, outputCollapsed])

  // Unescape string
  const handleUnescape = useCallback(() => {
    if (!input.trim()) return
    
    const result = unescapeString(input)
    if (result.success && result.result) {
      if (outputCollapsed) {
        setInput(result.result)
      } else {
        setOutput(result.result)
      }
      setSuccess('Unescaped successfully')
      setError(null)
    } else {
      setError(result.error || 'Unescape failed')
    }
    setTimeout(() => setSuccess(null), 2000)
  }, [input, outputCollapsed])

  // Toggle auto mode
  const toggleAutoMode = useCallback(() => {
    setAutoMode(prev => {
      const newValue = !prev
      if (newValue && input.trim()) {
        // Immediately format when enabling auto mode
        setTimeout(() => doAutoFormat(input), 0)
      }
      return newValue
    })
  }, [input, doAutoFormat])

  // File Import
  const handleFileImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setInput(content)
      
      // Auto-detect format from file extension
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'json') setFormat('json')
      else if (ext === 'xml') setFormat('xml')
      else if (ext === 'yaml' || ext === 'yml') setFormat('yaml')
      else {
        const detected = detectFormat(content)
        if (detected) setFormat(detected)
      }
      
      setSuccess(`Loaded: ${file.name}`)
      setTimeout(() => setSuccess(null), 2000)
    }
    reader.readAsText(file)
    
    // Reset file input
    e.target.value = ''
  }, [])

  // File Download
  const handleDownload = useCallback(() => {
    if (!output) return
    
    const ext = format === 'json' ? 'json' : format === 'xml' ? 'xml' : 'yaml'
    const mimeType = format === 'json' ? 'application/json' : format === 'xml' ? 'application/xml' : 'text/yaml'
    
    const blob = new Blob([output], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `data.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setSuccess('Downloaded')
    setTimeout(() => setSuccess(null), 2000)
  }, [output, format])

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output)
    setSuccess('Copied to clipboard')
    setTimeout(() => setSuccess(null), 2000)
  }, [output])

  // Clear input
  const handleClear = useCallback(() => {
    setInput('')
    setOutput('')
    setError(null)
    setSuccess(null)
  }, [])

  // Command Palette commands
  const commands = [
    { id: 'format', label: 'Format', description: 'Format current document', icon: CommandIcons.format, shortcut: '⇧⌘F', category: 'Actions', action: handleFormatAction },
    { id: 'compress', label: 'Compress JSON', description: 'Minify JSON output', icon: CommandIcons.compress, category: 'Actions', action: handleCompress },
    { id: 'validate', label: 'Validate', description: 'Check syntax validity', icon: CommandIcons.validate, category: 'Actions', action: handleValidate },
    { id: 'fix', label: 'Try Fix JSON', description: 'Auto-fix common JSON errors', icon: CommandIcons.fix, category: 'Actions', action: handleTryFix },
    { id: 'clear', label: 'Clear', description: 'Clear all content', icon: CommandIcons.clear, category: 'Actions', action: handleClear },
    { id: 'copy', label: 'Copy Output', description: 'Copy formatted output to clipboard', icon: CommandIcons.copy, category: 'Actions', action: handleCopy },
    { id: 'download', label: 'Download', description: 'Save to file', icon: CommandIcons.download, shortcut: '⌘S', category: 'Actions', action: handleDownload },
    { id: 'upload', label: 'Import File', description: 'Load from local file', icon: CommandIcons.upload, category: 'Actions', action: handleFileImport },
    { id: 'to-json', label: 'Convert to JSON', icon: CommandIcons.json, category: 'Convert', action: () => handleConvert('json') },
    { id: 'to-yaml', label: 'Convert to YAML', icon: CommandIcons.yaml, category: 'Convert', action: () => handleConvert('yaml') },
    { id: 'to-xml', label: 'Convert to XML', icon: CommandIcons.xml, category: 'Convert', action: () => handleConvert('xml') },
    { id: 'view-code', label: 'Code View', icon: <Code className="h-4 w-4" />, category: 'View', action: () => setMode('code') },
    { id: 'view-tree', label: 'Tree View', icon: <Network className="h-4 w-4" />, category: 'View', action: () => setMode('tree') },
    { id: 'view-table', label: 'Table View', icon: <TableIcon className="h-4 w-4" />, category: 'View', action: () => setMode('table') },
    { id: 'view-graph', label: 'Graph View', icon: <ArrowRightLeft className="h-4 w-4" />, category: 'View', action: () => setMode('graph') },
    { id: 'toggle-theme', label: theme === 'dark' ? 'Light Mode' : 'Dark Mode', icon: theme === 'dark' ? CommandIcons.lightMode : CommandIcons.darkMode, category: 'Settings', action: toggleTheme },
  ]

  // Sync Output with Input (only when output panel is expanded)
  useEffect(() => {
    if (outputCollapsed) return  // Don't sync when collapsed
    
    if (input && !output) {
         try {
            if (format === 'json') {
                const parsed = JSON.parse(input)
                setOutput(JSON.stringify(parsed, null, 2))
            } else {
                setOutput(input)
            }
         } catch {
             setOutput(input)
         }
    } else if (!input) {
        setOutput('')
    }
  }, [input, output, format, outputCollapsed])

  return (
    <TooltipProvider delayDuration={300}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.xml,.yaml,.yml,.txt,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commands}
      />

      <div className="flex flex-col h-full bg-background text-foreground">
        {/* Main Workspace */}
        <div className="flex-1 overflow-hidden flex">
          {outputCollapsed ? (
            // When collapsed, use simple flex layout
            <>
              {/* Left Pane: Input (full width minus collapsed bar) */}
              <div className="flex-1 flex flex-col h-full border-r border-border">
                {/* Left Toolbar */}
                <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30 h-10 select-none">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-2">
                    <span className="flex items-center gap-1">
                      {format === 'json' && <Braces className="w-3.5 h-3.5" />}
                      {format === 'xml' && <Code className="w-3.5 h-3.5" />}
                      {format === 'yaml' && <FileText className="w-3.5 h-3.5" />}
                      Input
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 bg-muted hover:bg-muted/80">
                              {format.toUpperCase()}
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => setFormat('json')}>JSON</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setFormat('xml')}>XML</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setFormat('yaml')}>YAML</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFileImport}>
                              <Upload className="h-4 w-4" />
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>Import File</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => triggerSearch(inputEditorRef)}>
                              <Search className="h-4 w-4" />
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>Search (⌘F)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClear}>
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>Clear</TooltipContent>
                    </Tooltip>
                    <div className="w-px h-4 bg-border mx-1" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFormatAction}>
                              <Play className="h-4 w-4" />
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>Format (⇧⌘F)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleTryFix} disabled={format !== 'json'}>
                              <Wand2 className="h-4 w-4" />
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>Try Fix JSON</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCompress} disabled={format !== 'json'}>
                              <Minimize2 className="h-4 w-4" />
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>Compress</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleValidate}>
                              <CheckCircle2 className="h-4 w-4" />
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>Validate</TooltipContent>
                    </Tooltip>
                    <div className="w-px h-4 bg-border mx-1" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleConvert('json')} disabled={format === 'json'}>Convert to JSON</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleConvert('xml')} disabled={format === 'xml'}>Convert to XML</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleConvert('yaml')} disabled={format === 'yaml'}>Convert to YAML</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Quote className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleEscape}>Escape</DropdownMenuItem>
                          <DropdownMenuItem onClick={handleUnescape}>Unescape</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="w-px h-4 bg-border mx-1" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Button 
                            variant={autoMode ? "default" : "ghost"} 
                            size="sm" 
                            className={cn(
                              "h-7 text-xs gap-1 px-2",
                              autoMode && "bg-primary text-primary-foreground"
                            )}
                            onClick={toggleAutoMode}
                          >
                            {autoMode ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                            Auto
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>Auto format on input change</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                {/* Editor */}
                <div className="flex-1 min-h-0 relative" onPaste={handlePaste}>
                    <Editor
                      height="100%"
                      language={format === 'xml' ? 'xml' : format === 'yaml' ? 'yaml' : 'json'}
                      value={input}
                      onChange={handleInputChange}
                      theme={editorTheme}
                      onMount={(editor) => { inputEditorRef.current = editor }}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: 'var(--font-mono)',
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        padding: { top: 10, bottom: 10 }
                      }}
                    />
                </div>
              </div>
              {/* Collapsed Output Bar */}
              <div className="w-10 flex flex-col items-center border-l border-border bg-muted/30">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10" 
                      onClick={() => setOutputCollapsed(false)}
                    >
                      <PanelRightOpen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Expand Output</TooltipContent>
                </Tooltip>
                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
                  <span className="text-xs text-muted-foreground [writing-mode:vertical-lr] rotate-180">Output</span>
                </div>
              </div>
            </>
          ) : mode === 'diff' ? (
            // Diff mode: DiffEditor takes full width
            <div className="flex-1 flex flex-col h-full">
              {/* Diff Toolbar */}
              <div className="flex items-center justify-between p-1 border-b border-border bg-muted/30 h-10 select-none">
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs gap-1.5 px-3"
                    onClick={() => setMode('code')}
                  >
                    <Code className="h-3.5 w-3.5" /> Code
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs gap-1.5 px-3"
                    onClick={() => setMode('tree')}
                  >
                    <Network className="h-3.5 w-3.5" /> Tree
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs gap-1.5 px-3"
                    onClick={() => setMode('table')}
                  >
                    <TableIcon className="h-3.5 w-3.5" /> Table
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs gap-1.5 px-3"
                    onClick={() => setMode('graph')}
                  >
                    <Network className="h-3.5 w-3.5 rotate-45" /> Graph
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="h-7 text-xs gap-1.5 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <GitCompare className="h-3.5 w-3.5" /> Diff
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-xs">Input ↔ Output</span>
                </div>
              </div>
              {/* DiffEditor */}
              <div className="flex-1 min-h-0">
                <DiffEditor
                  height="100%"
                  language={format === 'xml' ? 'xml' : format === 'yaml' ? 'yaml' : 'json'}
                  original={input}
                  modified={output}
                  theme={editorTheme}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: 'var(--font-mono)',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    renderSideBySide: true
                  }}
                />
              </div>
            </div>
          ) : (
            // Normal split view
            <SplitPane defaultSplit={50}>
              {/* Left Pane: Input */}
              <div className="flex flex-col h-full border-r border-border">
              {/* Left Toolbar */}
              <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30 h-10 select-none">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-2">
                  <span className="flex items-center gap-1">
                    {format === 'json' && <Braces className="w-3.5 h-3.5" />}
                    {format === 'xml' && <Code className="w-3.5 h-3.5" />}
                    {format === 'yaml' && <FileText className="w-3.5 h-3.5" />}
                    Input
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2 bg-muted hover:bg-muted/80">
                            {format.toUpperCase()}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setFormat('json')}>JSON</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormat('xml')}>XML</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormat('yaml')}>YAML</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFileImport}>
                            <Upload className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Import File</TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => triggerSearch(inputEditorRef)}>
                            <Search className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Search (⌘F)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClear}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear</TooltipContent>
                  </Tooltip>

                  <div className="w-px h-4 bg-border mx-1" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFormatAction}>
                            <Play className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Format (⇧⌘F)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleTryFix} disabled={format !== 'json'}>
                            <Wand2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Try Fix JSON</TooltipContent>
                  </Tooltip>

                   <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCompress} disabled={format !== 'json'}>
                            <Minimize2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Compress</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleValidate}>
                            <CheckCircle2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Validate</TooltipContent>
                  </Tooltip>
                  
                  <div className="w-px h-4 bg-border mx-1" />

                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleConvert('json')} disabled={format === 'json'}>Convert to JSON</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleConvert('xml')} disabled={format === 'xml'}>Convert to XML</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleConvert('yaml')} disabled={format === 'yaml'}>Convert to YAML</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Quote className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleEscape}>Escape</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleUnescape}>Unescape</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="w-px h-4 bg-border mx-1" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                          variant={autoMode ? "default" : "ghost"} 
                          size="sm" 
                          className={cn(
                            "h-7 text-xs gap-1 px-2",
                            autoMode && "bg-primary text-primary-foreground"
                          )}
                          onClick={toggleAutoMode}
                        >
                          {autoMode ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                          Auto
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Auto format on input change</TooltipContent>
                  </Tooltip>

                </div>
              </div>
              
              {/* Editor */}
              <div className="flex-1 min-h-0 relative" onPaste={handlePaste}>
                  <Editor
                    height="100%"
                    language={format === 'xml' ? 'xml' : format === 'yaml' ? 'yaml' : 'json'}
                    value={input}
                    onChange={handleInputChange}
                    theme={editorTheme}
                    onMount={(editor) => { inputEditorRef.current = editor }}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: 'var(--font-mono)',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on',
                      padding: { top: 10, bottom: 10 }
                    }}
                  />
              </div>
            </div>

              {/* Right Pane: Output */}
              <div className="flex flex-col h-full bg-background">
                {/* View Tabs */}
                <div className="flex items-center justify-between p-1 border-b border-border bg-muted/30 h-10 select-none">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant={mode === 'code' ? 'default' : 'ghost'} 
                      size="sm" 
                      className={cn(
                          "h-7 text-xs gap-1.5 px-3",
                          mode === 'code' && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      onClick={() => setMode('code')}
                    >
                      <Code className="h-3.5 w-3.5" /> Code
                    </Button>
                    <Button 
                      variant={mode === 'tree' ? 'default' : 'ghost'} 
                      size="sm" 
                      className={cn(
                          "h-7 text-xs gap-1.5 px-3",
                          mode === 'tree' && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      onClick={() => setMode('tree')}
                    >
                      <Network className="h-3.5 w-3.5" /> Tree
                    </Button>
                    <Button 
                      variant={mode === 'table' ? 'default' : 'ghost'} 
                      size="sm" 
                      className={cn(
                          "h-7 text-xs gap-1.5 px-3",
                          mode === 'table' && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      onClick={() => setMode('table')}
                    >
                      <TableIcon className="h-3.5 w-3.5" /> Table
                    </Button>
                    <Button 
                      variant={mode === 'graph' ? 'default' : 'ghost'} 
                      size="sm" 
                      className={cn(
                          "h-7 text-xs gap-1.5 px-3",
                          mode === 'graph' && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      onClick={() => setMode('graph')}
                    >
                      <Network className="h-3.5 w-3.5 rotate-45" /> Graph
                    </Button>
                    <Button 
                      variant={mode === 'diff' ? 'default' : 'ghost'} 
                      size="sm" 
                      className={cn(
                          "h-7 text-xs gap-1.5 px-3",
                          mode === 'diff' && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      onClick={() => setMode('diff')}
                    >
                      <GitCompare className="h-3.5 w-3.5" /> Diff
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {mode === 'code' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => triggerSearch(outputEditorRef)}>
                            <Search className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Search (⌘F)</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download (⌘S)</TooltipContent>
                    </Tooltip>
                    <div className="w-px h-4 bg-border mx-1" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOutputCollapsed(true)}>
                          <PanelRightClose className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Collapse Output</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Output Content */}
                <div className="flex-1 min-h-0 overflow-auto bg-card relative">
                  {mode === 'code' && (
                    <Editor
                      height="100%"
                      language={format === 'xml' ? 'xml' : format === 'yaml' ? 'yaml' : 'json'}
                      value={output}
                      theme={editorTheme}
                      onMount={(editor) => { outputEditorRef.current = editor }}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: 'var(--font-mono)',
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        padding: { top: 10, bottom: 10 }
                      }}
                    />
                  )}
                  {mode === 'tree' && <TreeView data={output} format={format} />}
                  {mode === 'table' && <TableView data={output} format={format} />}
                  {mode === 'graph' && <GraphView data={output} format={format} />}
                </div>
              </div>
            </SplitPane>
          )}
        </div>
        
        {/* Status Bar */}
        <div className="h-6 bg-primary/5 border-t border-border flex items-center px-3 text-xs justify-between shrink-0 select-none">
            <div className="flex items-center gap-4 text-muted-foreground">
              {stats ? (
                <>
                  <span>{formatFileSize(stats.size)}</span>
                  <span>{stats.nodeCount} nodes</span>
                  <span>Depth: {stats.depth}</span>
                </>
              ) : (
                <>
                  <span>{formatFileSize(new Blob([input]).size)}</span>
                  <span>{input.length} chars</span>
                  <span>{input.split('\n').length} lines</span>
                </>
              )}
              {error && <span className="text-red-500 font-medium flex items-center gap-1"><XCircle className="h-3 w-3" /> {error}</span>}
              {success && <span className="text-green-500 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {success}</span>}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="opacity-60">{format.toUpperCase()}</span>
              <span className="w-px h-3 bg-border"></span>
              <span className="opacity-60">UTF-8</span>
            </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

// Export for use in page.tsx
export { Workbench }
