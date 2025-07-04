'use client'

import React, { useState } from 'react'
import Chat, { Bubble, useMessages, TypingBubble } from '@chatui/core'
import ReactMarkdown from 'react-markdown'
import { marked } from 'marked'

const initialMessages: any[] = []

export default function ChatUICore() {
  // 消息列表
  const { messages, appendMsg } = useMessages(initialMessages)

  // 发送回调
  function handleSend(type: string, val: string) {
    if (type === 'text' && val.trim()) {
      // 添加用户消息
      appendMsg({
        type: 'text',
        content: { text: val },
        position: 'right',
      })

      // 添加打字气泡消息到聊天列表中
      setTimeout(() => {
        const aiResponse = generateAIResponse(val)
        appendMsg({
          type: 'typing',
          content: { text: aiResponse },
          position: 'left',
        })
      }, 200) // 减少延迟时间，更快开始打字效果
    }
  }

  // 生成AI回复内容 - 使用包含Markdown格式的测试文本
  function generateAIResponse(userInput: string): string {
    const responses = [
      `这是一个很有趣的问题！让我详细为您分析一下。

**首先**，我们需要考虑多个方面的因素：
- *技术实现的可行性*
- *用户体验的优化*  
- *长期维护的成本*

在现代Web开发中，用户界面的交互体验变得**越来越重要**，特别是在移动设备普及的今天，我们需要确保每一个细节都能为用户带来流畅和愉悦的使用感受。`,

      `感谢您的提问！这让我想起了软件开发中的一个重要原则：

## 简洁性与功能性的平衡

当我们设计一个系统时，往往会面临功能复杂度与用户友好性之间的权衡。好的设计应该能够：

1. **隐藏复杂性**
2. 为用户呈现*简洁直观*的界面
3. 在后台处理所有复杂的逻辑

这就像冰山一样，用户看到的只是水面上的一小部分，而大部分的工作都在水面之下默默进行。`,

      `您提到的这个话题确实值得深入探讨。

### 技术选型的考虑因素

在当今快速发展的技术环境中，我们经常需要在**创新**和**稳定性**之间找到平衡点：

- 新技术的采用可以带来效率的提升
- 同时也可能引入新的风险和不确定性

因此，在做技术选型时，我们需要综合考虑：
1. 项目的具体需求
2. 团队的技术能力  
3. 长期的维护成本

*最重要的是*，要始终以用户的需求为中心，确保技术服务于业务目标。`,

      `这是一个非常棒的观察！

## 用户体验设计中的细节

在用户体验设计中，**细节往往决定成败**。就像您刚才提到的，一个看似简单的交互背后，可能包含了大量的思考和优化工作。

### 影响用户体验的因素

比如，一个按钮的：
- *颜色*
- *大小* 
- *位置*
- 甚至是点击后的**反馈效果**

都会影响用户的使用感受。现代的设计理念强调**以人为本**，这意味着我们需要深入理解用户的行为模式、心理预期，以及在不同场景下的使用需求。`
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // Markdown 渲染函数 - 用于打字气泡，返回HTML字符串
  function renderMarkdownForTyping(text: string): string {
    try {
      const htmlString = marked.parse(text)
      return `<div class="markdown-content typing-markdown">${htmlString}</div>`
    } catch (error) {
      console.error('Markdown parsing error:', error)
      return text // 如果解析失败，返回原始文本
    }
  }

  function renderMessageContent(msg: any) {
    const { type, content } = msg
    
    // 根据消息类型渲染不同内容
    if (type === 'typing') {
      // 渲染打字气泡效果，支持富文本
      return (
        <TypingBubble 
          content={content.text}
          isRichText={true}
          messageRender={(text) => renderMarkdownForTyping(text)}
          options={{
            step: [2, 5], // 每次显示2-5个字符（增加显示字符数）
            interval: 50, // 每50ms显示一次（减少间隔时间）
            initialIndex: 0
          }}
        />
      )
    }
    
    // 普通文本消息，支持 Markdown
    if (type === 'text') {
      return (
        <div className="markdown-content">
          <ReactMarkdown>{content.text}</ReactMarkdown>
        </div>
      )
    }
    
    // 默认渲染
    return <Bubble content={content.text} />
  }

  return (
    <div className="chat-container">
      <Chat
        messages={messages}
        renderMessageContent={renderMessageContent}
        onSend={handleSend}
      />
    </div>
  )
}
