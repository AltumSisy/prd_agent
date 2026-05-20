// ============================================
// Chat Preview Component
// Mock conversation UI showing AI capabilities
// Memoized for performance (pattern: rerender-memo)
// ============================================

import { memo, useState, useEffect } from 'react';
import { StreamingText } from './StreamingText';
import { useTranslation } from '../i18n/TranslationContext';

// Static JSX hoisted outside component (pattern: rendering-hoist-jsx)
const UserAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center text-sm font-medium text-neutral-700">
    U
  </div>
);

const AiAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-accent-purple flex items-center justify-center text-sm font-medium text-white">
    AI
  </div>
);

function ChatPreviewComponent() {
  const { t } = useTranslation();
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [showAiResponse, setShowAiResponse] = useState(false);

  // Staggered reveal animation timing
  useEffect(() => {
    // Show user message immediately
    setShowUserMessage(true);
    // Show AI response after 300ms
    const timer = setTimeout(() => {
      setShowAiResponse(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const userMessage = t('userMessage');
  const aiResponse = t('aiResponse');

  return (
    <div className="glass-effect rounded-xl p-4 max-w-md mx-auto">
      {/* User message */}
      <div
        className={`flex gap-3 items-start mb-4 transition-opacity duration-300 ${
          showUserMessage ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <UserAvatar />
        <div className="bg-neutral-100 rounded-lg px-4 py-2 text-neutral-800">
          {userMessage}
        </div>
      </div>

      {/* AI response with streaming animation */}
      <div
        className={`flex gap-3 items-start transition-opacity duration-300 ${
          showAiResponse ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <AiAvatar />
        <div className="bg-accent-purple/10 rounded-lg px-4 py-2 text-neutral-800 max-w-[80%] break-words">
          {showAiResponse && <StreamingText text={aiResponse} startDelay={200} speed={25} />}
        </div>
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const ChatPreview = memo(ChatPreviewComponent);