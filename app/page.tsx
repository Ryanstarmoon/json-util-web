'use client'

import Workbench from '@/components/Workbench/Workbench'
import ToolLayout from '@/components/ToolLayout/ToolLayout'

export default function Home() {
  return (
    <ToolLayout 
      title="JSON Workbench" 
      description="Secure, Local, Fast JSON Productivity Tool" 
      fullScreen={true}
    >
      <Workbench />
    </ToolLayout>
  )
}
