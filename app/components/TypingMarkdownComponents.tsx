/**
 * @fileoverview 流式Markdown渲染组件 - 基于react-markdown的高级文本渲染
 * 提供流式数据处理和丰富的Markdown样式支持
 * @author ChatUI Team
 * @version 2.0.0
 * @since 2024
 */

"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * 文本块接口定义
 * @interface TextBlock
 */
interface TextBlock {
  /** 块的唯一标识符 */
  id: string;
  /** 块的markdown内容 */
  content: string;
  /** 是否已完成显示（预留字段，保持兼容性） */
  isComplete: boolean;
  /** 当前显示的字符数（预留字段，保持兼容性） */
  displayLength?: number;
  /** 是否为表格内容（预留字段，保持兼容性） */
  isTable?: boolean;
}

/**
 * 检测是否为表格内容 - 更严格的检测逻辑
 * @param {string} text - 待检测的文本
 * @returns {boolean} 是否为表格内容
 */
function isTableContent(text: string): boolean {
  const lines = text.split("\n").filter((line) => line.trim());
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
 * 移除markdown字符，返回纯文本用于流式显示
 * @param {string} text - 包含markdown语法的文本
 * @returns {string} 纯文本内容
 */
function stripMarkdown(text: string): string {
  return (
    text
      // 移除标题 (#, ##, ###)
      .replace(/^#{1,6}\s+/gm, "")
      // 移除粗体 (**text** 或 __text__)
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      // 移除斜体 (*text* 或 _text_)
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      // 移除代码块标记 (```代码```)
      .replace(/```[\s\S]*?```/g, (match) => {
        return match.replace(/```(\w*\n)?/g, "").replace(/```$/g, "");
      })
      // 移除行内代码 (`code`)
      .replace(/`([^`]+)`/g, "$1")
      // 移除引用 (> text)
      .replace(/^>\s+/gm, "")
      // 处理表格 - 移除表格分隔符，保留内容
      .replace(/^\|(.+)\|$/gm, (match, content) => {
        return content
          .split("|")
          .map((cell: string) => cell.trim())
          .join(" | ");
      })
      // 移除表格对齐行 (|:---|---:|)
      .replace(/^\|[\s:|-]+\|$/gm, "")
      // 移除列表标记 (- item, 1. item)
      .replace(/^[\s]*[-*+]\s+/gm, "• ")
      .replace(/^[\s]*\d+\.\s+/gm, "• ")
      // 清理多余的换行
      .replace(/\n{3,}/g, "\n\n")
  );
}

/**
 * 流式文本处理器 Hook - 简化版，移除打字机效果，专注于流式数据处理
 * @param {number} speed - 预留参数，保持API兼容性
 * @returns {object} 包含blocks、addChunk、flush、clear的对象
 */
export function useStreamProcessor(speed: number = 50) {
  const [blocks, setBlocks] = useState<TextBlock[]>([]);
  const [textBuffer, setTextBuffer] = useState("");
  const blockIdCounter = useRef(0);
  const isInitialized = useRef(false);

  /**
   * 添加数据块到缓冲区
   * @param {string} chunk - 新的文本块
   */
  const addChunk = useCallback((chunk: string) => {
    setTextBuffer((prev) => prev + chunk);
  }, []);

  /**
   * 处理缓冲区，提取完整的内容块 - 简化版本，直接显示内容
   */
  const processBuffer = useCallback(() => {
    setTextBuffer((prevBuffer) => {
      let buffer = prevBuffer;
      const blockSeparator = "\n\n";
      const newBlocks: TextBlock[] = [];

      while (buffer.includes(blockSeparator)) {
        const separatorIndex = buffer.indexOf(blockSeparator);
        const blockContent = buffer.substring(0, separatorIndex);
        buffer = buffer.substring(separatorIndex + blockSeparator.length);

        if (blockContent.trim().length > 0) {
          const blockId = `block-${blockIdCounter.current++}`;

          // 创建新块 - 所有内容都立即完成显示
          newBlocks.push({
            id: blockId,
            content: blockContent,
            isComplete: true,
            displayLength: stripMarkdown(blockContent).length,
            isTable: isTableContent(blockContent),
          });
        }
      }

      // 批量更新状态
      if (newBlocks.length > 0) {
        setBlocks((prevBlocks) => [...prevBlocks, ...newBlocks]);
      }

      return buffer;
    });
  }, []);

  /**
   * 处理流结束时剩余的内容 - 简化版本
   */
  const flush = useCallback(() => {
    setTextBuffer((prevBuffer) => {
      if (prevBuffer.trim().length > 0) {
        const blockId = `block-${blockIdCounter.current++}`;
        const newBlock: TextBlock = {
          id: blockId,
          content: prevBuffer,
          isComplete: true,
          displayLength: stripMarkdown(prevBuffer).length,
          isTable: isTableContent(prevBuffer),
        };

        // 更新状态
        setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
      }
      return "";
    });
  }, []);

  /**
   * 清空所有内容
   */
  const clear = useCallback(() => {
    setBlocks([]);
    setTextBuffer("");
    blockIdCounter.current = 0;
  }, []);

  // 监听缓冲区变化，自动处理
  useEffect(() => {
    if (textBuffer && isInitialized.current) {
      processBuffer();
    }

    if (!isInitialized.current) {
      isInitialized.current = true;
    }
  }, [textBuffer, processBuffer]);

  return {
    blocks,
    addChunk,
    flush,
    clear,
  };
}

/**
 * 单个文本块组件 - 基于ReactMarkdown的简洁渲染，移除打字机效果
 * 使用 React.memo 优化，防止已完成的块重新渲染
 * @param {object} props - 组件属性
 * @param {TextBlock} props.block - 文本块数据
 * @returns {JSX.Element} 渲染的文本块组件
 */
export const TextBlockComponent = memo(
  ({ block }: { block: TextBlock }) => {
    // 直接显示完整内容，不需要计算显示长度
    const isTable = block.isTable || isTableContent(block.content);

    /**
     * 为文本内容添加字符级淡入效果
     * @param children - 子元素
     * @param baseDelay - 基础延迟时间(ms)
     */
    const addCharFadeEffect = (children: any, baseDelay: number = 0) => {
      return React.Children.map(children, (child, index) => {
        if (typeof child === "string") {
          return Array.from(child).map((char, charIndex) => (
            <span
              key={`${block.id}-${index}-${charIndex}`}
              className="char-fade-in"
              style={{
                animationDelay: `${baseDelay + charIndex * 0.02}s`,
              }}
            >
              {char}
            </span>
          ));
        }
        return child;
      });
    };

    /**
     * 自定义ReactMarkdown组件配置，提供丰富的样式效果
     */
    const components = {
      // 段落 - 添加字符淡入效果
      p: ({ children }: any) => (
        <p style={{ margin: "0.5em 0", lineHeight: "1.6" }}>
          {!isTable ? addCharFadeEffect(children) : children}
        </p>
      ),
      // 标题 - 添加字符淡入效果
      h1: ({ children }: any) => (
        <h1
          style={{
            fontSize: "1.8em",
            fontWeight: "bold",
            margin: "1em 0 0.5em 0",
            color: "#1f2937",
            borderBottom: "2px solid #e5e7eb",
            paddingBottom: "0.3em",
          }}
        >
          {!isTable ? addCharFadeEffect(children, 0.1) : children}
        </h1>
      ),
      h2: ({ children }: any) => (
        <h2
          style={{
            fontSize: "1.5em",
            fontWeight: "bold",
            margin: "1em 0 0.5em 0",
            color: "#374151",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "0.2em",
          }}
        >
          {!isTable ? addCharFadeEffect(children, 0.1) : children}
        </h2>
      ),
      h3: ({ children }: any) => (
        <h3
          style={{
            fontSize: "1.3em",
            fontWeight: "bold",
            margin: "1em 0 0.5em 0",
            color: "#4b5563",
          }}
        >
          {!isTable ? addCharFadeEffect(children, 0.1) : children}
        </h3>
      ),
      // 强调
      strong: ({ children }: any) => (
        <strong style={{ fontWeight: "bold", color: "#2563eb" }}>
          {children}
        </strong>
      ),
      em: ({ children }: any) => (
        <em style={{ fontStyle: "italic", color: "#7c3aed" }}>{children}</em>
      ),
      // 列表项 - 添加字符淡入效果
      ul: ({ children }: any) => (
        <ul style={{ paddingLeft: "1.5em", margin: "0.5em 0" }}>{children}</ul>
      ),
      ol: ({ children }: any) => (
        <ol style={{ paddingLeft: "1.5em", margin: "0.5em 0" }}>{children}</ol>
      ),
      li: ({ children }: any) => (
        <li style={{ margin: "0.25em 0", lineHeight: "1.5" }}>
          {!isTable ? addCharFadeEffect(children, 0.05) : children}
        </li>
      ),
      // 代码
      code: ({ children }: any) => (
        <code
          style={{
            backgroundColor: "#f1f5f9",
            color: "#334155",
            padding: "0.2em 0.4em",
            borderRadius: "3px",
            fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
            fontSize: "0.875em",
          }}
        >
          {children}
        </code>
      ),
      // 代码块
      pre: ({ children }: any) => (
        <pre
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            padding: "1em",
            borderRadius: "6px",
            overflow: "auto",
            margin: "1em 0",
            fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
          }}
        >
          {children}
        </pre>
      ),
      // 引用 - 添加字符淡入效果
      blockquote: ({ children }: any) => (
        <blockquote
          style={{
            borderLeft: "4px solid #3b82f6",
            paddingLeft: "1em",
            margin: "1em 0",
            fontStyle: "italic",
            color: "#64748b",
            backgroundColor: "#f8fafc",
            padding: "0.5em 1em",
            borderRadius: "0 4px 4px 0",
          }}
        >
          {!isTable ? addCharFadeEffect(children, 0.08) : children}
        </blockquote>
      ),
      // 表格 - 简化样式，背景与聊天框一致
      table: ({ children }: any) => (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            margin: "1.5em 0",
            backgroundColor: "white",
          }}
        >
          {children}
        </table>
      ),
      thead: ({ children }: any) => <thead>{children}</thead>,
      tbody: ({ children }: any) => <tbody>{children}</tbody>,
      tr: ({ children, ...props }: any) => {
        return <tr>{children}</tr>;
      },
      th: ({ children, style }: any) => (
        <th
          style={{
            border: "1px solid #e0e0e0",
            padding: "10px 12px",
            textAlign: style?.textAlign || "left",
            backgroundColor: "#f5f5f5",
            fontWeight: "bold",
            color: "#333",
            ...style,
          }}
        >
          {children}
        </th>
      ),
      td: ({ children, style }: any) => (
        <td
          style={{
            border: "1px solid #e0e0e0",
            padding: "10px 12px",
            textAlign: style?.textAlign || "left",
            color: "#333",
            ...style,
          }}
        >
          {children}
        </td>
      ),
    };

    return (
      <div className="content-block">
        <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
          {block.content}
        </ReactMarkdown>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 简化的比较函数：如果ID和内容相同，则不重新渲染
    const prevBlock = prevProps.block;
    const nextBlock = nextProps.block;

    return (
      prevBlock.id === nextBlock.id && prevBlock.content === nextBlock.content
    );
  }
);

// 设置displayName便于调试
TextBlockComponent.displayName = "TextBlockComponent";
