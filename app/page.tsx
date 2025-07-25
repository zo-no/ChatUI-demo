'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// 动态导入整个ChatUI核心功能，避免SSR问题
const ChatUICore = dynamic(() => import('./components/ChatUICore'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">加载中...</div>
})

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="flex items-center justify-center h-96">加载中...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <ChatUICore />
    </main>
  )
}
