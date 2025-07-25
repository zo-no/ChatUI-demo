"use client";

import React, { useState, useRef, useEffect } from "react";
import Chat, { Bubble, useMessages } from "@chatui/core";

import { simulateStreamData } from "../data/mockResponses";
import { useStreamProcessor, TextBlockComponent, useTypingEffect } from "./TypingMarkdownComponents";
import './streaming-animations.css';

const initialMessages: any[] = [];

// 流式文本块组件
function StreamingTextBlock({ content, enableTyping }: { content: string, enableTyping: boolean }) {
  const { displayText } = useTypingEffect(content, 30, enableTyping);
  
  return (
    <pre style={{ 
      whiteSpace: 'pre-wrap', 
      fontFamily: 'inherit',
      margin: 0,
      lineHeight: '1.6'
    }}>
      {displayText}
    </pre>
  );
}

export default function ChatUICore() {
  // 消息列表
  const { messages, appendMsg, updateMsg } = useMessages(initialMessages);
  
  const { blocks, addChunk, clear, flush, isTyping, textQueue } = useStreamProcessor(50);
  const [currentStreamingMsgId, setCurrentStreamingMsgId] = useState<string | null>(null);

  // 获取滚动容器引用
  const messagesRef = useRef<any>(null);

  // 发送回调
  function handleSend(type: string, val: string) {
    if (type === "text" && val.trim()) {
      // 添加用户消息
      appendMsg({
        type: "text",
        content: { text: val },
        position: "right",
      });

      // 清空之前的流式数据
      clear();

      // 模拟流式数据接收
      setTimeout(() => {
        // 添加流式AI消息
        const streamingMsg = appendMsg({
          type: "streaming",
          content: { text: "" },
          position: "left",
        });
        
        setCurrentStreamingMsgId(streamingMsg as string);

        // 开始流式数据传输
        simulateStreamData(
          val,
          (chunk: string) => {
            // 添加数据块到流处理器
            addChunk(chunk);
          },
          () => {
            // 流式传输完成，处理最后的缓冲区内容
            flush();
            setCurrentStreamingMsgId(null);
          }
        );
      }, 200);
    }
  }

  // 渲染流式消息内容 - 使用新的块级渲染方式
  function renderStreamingContent() {
    return (
      <div className="streaming-content">
        {blocks.map((block) => (
          <TextBlockComponent 
            key={block.id} 
            block={block} 
            textQueue={textQueue}
          />
        ))}
      </div>
    );
  }

  // 传统打字机效果（用于非流式消息）
  function renderMarkdownForTyping(text: string) {
    return (
      <div className="typing-content">
        <StreamingTextBlock content={text} enableTyping={true} />
      </div>
    );
  }

  function renderMessageContent(msg: any) {
    const { type, content } = msg;

    // 根据消息类型渲染不同内容
    if (type === "streaming") {
      // 流式消息：使用新的流式块级渲染
      return renderStreamingContent();
    }

    if (type === "typing") {
      // 传统打字气泡效果
      return renderMarkdownForTyping(content.text);
    }

    // 普通文本消息
    if (type === "text") {
      return (
        <div className="text-content">
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            {content.text}
          </pre>
        </div>
      );
    }
    
    // 默认渲染
    return <Bubble content={content.text} />;
  }

  return (
    <div className="chat-container">
      <Chat
        ref={messagesRef}
        messages={messages}
        renderMessageContent={renderMessageContent}
        onSend={handleSend}
      />
    </div>
  );
}
