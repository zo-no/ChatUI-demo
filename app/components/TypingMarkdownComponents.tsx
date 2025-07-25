/**
 * @fileoverview 流式Markdown渲染组件 - 基于react-markdown的高级文本渲染
 * 提供流式数据处理、打字机动画效果和丰富的Markdown样式支持
 * @author ChatUI Team
 * @version 1.0.0
 * @since 2024
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * 文本块接口定义
 * @interface TextBlock
 */
interface TextBlock {
  /** 块的唯一标识符 */
  id: string;
  /** 块的markdown内容 */
  content: string;
  /** 是否已完成显示 */
  isComplete: boolean;
  /** 当前应该显示的字符数（基于纯文本） */
  displayLength?: number;
}

/**
 * 打字机任务队列项接口
 * @interface TypingTask
 */
interface TypingTask {
  /** 要显示的字符 */
  char: string;
  /** 所属文本块的ID */
  blockId: string;
}

/**
 * 检测是否为表格内容 - 更严格的检测逻辑
 * @param {string} text - 待检测的文本
 * @returns {boolean} 是否为表格内容
 */
function isTableContent(text: string): boolean {
  const lines = text.split('\n').filter(line => line.trim());
  let tableRowCount = 0;
  let separatorCount = 0;
  let hasValidTableStructure = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检查是否为表格行（以|开头和结尾，且包含至少2个|）
    if (line.match(/^\|.*\|$/) && (line.match(/\|/g) || []).length >= 3) {
      tableRowCount++;
      
      // 检查下一行是否为分隔符行
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.match(/^\|[\s\-:|]+\|$/)) {
          separatorCount++;
          hasValidTableStructure = true;
        }
      }
    }
  }
  
  // 至少需要有表头、分隔符、和一行数据，且总行数至少3行
  return tableRowCount >= 3 && separatorCount >= 1 && hasValidTableStructure;
}

/**
 * 解析表格内容为行数组
 * @param {string} text - 表格markdown文本
 * @returns {string[]} 表格行数组
 */
function parseTableRows(text: string): string[] {
  const lines = text.split('\n').filter(line => line.trim());
  const tableRows: string[] = [];
  let headerProcessed = false;
  
  for (const line of lines) {
    if (line.trim().match(/^\|.*\|$/)) {
      if (!headerProcessed) {
        tableRows.push(line.trim());
        headerProcessed = true;
      } else if (!line.trim().match(/^\|[\s\-:|]+\|$/)) {
        // 不是分隔符行，是数据行
        tableRows.push(line.trim());
      }
    } else if (line.trim().match(/^\|[\s\-:|]+\|$/)) {
      // 这是分隔符行，跳过但标记已处理表头
      continue;
    }
  }
  
  return tableRows;
}

/**
 * 构建部分表格markdown
 * @param {string[]} rows - 表格行数组
 * @param {number} currentRowIndex - 当前行索引
 * @returns {string} 部分表格markdown
 */
function buildPartialTable(rows: string[], currentRowIndex: number): string {
  if (currentRowIndex < 0) return '';
  
  let result = '';
  for (let i = 0; i <= Math.min(currentRowIndex, rows.length - 1); i++) {
    result += rows[i] + '\n';
    if (i === 0 && rows.length > 1) {
      // 添加分隔符行（如果有多行的话）
      const headerCells = rows[0].split('|').length;
      const separator = '|' + Array(headerCells - 2).fill(' --- ').join('|') + '|';
      result += separator + '\n';
    }
  }
  
  return result;
}

/**
 * 移除markdown字符，返回纯文本用于流式显示
 * @param {string} text - 包含markdown语法的文本
 * @returns {string} 纯文本内容
 */
function stripMarkdown(text: string): string {
  return text
    // 移除标题 (#, ##, ###)
    .replace(/^#{1,6}\s+/gm, '')
    // 移除粗体 (**text** 或 __text__)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // 移除斜体 (*text* 或 _text_)
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // 移除代码块标记 (```代码```)
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```(\w*\n)?/g, '').replace(/```$/g, '');
    })
    // 移除行内代码 (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // 移除引用 (> text)
    .replace(/^>\s+/gm, '')
    // 处理表格 - 移除表格分隔符，保留内容
    .replace(/^\|(.+)\|$/gm, (match, content) => {
      return content.split('|').map((cell: string) => cell.trim()).join(' | ');
    })
    // 移除表格对齐行 (|:---|---:|)
    .replace(/^\|[\s:|-]+\|$/gm, '')
    // 移除列表标记 (- item, 1. item)
    .replace(/^[\s]*[-*+]\s+/gm, '• ')
    .replace(/^[\s]*\d+\.\s+/gm, '• ')
    // 清理多余的换行
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * 流式文本处理器 Hook - 改进版，适应严格模式，基于react-markdown渲染
 * @param {number} speed - 打字速度（毫秒）
 * @returns {object} 包含blocks、addChunk、flush、clear、isTyping的对象
 */
export function useStreamProcessor(speed: number = 20) {
  const [blocks, setBlocks] = useState<TextBlock[]>([]);
  const [textBuffer, setTextBuffer] = useState("");
  const [textQueue, setTextQueue] = useState<TypingTask[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const blockIdCounter = useRef(0);
  const isInitialized = useRef(false);

  /**
   * 添加数据块到缓冲区
   * @param {string} chunk - 新的文本块
   */
  const addChunk = useCallback((chunk: string) => {
    setTextBuffer(prev => prev + chunk);
  }, []);

  /**
   * 处理缓冲区，提取完整的内容块 - 优化状态更新
   */
  const processBuffer = useCallback(() => {
    setTextBuffer(prevBuffer => {
      let buffer = prevBuffer;
      const blockSeparator = '\n\n';
      const newBlocks: TextBlock[] = [];
      const newTasks: TypingTask[] = [];
      
      while (buffer.includes(blockSeparator)) {
        const separatorIndex = buffer.indexOf(blockSeparator);
        const blockContent = buffer.substring(0, separatorIndex);
        buffer = buffer.substring(separatorIndex + blockSeparator.length);

        if (blockContent.trim().length > 0) {
          const blockId = `block-${blockIdCounter.current++}`;
          
          // 创建新块
          newBlocks.push({
            id: blockId,
            content: blockContent,
            isComplete: false,
            displayLength: 0
          });

          // 将这个块的纯文本添加到任务队列
          const plainText = stripMarkdown(blockContent);
          for (const char of plainText) {
            newTasks.push({ char, blockId });
          }
        }
      }

      // 批量更新状态，避免多次渲染
      if (newBlocks.length > 0) {
        setBlocks(prevBlocks => [...prevBlocks, ...newBlocks]);
        setTextQueue(prevQueue => [...prevQueue, ...newTasks]);
      }
      
      return buffer;
    });
  }, []);

  /**
   * 处理流结束时剩余的内容 - 优化状态更新
   */
  const flush = useCallback(() => {
    setTextBuffer(prevBuffer => {
      if (prevBuffer.trim().length > 0) {
        const blockId = `block-${blockIdCounter.current++}`;
        const newBlock: TextBlock = {
          id: blockId,
          content: prevBuffer,
          isComplete: false,
          displayLength: 0
        };

        // 将纯文本添加到任务队列
        const plainText = stripMarkdown(prevBuffer);
        const newTasks: TypingTask[] = [];
        for (const char of plainText) {
          newTasks.push({ char, blockId });
        }

        // 批量更新状态
        setBlocks(prevBlocks => [...prevBlocks, newBlock]);
        setTextQueue(prevQueue => [...prevQueue, ...newTasks]);
      }
      return '';
    });
  }, []);

  /**
   * 启动打字机效果 - 添加防护机制
   */
  const startTyping = useCallback(() => {
    if (isTyping || intervalRef.current) return;
    
    setIsTyping(true);
    intervalRef.current = setInterval(() => {
      setTextQueue(prevQueue => {
        if (prevQueue.length > 0) {
          const task = prevQueue[0];
          const remainingQueue = prevQueue.slice(1);
          
          // 更新对应块的显示内容和显示长度
          setBlocks(prevBlocks => 
            prevBlocks.map(block => {
              if (block.id === task.blockId) {
                const plainText = stripMarkdown(block.content);
                const remainingCharsForThisBlock = remainingQueue.filter(t => t.blockId === task.blockId).length;
                const currentDisplayLength = plainText.length - remainingCharsForThisBlock;
                return {
                  ...block,
                  displayLength: currentDisplayLength,
                  isComplete: currentDisplayLength >= plainText.length
                };
              }
              return block;
            })
          );
          
          return remainingQueue;
        } else {
          // 队列为空，停止打字
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsTyping(false);
          return [];
        }
      });
    }, speed);
  }, [isTyping, speed]);

  /**
   * 停止打字机效果
   */
  const stopTyping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTyping(false);
  }, []);

  /**
   * 清空所有内容
   */
  const clear = useCallback(() => {
    stopTyping();
    setBlocks([]);
    setTextBuffer("");
    setTextQueue([]);
    blockIdCounter.current = 0;
  }, [stopTyping]);

  // 监听缓冲区变化，自动处理 - 添加初始化检查
  useEffect(() => {
    if (textBuffer && isInitialized.current) {
      processBuffer();
    }
    if (!isInitialized.current) {
      isInitialized.current = true;
    }
  }, [textBuffer, processBuffer]);

  // 监听打字队列变化，自动启动打字机 - 添加防护
  useEffect(() => {
    if (textQueue.length > 0 && !isTyping && !intervalRef.current) {
      startTyping();
    }
  }, [textQueue.length, isTyping, startTyping]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    blocks,
    addChunk,
    flush,
    clear,
    isTyping
  };
}

/**
 * 单个文本块组件 - 支持ReactMarkdown渲染和字符动画，包括表格逐行渐现
 * @param {object} props - 组件属性
 * @param {TextBlock} props.block - 文本块数据
 * @returns {JSX.Element} 渲染的文本块组件
 */
export function TextBlockComponent({ block }: { 
  block: TextBlock;
}) {
  // 计算当前块应该显示的字符数（基于纯文本）
  const plainText = stripMarkdown(block.content);
  const displayLength = block.displayLength ?? 0;
  const isTypingComplete = displayLength >= plainText.length;

  // 检测是否为表格内容
  const isTable = isTableContent(block.content);
  
  // 如果是表格，计算当前应该显示的行数
  let currentTableContent = block.content;
  if (isTable && !isTypingComplete) {
    const tableRows = parseTableRows(block.content);
    const progressRatio = displayLength / plainText.length;
    const currentRowIndex = Math.floor((tableRows.length - 1) * progressRatio);
    currentTableContent = buildPartialTable(tableRows, currentRowIndex);
  }

  /**
   * 自定义ReactMarkdown组件配置，提供丰富的样式和动画效果
   */
  const components = {
    // 段落
    p: ({ children }: any) => (
      <p style={{ margin: '0.5em 0', lineHeight: '1.6' }}>
        {children}
      </p>
    ),
    // 标题
    h1: ({ children }: any) => (
      <h1 style={{ fontSize: '1.8em', fontWeight: 'bold', margin: '1em 0 0.5em 0', color: '#1f2937', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.3em' }}>
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '1em 0 0.5em 0', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.2em' }}>
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 style={{ fontSize: '1.3em', fontWeight: 'bold', margin: '1em 0 0.5em 0', color: '#4b5563' }}>
        {children}
      </h3>
    ),
    // 强调
    strong: ({ children }: any) => (
      <strong style={{ fontWeight: 'bold', color: '#2563eb' }}>
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em style={{ fontStyle: 'italic', color: '#7c3aed' }}>
        {children}
      </em>
    ),
    // 列表
    ul: ({ children }: any) => (
      <ul style={{ paddingLeft: '1.5em', margin: '0.5em 0' }}>
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol style={{ paddingLeft: '1.5em', margin: '0.5em 0' }}>
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li style={{ margin: '0.25em 0', lineHeight: '1.5' }}>
        {children}
      </li>
    ),
    // 代码
    code: ({ children }: any) => (
      <code style={{ 
        backgroundColor: '#f1f5f9', 
        color: '#334155',
        padding: '0.2em 0.4em', 
        borderRadius: '3px',
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
        fontSize: '0.875em'
      }}>
        {children}
      </code>
    ),
    // 代码块
    pre: ({ children }: any) => (
      <pre style={{ 
        backgroundColor: '#f8fafc', 
        border: '1px solid #e2e8f0',
        padding: '1em', 
        borderRadius: '6px',
        overflow: 'auto',
        margin: '1em 0',
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace'
      }}>
        {children}
      </pre>
    ),
    // 引用
    blockquote: ({ children }: any) => (
      <blockquote style={{
        borderLeft: '4px solid #3b82f6',
        paddingLeft: '1em',
        margin: '1em 0',
        fontStyle: 'italic',
        color: '#64748b',
        backgroundColor: '#f8fafc',
        padding: '0.5em 1em',
        borderRadius: '0 4px 4px 0'
      }}>
        {children}
      </blockquote>
    ),
    // 表格 - 简化样式，背景与聊天框一致
    table: ({ children }: any) => (
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        margin: '1.5em 0',
        backgroundColor: 'white'
      }}>
        {children}
      </table>
    ),
    thead: ({ children }: any) => (
      <thead>
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }: any) => {
      return (
        <tr 
          className={isTable && !isTypingComplete ? 'table-row-animated' : ''}
          style={{
            opacity: isTable && !isTypingComplete ? 0 : 1,
            transform: isTable && !isTypingComplete ? 'translateY(20px)' : 'translateY(0)',
            animation: isTable && !isTypingComplete ? 'rowSlideIn 0.8s ease-out forwards' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          {children}
        </tr>
      );
    },
    th: ({ children, style }: any) => (
      <th style={{
        border: '1px solid #e0e0e0',
        padding: '10px 12px',
        textAlign: style?.textAlign || 'left',
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold',
        color: '#333',
        ...style
      }}>
        {children}
      </th>
    ),
    td: ({ children, style }: any) => (
      <td style={{
        border: '1px solid #e0e0e0',
        padding: '10px 12px',
        textAlign: style?.textAlign || 'left',
        color: '#333',
        ...style
      }}>
        {children}
      </td>
    ),
  };

  return (
    <div className="content-block">
      
      {isTypingComplete ? (
        // 打字完成，显示渲染后的 ReactMarkdown
        <ReactMarkdown 
          components={components}
          remarkPlugins={[remarkGfm]}
        >
          {block.content}
        </ReactMarkdown>
      ) : isTable ? (
        // 表格内容在打字过程中支持逐行渐现
        <ReactMarkdown 
          components={components}
          remarkPlugins={[remarkGfm]}
        >
          {currentTableContent}
        </ReactMarkdown>
      ) : (
        // 正在打字，显示带动画的纯文本（无markdown字符）
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          fontFamily: 'inherit',
          margin: 0,
          lineHeight: '1.6'
        }}>
          {Array.from(plainText).map((char, index) => {
            if (index < displayLength) {
              return (
                <span key={`${block.id}-${index}`} className="char-fade-in">
                  {char}
                </span>
              );
            }
            return null;
          })}
        </pre>
      )}
    </div>
  );
}

/**
 * 通用打字机效果 Hook（保持兼容性）
 * @param {string} text - 要显示的文本内容
 * @param {number} speed - 打字速度（毫秒），默认20ms
 * @param {boolean} enabled - 是否启用打字效果，默认true
 * @returns {object} 包含displayText和isComplete的对象
 */
export function useTypingEffect(text: string, speed: number = 20, enabled: boolean = true) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setDisplayText(text);
      setIsComplete(true);
      return;
    }

    setDisplayText("");
    setIsComplete(false);
    
    if (text) {
      let i = 0;
      const intervalId = setInterval(() => {
        if (i < text.length) {
          setDisplayText((prev) => prev + text[i]);
          i++;
        } else {
          clearInterval(intervalId);
          setIsComplete(true);
        }
      }, speed);
      
      return () => clearInterval(intervalId);
    } else {
      setIsComplete(true);
    }
  }, [text, speed, enabled]);

  return { displayText, isComplete };
}

 