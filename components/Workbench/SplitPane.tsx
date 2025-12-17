'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SplitPaneProps {
  children: [React.ReactNode, React.ReactNode]
  className?: string
  minSize?: number
  defaultSplit?: number // Percentage 0-100
}

export function SplitPane({ 
  children, 
  className, 
  minSize = 200, 
  defaultSplit = 50 
}: SplitPaneProps) {
  const [split, setSplit] = useState(defaultSplit)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newSplit = ((e.clientX - containerRect.left) / containerRect.width) * 100
      
      // Convert minSize to percentage approximation or just clamp
      // For simplicity, clamping between 20% and 80%
      const clampedSplit = Math.max(20, Math.min(80, newSplit))
      
      setSplit(clampedSplit)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  return (
    <div ref={containerRef} className={cn("flex h-full w-full overflow-hidden", className)}>
      <div style={{ width: `${split}%` }} className="relative h-full overflow-hidden">
        {children[0]}
      </div>
      
      {/* Resizer Handle */}
      <div 
        className={cn(
          "w-1 h-full cursor-col-resize bg-border hover:bg-primary/50 transition-colors z-10 flex flex-col justify-center items-center group",
          isDragging && "bg-primary/50"
        )}
        onMouseDown={handleMouseDown}
      >
        <div className={cn(
            "h-8 w-1 bg-muted-foreground/20 rounded-full group-hover:bg-muted-foreground/50 transition-colors", 
            isDragging && "bg-muted-foreground/50"
        )} />
      </div>

      <div style={{ width: `${100 - split}%` }} className="relative h-full overflow-hidden">
        {children[1]}
      </div>
    </div>
  )
}

