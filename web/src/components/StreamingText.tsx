// ============================================
// Streaming Text Component
// Displays animated typewriter effect for AI responses
// ============================================

import { useEffect } from 'react';
import { useStreamingText } from '../hooks/useStreamingText';

interface StreamingTextProps {
  text: string;           // Text to animate
  startDelay?: number;    // Delay before starting (ms)
  speed?: number;         // Character speed (ms)
  onComplete?: () => void; // Callback when animation finishes
}

export function StreamingText({ text, startDelay = 500, speed = 30, onComplete }: StreamingTextProps) {
  const { displayedText, isStreaming, startStreaming } = useStreamingText({
    text,
    speed,
    onComplete,
  });

  // Auto-start streaming after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      startStreaming();
    }, startDelay);
    return () => clearTimeout(timer);
  }, [startStreaming, startDelay]);

  return (
    <span className="inline">
      {displayedText}
      {/* Typing cursor indicator */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-accent-purple animate-pulse ml-1" />
      )}
    </span>
  );
}