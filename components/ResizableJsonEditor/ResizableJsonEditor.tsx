'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { GripHorizontal } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Loading editor...
    </div>
  )
})

interface ResizableJsonEditorProps {
  value: string
  onChange?: (value: string | undefined) => void
  readOnly?: boolean
  language?: string
  minHeight?: number
  maxHeight?: number
  defaultHeight?: number
  toolbar?: React.ReactNode
  onMount?: (editor: any, monaco: any) => void
}

export default function ResizableJsonEditor({
  value,
  onChange,
  readOnly = false,
  language = 'json',
  minHeight = 200,
  maxHeight = 2000,
  defaultHeight = 600,
  toolbar,
  onMount
}: ResizableJsonEditorProps) {
  const { theme, style } = useTheme()
  // Use undefined to indicate "auto" (flex-1), number for fixed pixel height
  const [height, setHeight] = useState<number | undefined>(undefined)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number>(0)
  const startHeightRef = useRef<number>(0)
  
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'vs'

  const handleEditorMount = (editor: any, monaco: any) => {
    // Configure JSON formatting options
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: true,
      schemas: [],
      enableSchemaRequest: true
    })

    // Set formatting options for JSON
    monaco.languages.registerDocumentFormattingEditProvider('json', {
      provideDocumentFormattingEdits(model: any) {
        const text = model.getValue()
        try {
          const parsed = JSON.parse(text)
          const formatted = JSON.stringify(parsed, null, 4)
          return [{
            range: model.getFullModelRange(),
            text: formatted
          }]
        } catch {
          return []
        }
      }
    })

    // Set formatting options for XML and YAML if needed
    if (language === 'xml' || language === 'yaml') {
      // Keep existing formatting for non-JSON languages
    }

    // Call the external onMount callback
    if (onMount) {
      onMount(editor, monaco)
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const deltaY = e.clientY - startYRef.current
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, startHeightRef.current + deltaY)
      )
      setHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, minHeight, maxHeight])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startYRef.current = e.clientY
    const editor = editorRef.current
    if (editor) {
      // When starting resize, grab current actual height
      startHeightRef.current = editor.clientHeight
      // Set initial height to current pixel value to prevent jump
      if (height === undefined) {
        setHeight(editor.clientHeight)
      }
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full bg-card text-card-foreground">
      {toolbar && (
        <div className="flex-none z-10">
          {toolbar}
        </div>
      )}
      <div 
        ref={editorRef}
        className={cn(
          "relative w-full min-h-0 group",
          // If height is set (custom), use flex-none so it respects height style
          // If height is undefined (auto), use flex-1 to fill remaining space
          height !== undefined ? "flex-none" : "flex-1"
        )}
        style={{ 
          height: height !== undefined ? height : undefined
        }}
      >
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={onChange}
          theme={editorTheme}
          onMount={handleEditorMount}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            detectIndentation: false,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            padding: { top: 16, bottom: 16 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'all',
          }}
        />
        
        {/* Resize handle */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize z-20 transition-colors flex items-center justify-center",
            "hover:bg-primary/10",
            isResizing && "bg-primary/20"
          )}
          onMouseDown={handleMouseDown}
        >
          <div className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isResizing && "opacity-100"
          )}>
            <div className="bg-background/80 backdrop-blur border rounded-full p-0.5 shadow-sm">
              <GripHorizontal className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
