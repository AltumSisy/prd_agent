// ============================================
// Streaming Text Animation Hook
// Creates typewriter effect for AI responses
// Uses requestIdleCallback for optimal timing
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseStreamingTextOptions {
  text: string;          // Full text to display
  speed?: number;        // Character delay in ms (default: 30)
  onComplete?: () => void; // Callback when animation ends
}

export function useStreamingText({
  text,
  speed = 30,
  onComplete,
}: UseStreamingTextOptions) {
  // Current displayed portion of text
  const [displayedText, setDisplayedText] = useState('');
  // Animation state flag
  const [isStreaming, setIsStreaming] = useState(false);
  // Character index counter
  const indexRef = useRef(0);
  // Animation interval reference
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start streaming animation
  const startStreaming = useCallback(() => {
    // Reset state
    setDisplayedText('');
    indexRef.current = 0;
    setIsStreaming(true);

    // Use requestIdleCallback for non-blocking start (pattern: js-request-idle-callback)
    const startAnimation = () => {
      intervalRef.current = setInterval(() => {
        if (indexRef.current < text.length) {
          // Append next character
          setDisplayedText(text.slice(0, indexRef.current + 1));
          indexRef.current++;
        } else {
          // Animation complete - cleanup
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsStreaming(false);
          onComplete?.();
        }
      }, speed);
    };

    // Browser API for idle scheduling
    if ('requestIdleCallback' in window) {
      requestIdleCallback(startAnimation);
    } else {
      // Fallback for browsers without requestIdleCallback
      startAnimation();
    }
  }, [text, speed, onComplete]);

  // Stop streaming animation
  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    displayedText,
    isStreaming,
    startStreaming,
    stopStreaming,
  };
}