'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
      <div className="flex items-center justify-center h-[400px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md">
        <div className="text-slate-500 dark:text-slate-400">Loading editor...</div>
      </div>
  )
})

interface JsonEditorProps {
  value: string
  onChange?: (value: string | undefined) => void
  height?: string
  readOnly?: boolean
  language?: string
}

export default function JsonEditor({
  value,
  onChange,
  height = '400px',
  readOnly = false,
  language = 'json'
}: JsonEditorProps) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden transition-colors shadow-sm">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        theme="vs-dark"
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
    </div>
  )
}

