'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Table as TableIcon, ChevronRight, ChevronDown, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TableViewProps {
  data: string
  format: 'json' | 'xml' | 'yaml'
}

interface RowData {
  key: string
  value: any
  type: string
  depth: number
  path: string
  hasChildren: boolean
  isArray: boolean
  arrayLength?: number
  objectKeys?: number
}

// 获取值的类型描述
function getTypeDescription(value: any): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return `array[${value.length}]`
  if (typeof value === 'object') return `object{${Object.keys(value).length}}`
  return typeof value
}

// 获取值的颜色类名
function getValueColorClass(value: any): string {
  if (value === null || value === undefined) return 'text-gray-400 dark:text-gray-500'
  if (typeof value === 'string') return 'text-green-600 dark:text-green-400'
  if (typeof value === 'number') return 'text-blue-600 dark:text-blue-400'
  if (typeof value === 'boolean') return 'text-purple-600 dark:text-purple-400'
  return 'text-foreground'
}

// 格式化显示值
function formatDisplayValue(value: any): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return `Array(${value.length})`
  if (typeof value === 'object') return `Object{${Object.keys(value).length}}`
  return String(value)
}

// 递归行组件
function TableRowWithNesting({ 
  row, 
  expandedPaths, 
  toggleExpand, 
  parsedData 
}: { 
  row: RowData
  expandedPaths: Set<string>
  toggleExpand: (path: string) => void
  parsedData: any
}) {
  const [copied, setCopied] = useState(false)
  const isExpanded = expandedPaths.has(row.path)
  
  // 获取当前路径的值
  const getValue = useCallback((path: string, data: any) => {
    if (path === 'root') return data
    const parts = path.replace(/^root\.?/, '').split(/\.|\[|\]/).filter(Boolean)
    let current = data
    for (const part of parts) {
      if (current === null || current === undefined) return undefined
      current = current[part]
    }
    return current
  }, [])
  
  const currentValue = getValue(row.path, parsedData)
  
  // 获取子行
  const childRows = useMemo(() => {
    if (!row.hasChildren || !isExpanded) return []
    
    const children: RowData[] = []
    if (Array.isArray(currentValue)) {
      currentValue.forEach((item, index) => {
        const childPath = `${row.path}[${index}]`
        const isChildArray = Array.isArray(item)
        const isChildObject = typeof item === 'object' && item !== null && !isChildArray
        children.push({
          key: `[${index}]`,
          value: item,
          type: getTypeDescription(item),
          depth: row.depth + 1,
          path: childPath,
          hasChildren: isChildArray || isChildObject,
          isArray: isChildArray,
          arrayLength: isChildArray ? item.length : undefined,
          objectKeys: isChildObject ? Object.keys(item).length : undefined
        })
      })
    } else if (typeof currentValue === 'object' && currentValue !== null) {
      Object.entries(currentValue).forEach(([key, val]) => {
        const childPath = row.path === 'root' ? key : `${row.path}.${key}`
        const isChildArray = Array.isArray(val)
        const isChildObject = typeof val === 'object' && val !== null && !isChildArray
        children.push({
          key,
          value: val,
          type: getTypeDescription(val),
          depth: row.depth + 1,
          path: childPath,
          hasChildren: isChildArray || isChildObject,
          isArray: isChildArray,
          arrayLength: isChildArray ? (val as any[]).length : undefined,
          objectKeys: isChildObject ? Object.keys(val as object).length : undefined
        })
      })
    }
    return children
  }, [currentValue, row, isExpanded])

  const handleCopy = async () => {
    try {
      const textToCopy = row.hasChildren 
        ? JSON.stringify(currentValue, null, 2) 
        : String(row.value)
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  return (
    <>
      <tr 
        className={cn(
          "group border-b border-border/50 hover:bg-muted/50 transition-colors",
          row.depth > 0 && "bg-muted/20"
        )}
      >
        {/* Key 列 */}
        <td 
          className="py-2 px-3 font-medium whitespace-nowrap"
          style={{ paddingLeft: `${row.depth * 20 + 12}px` }}
        >
          <div className="flex items-center gap-1">
            {row.hasChildren ? (
              <button 
                onClick={() => toggleExpand(row.path)}
                className="p-0.5 rounded hover:bg-muted-foreground/20 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            ) : (
              <span className="w-[18px]" />
            )}
            <span className={cn(
              "font-mono text-sm",
              row.key.startsWith('[') ? "text-blue-500 dark:text-blue-400" : "text-purple-600 dark:text-purple-400"
            )}>
              {row.key}
            </span>
          </div>
        </td>
        
        {/* Value 列 */}
        <td className="py-2 px-3 max-w-[400px]">
          <div className="flex items-center gap-2">
            <span 
              className={cn(
                "font-mono text-sm truncate",
                getValueColorClass(row.value)
              )}
              title={row.hasChildren ? JSON.stringify(currentValue, null, 2) : String(row.value)}
            >
              {formatDisplayValue(row.value)}
            </span>
            <button 
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted-foreground/20 transition-all"
              title="Copy value"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          </div>
        </td>
        
        {/* Type 列 */}
        <td className="py-2 px-3 whitespace-nowrap">
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-md font-medium",
            row.type.startsWith('array') && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
            row.type.startsWith('object') && "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
            row.type === 'string' && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
            row.type === 'number' && "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
            row.type === 'boolean' && "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
            row.type === 'null' && "bg-gray-100 dark:bg-gray-800 text-gray-500"
          )}>
            {row.type}
          </span>
        </td>
      </tr>
      
      {/* 子行 */}
      {isExpanded && childRows.map((childRow) => (
        <TableRowWithNesting
          key={childRow.path}
          row={childRow}
          expandedPaths={expandedPaths}
          toggleExpand={toggleExpand}
          parsedData={parsedData}
        />
      ))}
    </>
  )
}

export function TableView({ data, format }: TableViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']))
  
  let parsedData: any = null
  let parseError = null

  try {
    if (!data) {
      // Empty
    } else if (format === 'json') {
      parsedData = JSON.parse(data)
    } else {
      parseError = `Table view currently supports JSON. Please convert ${format.toUpperCase()} to JSON first.`
    }
  } catch (e) {
    parseError = "Invalid JSON data"
  }

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }, [])

  const expandAll = useCallback(() => {
    const allPaths = new Set<string>(['root'])
    
    const collectPaths = (value: any, path: string) => {
      if (Array.isArray(value)) {
        allPaths.add(path)
        value.forEach((item, index) => {
          collectPaths(item, `${path}[${index}]`)
        })
      } else if (typeof value === 'object' && value !== null) {
        allPaths.add(path)
        Object.entries(value).forEach(([key, val]) => {
          collectPaths(val, path === 'root' ? key : `${path}.${key}`)
        })
      }
    }
    
    collectPaths(parsedData, 'root')
    setExpandedPaths(allPaths)
  }, [parsedData])

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set(['root']))
  }, [])

  // 构建顶层行数据
  const topLevelRows = useMemo(() => {
    if (!parsedData) return []
    
    const rows: RowData[] = []
    
    if (Array.isArray(parsedData)) {
      // 数组根节点
      parsedData.forEach((item, index) => {
        const path = `root[${index}]`
        const isArray = Array.isArray(item)
        const isObject = typeof item === 'object' && item !== null && !isArray
        rows.push({
          key: `[${index}]`,
          value: item,
          type: getTypeDescription(item),
          depth: 0,
          path,
          hasChildren: isArray || isObject,
          isArray,
          arrayLength: isArray ? item.length : undefined,
          objectKeys: isObject ? Object.keys(item).length : undefined
        })
      })
    } else if (typeof parsedData === 'object' && parsedData !== null) {
      // 对象根节点
      Object.entries(parsedData).forEach(([key, value]) => {
        const isArray = Array.isArray(value)
        const isObject = typeof value === 'object' && value !== null && !isArray
        rows.push({
          key,
          value,
          type: getTypeDescription(value),
          depth: 0,
          path: key,
          hasChildren: isArray || isObject,
          isArray,
          arrayLength: isArray ? (value as any[]).length : undefined,
          objectKeys: isObject ? Object.keys(value as object).length : undefined
        })
      })
    } else {
      // 原始值
      rows.push({
        key: 'value',
        value: parsedData,
        type: getTypeDescription(parsedData),
        depth: 0,
        path: 'root',
        hasChildren: false,
        isArray: false
      })
    }
    
    return rows
  }, [parsedData])

  if (parseError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
        <TableIcon className="h-8 w-8 opacity-20 mb-2" />
        <p>{parseError}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
        <p>Enter data to see Table View</p>
      </div>
    )
  }

  if (!parsedData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
        <p>No data to display</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-muted/30">
        <button
          onClick={expandAll}
          className="text-xs px-2 py-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="text-xs px-2 py-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          Collapse All
        </button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          {Array.isArray(parsedData) 
            ? `${parsedData.length} items` 
            : `${Object.keys(parsedData).length} properties`}
        </span>
      </div>
      
      {/* 表格 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <tr className="border-b border-border">
              <th className="py-2 px-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider w-[200px]">
                Key
              </th>
              <th className="py-2 px-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Value
              </th>
              <th className="py-2 px-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider w-[120px]">
                Type
              </th>
            </tr>
          </thead>
          <tbody>
            {topLevelRows.map((row) => (
              <TableRowWithNesting
                key={row.path}
                row={row}
                expandedPaths={expandedPaths}
                toggleExpand={toggleExpand}
                parsedData={parsedData}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
