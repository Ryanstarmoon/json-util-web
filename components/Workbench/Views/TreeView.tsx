'use client'

import React from 'react'
import { Network, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TreeViewProps {
  data: string
  format: 'json' | 'xml' | 'yaml'
}

export function TreeView({ data, format }: TreeViewProps) {
  let parsedData: any = null
  let parseError = null

  try {
    if (!data) {
        // Empty state
    } else if (format === 'json') {
      parsedData = JSON.parse(data)
    } else {
      // For now, only JSON is supported for Tree View interactions
      // XML/YAML would need conversion or separate parsers
      parseError = `Tree view currently supports JSON. Please convert ${format.toUpperCase()} to JSON first.`
    }
  } catch (e) {
    parseError = "Invalid JSON data"
  }

  if (parseError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
        <Network className="h-8 w-8 opacity-20 mb-2" />
        <p>{parseError}</p>
      </div>
    )
  }

  if (!parsedData && data) {
      // Should handle empty string above, but just in case
       return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
            <p>No data to display</p>
        </div>
       )
  }

  if (!data) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
            <p>Enter data to see Tree View</p>
        </div>
       )
  }

  return (
    <div className="h-full overflow-auto p-4 text-sm font-mono">
      <JsonNode 
        name="root" 
        value={parsedData} 
        isLast={true} 
        depth={0} 
        initiallyExpanded={true} 
      />
    </div>
  )
}

interface JsonNodeProps {
  name: string
  value: any
  isLast: boolean
  depth: number
  initiallyExpanded?: boolean
}

function JsonNode({ name, value, isLast, depth, initiallyExpanded = false }: JsonNodeProps) {
  const [expanded, setExpanded] = React.useState(initiallyExpanded)
  
  const isObject = value !== null && typeof value === 'object'
  const isArray = Array.isArray(value)
  const isEmpty = isObject && Object.keys(value).length === 0
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  if (!isObject) {
    return (
      <div className="flex items-start hover:bg-muted/30 rounded px-1">
        <div style={{ width: depth * 16 }} className="flex-shrink-0" />
        <span className="text-purple-600 dark:text-purple-400 mr-1">{name}:</span>
        <span className={cn(
          typeof value === 'string' ? "text-green-600 dark:text-green-400" :
          typeof value === 'number' ? "text-blue-600 dark:text-blue-400" :
          typeof value === 'boolean' ? "text-yellow-600 dark:text-yellow-400" :
          "text-gray-500"
        )}>
          {JSON.stringify(value)}
        </span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    )
  }

  const keys = Object.keys(value)
  const brackets = isArray ? ['[', ']'] : ['{', '}']

  return (
    <div>
      <div 
        className="flex items-center hover:bg-muted/30 rounded px-1 cursor-pointer select-none group"
        onClick={handleToggle}
      >
        <div style={{ width: depth * 16 }} className="flex-shrink-0 flex justify-end pr-1">
            {!isEmpty && (
                expanded ? <ChevronDown className="h-3 w-3 opacity-50" /> : <ChevronRight className="h-3 w-3 opacity-50" />
            )}
        </div>
        <span className="text-purple-600 dark:text-purple-400 mr-1">{name}:</span>
        <span className="text-muted-foreground">{brackets[0]}</span>
        {!expanded && !isEmpty && (
            <span className="text-muted-foreground text-xs mx-1">...</span>
        )}
        {isEmpty && <span className="text-muted-foreground">{brackets[1]}</span>}
        {!expanded && !isEmpty && <span className="text-muted-foreground">{brackets[1]}</span>}
        {!isLast && <span className="text-muted-foreground">,</span>}
        
        {/* Item count hint */}
        {!expanded && !isEmpty && (
            <span className="ml-2 text-xs text-muted-foreground/50">
                {isArray ? `${keys.length} items` : `${keys.length} keys`}
            </span>
        )}
      </div>

      {expanded && !isEmpty && (
        <div>
          {keys.map((key, index) => (
            <JsonNode
              key={key}
              name={key}
              value={value[key]}
              isLast={index === keys.length - 1}
              depth={depth + 1}
            />
          ))}
          <div className="flex items-center hover:bg-muted/30 rounded px-1">
             <div style={{ width: (depth + 1) * 16 }} className="flex-shrink-0" />
             <span className="text-muted-foreground">{brackets[1]}</span>
             {!isLast && <span className="text-muted-foreground">,</span>}
          </div>
        </div>
      )}
    </div>
  )
}
