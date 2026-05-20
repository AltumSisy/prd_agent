// ============================================
// Chat Interface Component
// Interactive chat page with user input and AI responses
// ============================================

import { useState, useRef, useEffect, memo } from 'react';
import { useTranslation } from '../i18n/TranslationContext';
import { StreamingText } from './StreamingText';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ToolCallDisplay, type ToolCall } from './ToolCallDisplay';
import { createParser, type EventSourceMessage } from 'eventsource-parser';

// Static avatars hoisted outside component
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

// Call Pi Agent API with SSE streaming
async function callPiAgent(
  text: string,
  sessionId: string,
  onEvent: (event: string, data: any) => void
): Promise<string> {
  // 开发环境使用当前主机名连接后端，生产环境使用相对路径
  const apiUrl = import.meta.env.DEV 
    ? `${window.location.protocol}//${window.location.hostname}:3000/api/chat/${sessionId}`
    : `/api/chat/${sessionId}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  let fullText = "";
  const parser = createParser({
    onEvent: (msg: EventSourceMessage) => {
      try {
        const data = JSON.parse(msg.data);
        onEvent(msg.event || 'message', data);
        if (msg.event === 'text_delta') {
          fullText += data.delta;
        }
      } catch (e) {
        console.error('Failed to parse SSE data:', msg.data);
      }
    },
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.feed(decoder.decode(value));
  }

  return fullText;
}


interface ChatInterfaceProps {
  onBack: () => void; // Callback to return to landing page
}

function ChatInterfaceComponent({ onBack }: ChatInterfaceProps) {
  const { language } = useTranslation();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string; streaming?: boolean; toolCalls?: ToolCall[] }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Event handlers for SSE events
  const eventHandlers: Record<string, (data: any) => void> = {
    text_delta: (data: { delta: string }) => {
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'ai') {
          updated[lastIdx] = { ...updated[lastIdx], text: updated[lastIdx].text + data.delta };
        }
        return updated;
      });
    },
    tool_start: (data: { toolName: string; args: any }) => {
      console.log('🔧 Tool start:', data.toolName, data.args);
      // Add tool call to current AI message (deduplicate by toolName + args)
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'ai') {
          const existingToolCalls = updated[lastIdx].toolCalls || [];
          
          // Check if this exact tool call (same name + args) is already running
          const argsKey = JSON.stringify(data.args || {});
          const isDuplicate = existingToolCalls.some(
            tc => tc.toolName === data.toolName && 
                  tc.status === 'running' && 
                  JSON.stringify(tc.args || {}) === argsKey
          );
          
          if (isDuplicate) {
            console.log('⚠️ Duplicate tool call ignored:', data.toolName);
            return prev;
          }
          
          const newToolCall: ToolCall = {
            toolName: data.toolName,
            status: 'running',
            args: data.args,
          };
          updated[lastIdx] = {
            ...updated[lastIdx],
            toolCalls: [...existingToolCalls, newToolCall],
          };
        }
        return updated;
      });
    },
    tool_end: (data: { toolName: string; isError: boolean; result?: any }) => {
      console.log('✅ Tool end:', data.toolName, data.isError ? '(error)' : '(success)');
      // Update tool call status (match first running tool with same name)
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'ai' && updated[lastIdx].toolCalls) {
          // Find first running tool with matching name and update it
          let updatedOne = false;
          const toolCalls = updated[lastIdx].toolCalls!.map(tc => {
            if (!updatedOne && tc.toolName === data.toolName && tc.status === 'running') {
              updatedOne = true;
              return {
                ...tc,
                status: data.isError ? 'error' : 'success',
                result: data.result,
                error: data.isError && data.result?.error ? data.result.error : undefined,
              };
            }
            return tc;
          });
          updated[lastIdx] = { ...updated[lastIdx], toolCalls };
        }
        return updated;
      });
    },
    done: () => {
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'ai') {
          updated[lastIdx] = { ...updated[lastIdx], streaming: false };
        }
        return updated;
      });
    },
    error: (data: { message: string }) => {
      console.error('❌ Error:', data.message);
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'ai') {
          updated[lastIdx] = { ...updated[lastIdx], text: data.message, streaming: false };
        }
        return updated;
      });
    },
  };

  // Handle sending message
  const handleSend = async () => {
    if (!inputValue.trim() || isAiTyping) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message and empty AI message (for streaming updates)
    setMessages(prev => [
      ...prev,
      { role: 'user', text: userMessage },
      { role: 'ai', text: '', streaming: true }
    ]);
    setIsAiTyping(true);

    try {
      await callPiAgent(userMessage, sessionId, (event, data) => {
        const handler = eventHandlers[event];
        if (handler) {
          handler(data);
        } else {
          console.log('Unknown event:', event, data);
        }
      });
    } catch (error) {
      const errorMessage = language === 'en'
        ? 'Sorry, I encountered an error. Please try again.'
        : '抱歉，出现了错误。请重试。';
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'ai') {
          updated[lastIdx] = { ...updated[lastIdx], text: errorMessage, streaming: false };
        }
        return updated;
      });
    } finally {
      setIsAiTyping(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Mark streaming as complete after animation
  const handleStreamComplete = (index: number) => {
    setMessages(prev => prev.map((msg, i) =>
      i === index ? { ...msg, streaming: false } : msg
    ));
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header with back button */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>{language === 'en' ? 'Back' : '返回'}</span>
        </button>
        <h1 className="font-semibold text-neutral-900">AI Chatbot</h1>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center text-neutral-500 py-8">
            {language === 'en'
              ? 'Start a conversation with the AI assistant'
              : '开始与AI助手对话'}
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 items-start mb-4 ${
              message.role === 'user' ? 'justify-end' : ''
            }`}
          >
            {message.role === 'ai' && <AiAvatar />}
            <div
              className={`rounded-lg px-4 py-2 max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-accent-purple text-white'
                  : 'bg-white border border-neutral-200 text-neutral-800'
              }`}
            >
              {/* Tool calls display */}
              {message.role === 'ai' && message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mb-2 space-y-1">
                  {message.toolCalls.map((toolCall, tcIndex) => (
                    <ToolCallDisplay
                      key={tcIndex}
                      toolName={toolCall.toolName}
                      status={toolCall.status}
                      args={toolCall.args}
                      error={toolCall.error}
                      result={toolCall.result}
                    />
                  ))}
                </div>
              )}
              
              {message.streaming ? (
                <StreamingText
                  text={message.text}
                  startDelay={100}
                  speed={20}
                  onComplete={() => handleStreamComplete(index)}
                />
              ) : (
                <MarkdownRenderer content={message.text} />
              )}
            </div>
            {message.role === 'user' && <UserAvatar />}
          </div>
        ))}

        {/* AI typing indicator */}
        {isAiTyping && (
          <div className="flex gap-3 items-start mb-4">
            <AiAvatar />
            <div className="bg-white border border-neutral-200 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-neutral-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={language === 'en' ? 'Type your message...' : '输入您的消息...'}
            className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20 text-neutral-800"
            disabled={isAiTyping}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isAiTyping}
            className="px-6 py-2 bg-accent-purple text-white rounded-lg font-medium hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {language === 'en' ? 'Send' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const ChatInterface = memo(ChatInterfaceComponent);