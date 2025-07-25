import { useState, useCallback, useRef } from 'react';

interface StreamBlock {
  id: string;
  content: string;
  isComplete: boolean;
}

interface UseMarkdownStreamReturn {
  blocks: StreamBlock[];
  addChunk: (chunk: string) => void;
  clear: () => void;
  flush: () => void;
  isProcessing: boolean;
}

export function useMarkdownStream(): UseMarkdownStreamReturn {
  const [blocks, setBlocks] = useState<StreamBlock[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const bufferRef = useRef<string>('');
  const blockIdCounterRef = useRef<number>(0);

  const clear = useCallback(() => {
    setBlocks([]);
    bufferRef.current = '';
    blockIdCounterRef.current = 0;
    setIsProcessing(false);
  }, []);

  const processBuffer = useCallback(() => {
    const blockSeparator = '\n\n';
    let hasNewBlocks = false;

    while (bufferRef.current.includes(blockSeparator)) {
      const separatorIndex = bufferRef.current.indexOf(blockSeparator);
      const blockContent = bufferRef.current.substring(0, separatorIndex);
      bufferRef.current = bufferRef.current.substring(separatorIndex + blockSeparator.length);

      if (blockContent.trim().length > 0) {
        const newBlock: StreamBlock = {
          id: `block-${blockIdCounterRef.current++}`,
          content: blockContent,
          isComplete: true
        };

        setBlocks(prev => [...prev, newBlock]);
        hasNewBlocks = true;
      }
    }

    return hasNewBlocks;
  }, []);

  const addChunk = useCallback((chunk: string) => {
    setIsProcessing(true);
    bufferRef.current += chunk;
    processBuffer();
  }, [processBuffer]);

  const flush = useCallback(() => {
    if (bufferRef.current.length > 0) {
      const finalBlock: StreamBlock = {
        id: `block-${blockIdCounterRef.current++}`,
        content: bufferRef.current,
        isComplete: true
      };
      
      setBlocks(prev => [...prev, finalBlock]);
      bufferRef.current = '';
    }
    setIsProcessing(false);
  }, []);

  return {
    blocks,
    addChunk,
    clear,
    flush,
    isProcessing
  };
} 