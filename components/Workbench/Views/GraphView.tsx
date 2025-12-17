'use client'

import React, { useEffect, useMemo, useCallback, useState } from 'react'
import { Network, AlertCircle } from 'lucide-react'
import ReactFlow, { 
  Node, 
  Edge, 
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  NodeProps,
  MiniMap
} from 'reactflow'
import 'reactflow/dist/style.css'
import { cn } from '@/lib/utils'

interface GraphViewProps {
  data: string
  format: 'json' | 'xml' | 'yaml'
}

const MAX_NODES = 500

// 节点类型颜色配置
const NODE_STYLES = {
  object: {
    bg: 'bg-violet-500 dark:bg-violet-600',
    border: 'border-violet-600 dark:border-violet-500',
    text: 'text-white',
    badge: 'bg-violet-400/30',
    handle: '#8b5cf6'
  },
  array: {
    bg: 'bg-blue-500 dark:bg-blue-600',
    border: 'border-blue-600 dark:border-blue-500',
    text: 'text-white',
    badge: 'bg-blue-400/30',
    handle: '#3b82f6'
  },
  string: {
    bg: 'bg-green-500 dark:bg-green-600',
    border: 'border-green-600 dark:border-green-500',
    text: 'text-white',
    badge: 'bg-green-400/30',
    handle: '#22c55e'
  },
  number: {
    bg: 'bg-amber-500 dark:bg-amber-600',
    border: 'border-amber-600 dark:border-amber-500',
    text: 'text-white',
    badge: 'bg-amber-400/30',
    handle: '#f59e0b'
  },
  boolean: {
    bg: 'bg-pink-500 dark:bg-pink-600',
    border: 'border-pink-600 dark:border-pink-500',
    text: 'text-white',
    badge: 'bg-pink-400/30',
    handle: '#ec4899'
  },
  null: {
    bg: 'bg-gray-500 dark:bg-gray-600',
    border: 'border-gray-600 dark:border-gray-500',
    text: 'text-white',
    badge: 'bg-gray-400/30',
    handle: '#6b7280'
  }
}

type NodeType = keyof typeof NODE_STYLES

// 自定义节点组件
function CustomNode({ data }: NodeProps) {
  const style = NODE_STYLES[data.nodeType as NodeType] || NODE_STYLES.object
  
  return (
    <div className={cn(
      "px-3 py-2 rounded-lg border-2 shadow-lg min-w-[100px] max-w-[200px]",
      "transition-all duration-200 hover:shadow-xl hover:scale-105",
      style.bg, style.border, style.text
    )}>
      {/* 入口连接点 */}
      {data.hasParent && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 !-left-1"
          style={{ background: style.handle }}
        />
      )}
      
      {/* 节点内容 */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate">{data.label}</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
            style.badge
          )}>
            {data.nodeType}
          </span>
        </div>
        
        {data.value !== undefined && (
          <div className="text-xs opacity-90 truncate font-mono" title={String(data.value)}>
            {data.displayValue}
          </div>
        )}
        
        {data.childCount !== undefined && data.childCount > 0 && (
          <div className="text-[10px] opacity-75">
            {data.nodeType === 'array' ? `${data.childCount} items` : `${data.childCount} keys`}
          </div>
        )}
      </div>
      
      {/* 出口连接点 */}
      {data.hasChildren && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2 !h-2 !-right-1"
          style={{ background: style.handle }}
        />
      )}
    </div>
  )
}

const nodeTypes = {
  custom: CustomNode
}

// 解析 JSON 并生成节点和边
function parseJsonToFlow(jsonData: any): { nodes: Node[], edges: Edge[], tooLarge: boolean } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  let nodeId = 0
  let tooLarge = false

  function getNodeType(value: any): NodeType {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    if (typeof value === 'object') return 'object'
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    return 'null'
  }

  function formatValue(value: any): string {
    if (value === null) return 'null'
    if (typeof value === 'string') {
      return value.length > 20 ? `"${value.slice(0, 18)}..."` : `"${value}"`
    }
    if (typeof value === 'boolean') return String(value)
    if (typeof value === 'number') return String(value)
    return ''
  }

  // 计算每层的节点数量，用于布局
  const levelCounts: Map<number, number> = new Map()
  
  function countNodesPerLevel(value: any, level: number = 0) {
    if (nodeId >= MAX_NODES) return
    nodeId++
    
    levelCounts.set(level, (levelCounts.get(level) || 0) + 1)
    
    if (Array.isArray(value)) {
      value.forEach(item => countNodesPerLevel(item, level + 1))
    } else if (typeof value === 'object' && value !== null) {
      Object.values(value).forEach(v => countNodesPerLevel(v, level + 1))
    }
  }
  
  // 预计算节点数
  const jsonStr = JSON.stringify(jsonData)
  const estimatedNodes = (jsonStr.match(/[{[\]":,]/g) || []).length / 3
  if (estimatedNodes > MAX_NODES) {
    return { nodes: [], edges: [], tooLarge: true }
  }
  
  nodeId = 0
  countNodesPerLevel(jsonData)
  
  if (nodeId >= MAX_NODES) {
    tooLarge = true
    return { nodes: [], edges: [], tooLarge }
  }

  // 重置并创建节点
  nodeId = 0
  const levelIndices: Map<number, number> = new Map()

  function createNode(
    key: string,
    value: any,
    parentId: string | null,
    level: number = 0
  ): string | null {
    if (nodeId >= MAX_NODES) return null

    const currentNodeId = `node-${nodeId++}`
    const nodeType = getNodeType(value)
    const levelCount = levelCounts.get(level) || 1
    const currentIndex = levelIndices.get(level) || 0
    levelIndices.set(level, currentIndex + 1)

    // 垂直间距和水平间距
    const horizontalGap = 220
    const verticalGap = 80
    
    // 计算位置
    const x = level * horizontalGap
    const totalHeight = levelCount * verticalGap
    const startY = -totalHeight / 2
    const y = startY + currentIndex * verticalGap

    const isContainer = nodeType === 'array' || nodeType === 'object'
    const childCount = isContainer 
      ? (Array.isArray(value) ? value.length : Object.keys(value).length)
      : undefined

    nodes.push({
      id: currentNodeId,
      type: 'custom',
      position: { x, y },
      data: {
        label: key,
        nodeType,
        value: !isContainer ? value : undefined,
        displayValue: !isContainer ? formatValue(value) : undefined,
        childCount,
        hasChildren: isContainer && childCount! > 0,
        hasParent: parentId !== null
      }
    })

    // 创建边
    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${currentNodeId}`,
        source: parentId,
        target: currentNodeId,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: '#94a3b8'
        }
      })
    }

    // 递归处理子节点
    if (nodeType === 'array') {
      value.forEach((item: any, index: number) => {
        createNode(`[${index}]`, item, currentNodeId, level + 1)
      })
    } else if (nodeType === 'object') {
      Object.entries(value).forEach(([k, v]) => {
        createNode(k, v, currentNodeId, level + 1)
      })
    }

    return currentNodeId
  }

  createNode('root', jsonData, null, 0)

  return { nodes, edges, tooLarge }
}

export function GraphView({ data, format }: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [tooLarge, setTooLarge] = useState(false)

  // 解析数据
  const parsedResult = useMemo(() => {
    if (!data || format !== 'json') {
      return { nodes: [], edges: [], tooLarge: false }
    }

    try {
      const parsed = JSON.parse(data)
      return parseJsonToFlow(parsed)
    } catch (e) {
      return { nodes: [], edges: [], tooLarge: false }
    }
  }, [data, format])

  // 更新状态
  useEffect(() => {
    setNodes(parsedResult.nodes)
    setEdges(parsedResult.edges)
    setTooLarge(parsedResult.tooLarge)
  }, [parsedResult, setNodes, setEdges])

  if (format !== 'json') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
        <Network className="h-8 w-8 opacity-20 mb-2" />
        <p>Graph view currently supports JSON only.</p>
        <p className="text-xs opacity-70 mt-1">Please convert to JSON first.</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
        <Network className="h-8 w-8 opacity-20 mb-2" />
        <p>Enter JSON data to see Graph View</p>
      </div>
    )
  }

  if (tooLarge) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
        <AlertCircle className="h-8 w-8 text-yellow-500 mb-2" />
        <p className="font-medium">Data too large for Graph View</p>
        <p className="text-xs opacity-70 mt-1">
          JSON has more than {MAX_NODES} nodes.<br/>
          Try Tree View for better performance.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={16} 
          size={1} 
          color="hsl(var(--muted-foreground) / 0.2)"
        />
        <Controls 
          className="!bg-background/80 !backdrop-blur-sm !border-border !shadow-lg"
          showInteractive={false}
        />
        <MiniMap 
          className="!bg-background/80 !backdrop-blur-sm !border-border !shadow-lg"
          nodeColor={(node) => {
            const style = NODE_STYLES[node.data?.nodeType as NodeType]
            return style?.handle || '#6b7280'
          }}
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>
    </div>
  )
}
