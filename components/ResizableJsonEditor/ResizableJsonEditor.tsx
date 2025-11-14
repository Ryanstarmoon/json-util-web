'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { GripVertical } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => {
    const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
    return (
      <div 
        className={`flex items-center justify-center h-full rounded-md ${isDark ? '' : 'bg-slate-100 border border-slate-200'}`}
        style={{
          backgroundColor: isDark ? '#0f172a' : undefined,
        }}
      >
        <div className="text-slate-500 dark:text-slate-400">Loading editor...</div>
      </div>
    )
  }
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
}

export default function ResizableJsonEditor({
  value,
  onChange,
  readOnly = false,
  language = 'json',
  minHeight = 200,
  maxHeight = 2000,
  defaultHeight = 600,
  toolbar
}: ResizableJsonEditorProps) {
  const { theme } = useTheme()
  const [height, setHeight] = useState<number | string>(defaultHeight)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number>(0)
  const startHeightRef = useRef<number>(0)
  
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'vs'
  const isDark = theme === 'dark'

  useEffect(() => {
    // Use flex fill on initialization
    if (!isResizing && typeof height === 'number') {
      const container = containerRef.current
      if (container) {
        const containerHeight = container.clientHeight
        if (containerHeight > 0) {
          setHeight('100%')
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      startHeightRef.current = editor.clientHeight
    }
  }

  const editorHeight = typeof height === 'number' ? `${height}px` : height

  return (
    <div ref={containerRef} className="flex flex-col h-full min-h-0">
      {toolbar && (
        <div className="flex items-center justify-start mb-2">
          {toolbar}
        </div>
      )}
      <div 
        ref={editorRef}
        className={`relative flex-1 min-h-0 rounded-md overflow-hidden transition-colors ${isDark ? '' : 'border border-slate-200 shadow-sm'}`}
        style={{ 
          height: editorHeight,
          backgroundColor: isDark ? '#0f172a' : 'transparent',
        }}
      >
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={onChange}
          theme={editorTheme}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-row-resize hover:bg-blue-500/20 flex items-center justify-center group z-10"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  )
}

