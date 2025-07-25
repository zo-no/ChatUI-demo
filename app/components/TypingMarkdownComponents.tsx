"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// 文本块接口
interface TextBlock {
  id: string;
  content: string;
  isComplete: boolean;
}

// 打字机任务队列项
interface TypingTask {
  char: string;
  blockId: string;
}

// 流式文本处理器 Hook - 模仿 1-1.html 中的 MarkdownStreamProcessor
export function useStreamProcessor(speed: number = 20) {
  const [blocks, setBlocks] = useState<TextBlock[]>([]);
  const [textBuffer, setTextBuffer] = useState("");
  const [textQueue, setTextQueue] = useState<TypingTask[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const blockIdCounter = useRef(0);

  // 添加数据块到缓冲区
  const addChunk = useCallback((chunk: string) => {
    setTextBuffer(prev => prev + chunk);
  }, []);

  // 处理缓冲区，提取完整的内容块
  const processBuffer = useCallback(() => {
    setTextBuffer(prevBuffer => {
      let buffer = prevBuffer;
      const blockSeparator = '\n\n';
      
      while (buffer.includes(blockSeparator)) {
        const separatorIndex = buffer.indexOf(blockSeparator);
        const blockContent = buffer.substring(0, separatorIndex);
        buffer = buffer.substring(separatorIndex + blockSeparator.length);

        if (blockContent.trim().length > 0) {
          const blockId = `block-${blockIdCounter.current++}`;
          
          // 创建新块
          setBlocks(prevBlocks => [...prevBlocks, {
            id: blockId,
            content: blockContent,
            isComplete: false
          }]);

          // 将这个块的文本添加到打字队列
          for (const char of blockContent) {
            setTextQueue(prevQueue => [...prevQueue, { char, blockId }]);
          }
        }
      }
      
      return buffer;
    });
  }, []);

  // 处理流结束时剩余的内容
  const flush = useCallback(() => {
    setTextBuffer(prevBuffer => {
      if (prevBuffer.trim().length > 0) {
        const blockId = `block-${blockIdCounter.current++}`;
        
        setBlocks(prevBlocks => [...prevBlocks, {
          id: blockId,
          content: prevBuffer,
          isComplete: false
        }]);

        for (const char of prevBuffer) {
          setTextQueue(prevQueue => [...prevQueue, { char, blockId }]);
        }
      }
      return '';
    });
  }, []);

  // 启动打字机效果
  const startTyping = useCallback(() => {
    if (isTyping) return;
    
    setIsTyping(true);
    intervalRef.current = setInterval(() => {
      setTextQueue(prevQueue => {
        if (prevQueue.length > 0) {
          const task = prevQueue[0];
          const remainingQueue = prevQueue.slice(1);
          
          // 更新对应块的显示内容
          setBlocks(prevBlocks => 
            prevBlocks.map(block => {
              if (block.id === task.blockId) {
                const currentLength = block.content.length - remainingQueue.filter(t => t.blockId === task.blockId).length;
                return {
                  ...block,
                  isComplete: currentLength >= block.content.length
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

  // 停止打字机效果
  const stopTyping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTyping(false);
  }, []);

  // 清空所有内容
  const clear = useCallback(() => {
    stopTyping();
    setBlocks([]);
    setTextBuffer("");
    setTextQueue([]);
    blockIdCounter.current = 0;
  }, [stopTyping]);

  // 监听缓冲区变化，自动处理
  useEffect(() => {
    processBuffer();
  }, [textBuffer, processBuffer]);

  // 监听打字队列变化，自动启动打字机
  useEffect(() => {
    if (textQueue.length > 0 && !isTyping) {
      startTyping();
    }
  }, [textQueue.length, isTyping, startTyping]);

  return {
    blocks,
    addChunk,
    flush,
    clear,
    isTyping,
    textQueue
  };
}

// 单个文本块组件 - 显示部分打字内容，每个字符带有浮动显现动画
export function TextBlockComponent({ block, textQueue }: { 
  block: TextBlock;
  textQueue: TypingTask[];
}) {
  // 计算当前块应该显示的字符数
  const remainingCharsForThisBlock = textQueue.filter(task => task.blockId === block.id).length;
  const displayLength = block.content.length - remainingCharsForThisBlock;

  return (
    <div className="content-block">
      <pre style={{ 
        whiteSpace: 'pre-wrap', 
        fontFamily: 'inherit',
        margin: 0,
        lineHeight: '1.6'
      }}>
        {Array.from(block.content).map((char, index) => {
          // 只显示已经"打字"出来的字符
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
    </div>
  );
}

// 通用打字机效果 Hook（保持兼容性）
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

 