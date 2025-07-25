/**
 * @fileoverview 聊天UI核心组件 - 基于react-markdown的现代化聊天界面
 * 支持流式渲染、打字机效果和丰富的Markdown内容显示
 * @author ChatUI Team
 * @version 1.0.0
 * @since 2024
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import Chat, { Bubble, useMessages } from "@chatui/core";

import { simulateStreamData } from "../data/mockResponses";
import {
  useStreamProcessor,
  TextBlockComponent,
  useTypingEffect,
} from "./TypingMarkdownComponents";
import "./streaming-animations.css";

/**
 * 开发环境日志工具，避免严格模式下的重复日志
 * @returns {function} 日志记录函数
 */
function useDevLog() {
  const loggedItems = useRef(new Set<string>());
  const renderCount = useRef(0);
  const isStrictMode = useRef(false);
  
  // 检测严格模式
  useEffect(() => {
    renderCount.current++;
    if (renderCount.current > 1) {
      isStrictMode.current = true;
      console.warn('🔍 React Strict Mode detected - some effects may run twice');
    }
  }, []);
  
  return (label: string, data: any, options?: { force?: boolean; type?: 'log' | 'warn' | 'error' }) => {
    if (process.env.NODE_ENV === 'development') {
      const { force = false, type = 'log' } = options || {};
      const key = JSON.stringify({ label, data });
      
      if (force || !loggedItems.current.has(key)) {
        const prefix = isStrictMode.current ? '🔄 [Strict Mode]' : '📝';
        const message = `${prefix} ${label}`;
        
        switch (type) {
          case 'warn':
            console.warn(message, data);
            break;
          case 'error':
            console.error(message, data);
            break;
          default:
            console.log(message, data);
        }
        
        if (!force) {
          loggedItems.current.add(key);
          // 清理旧的日志记录，避免内存泄漏
          if (loggedItems.current.size > 100) {
            loggedItems.current.clear();
          }
        }
      }
    }
  };
}

/**
 * 性能监控 Hook，用于检测严格模式的性能影响
 * @param {string} componentName - 组件名称用于日志标识
 * @returns {object} 包含渲染次数、副作用次数和启动时间的性能指标
 */
function useStrictModeMonitor(componentName: string) {
  const renderCount = useRef(0);
  const effectCount = useRef(0);
  const startTime = useRef(Date.now());
  const lastRender = useRef(Date.now());

  // 监控渲染次数
  renderCount.current++;
  const now = Date.now();
  const timeSinceLastRender = now - lastRender.current;
  lastRender.current = now;

  // 监控副作用执行
  useEffect(() => {
    effectCount.current++;
    
    if (process.env.NODE_ENV === 'development') {
      const isLikelyStrictMode = renderCount.current % 2 === 0 && renderCount.current > 1;
      
      if (isLikelyStrictMode && effectCount.current % 2 === 0) {
        console.warn(`⚡ ${componentName} - Strict Mode detected:`, {
          renders: renderCount.current,
          effects: effectCount.current,
          lastRenderDelay: timeSinceLastRender,
          totalTime: now - startTime.current
        });
      }
    }
  });

  return {
    renderCount: renderCount.current,
    effectCount: effectCount.current,
    timeSinceStart: now - startTime.current
  };
}

const initialMessages: any[] = [];

/**
 * 流式文本块组件，提供基础的打字机效果
 * @param {object} props - 组件属性
 * @param {string} props.content - 文本内容
 * @param {boolean} props.enableTyping - 是否启用打字效果
 * @returns {JSX.Element} 流式文本块组件
 */
function StreamingTextBlock({
  content,
  enableTyping,
}: {
  content: string;
  enableTyping: boolean;
}) {
  const { displayText } = useTypingEffect(content, 30, enableTyping);

  return (
    <pre
      style={{
        whiteSpace: "pre-wrap",
        fontFamily: "inherit",
        margin: 0,
        lineHeight: "1.6",
      }}
    >
      {displayText}
    </pre>
  );
}

/**
 * 聊天UI核心组件 - 基于react-markdown的流式渲染聊天界面
 * @returns {JSX.Element} 聊天界面组件
 */
export default function ChatUICore() {
  // 性能监控
  const monitor = useStrictModeMonitor('ChatUICore');
  
  // 消息列表
  const { messages, appendMsg, updateMsg } = useMessages(initialMessages);

  const { blocks, addChunk, clear, flush, isTyping } = useStreamProcessor(20);

  // 获取滚动容器引用
  const messagesRef = useRef<any>(null);

  // 开发环境日志工具
  const devLog = useDevLog();

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
          }
        );
      }, 200);
    }
  }

  // 渲染流式内容
  function renderStreamingContent() {
    return (
      <div className="streaming-content">
        {blocks.map((block) => (
          <TextBlockComponent key={block.id} block={block} />
        ))}
      </div>
    );
  }

  // 传统打字机效果（用于非流式消息）
  function renderMarkdownForTyping(text: string) {
    return (
      <div className="typing-content">
        <StreamingTextBlock content={text} enableTyping={isTyping} />
      </div>
    );
  }

  function renderMessageContent(msg: any) {
    const { type, content } = msg;
    
    // 使用防重复的开发日志，包含性能信息
    devLog('【msg】', {
      type, 
      content: typeof content === 'object' ? content : { text: content },
      id: msg.id || 'no-id',
      performanceInfo: {
        renders: monitor.renderCount,
        effects: monitor.effectCount,
        uptime: monitor.timeSinceStart
      }
    });

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
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
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
