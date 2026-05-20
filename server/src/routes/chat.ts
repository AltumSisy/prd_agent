/**
 * Chat API Route
 * 
 * POST /api/chat/:sessionId
 * - 接收用户消息
 * - 返回 SSE 流式响应
 */

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { SessionStore } from '../services/sessionStore';
import { createLogger } from '../services/logger';

// ============================================
// Logger
// ============================================

const logger = createLogger('chat');

// ============================================
// Types
// ============================================

interface ChatRequest {
  text: string;
}

// ============================================
// Helper: Transform Agent Event to SSE
// ============================================

function transformAgentEvent(rawEvent: Parameters<Parameters<import('@earendil-works/pi-coding-agent').AgentSession['subscribe']>[0]>[0]):
  | { event: string; data: object }
  | null {
  switch (rawEvent.type) {
    // 文本流式输出
    case 'message_update': {
      if (rawEvent.assistantMessageEvent.type === 'text_delta') {
        return {
          event: 'text_delta',
          data: { delta: rawEvent.assistantMessageEvent.delta },
        };
      }
      return null;
    }

    // 工具调用
    case 'tool_execution_start':
      return {
        event: 'tool_start',
        data: {
          toolName: rawEvent.toolName,
          args: rawEvent.args,
        },
      };

    case 'tool_execution_end':
      return {
        event: 'tool_end',
        data: {
          toolName: rawEvent.toolName,
          isError: rawEvent.isError,
          result: rawEvent.result,
        },
      };

    // Agent 完成
    case 'agent_end':
      return {
        event: 'done',
        data: {},
      };

    // 错误
    case 'message_end': {
      const msg = rawEvent.message;
      if ('stopReason' in msg && msg.stopReason === 'error') {
        return {
          event: 'error',
          data: { message: msg.errorMessage ?? 'Unknown error' },
        };
      }
      return null;
    }

    default:
      return null;
  }
}

// ============================================
// Route
// ============================================

export function chatRoute(store: SessionStore) {
  const app = new Hono();

  app.post('/:sessionId', async (c) => {
    const sessionId = c.req.param('sessionId');
    const startTime = Date.now();

    // 解析请求体
    let body: ChatRequest;
    try {
      body = await c.req.json<ChatRequest>();
    } catch {
      logger.warn('Invalid JSON body', { sessionId });
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    // 验证 text 字段
    if (!body.text || typeof body.text !== 'string' || body.text.trim() === '') {
      logger.warn('Missing or empty text field', { sessionId });
      return c.json({ error: 'Text is required' }, 400);
    }

    const text = body.text.trim();
    logger.request(sessionId, text);

    // 检查 session 是否正忙
    if (store.isBusy(sessionId)) {
      logger.warn('Session busy, request rejected', { sessionId });
      return c.json({ error: 'Session is busy' }, 429);
    }

    // 获取或创建 session
    const entry = await store.getOrCreate(sessionId);
    logger.debug('Session created/retrieved', { sessionId, isNew: !store.get(sessionId) });

    // 设置为忙
    store.setBusy(sessionId, true);

    // 返回 SSE 流
    return streamSSE(c, async (stream) => {
      let unsubscribe: (() => void) | null = null;

      try {
        // 订阅事件
        unsubscribe = entry.session.subscribe((rawEvent) => {
          const sseEvent = transformAgentEvent(rawEvent);
          if (sseEvent) {
            stream.writeSSE({
              event: sseEvent.event,
              data: JSON.stringify(sseEvent.data),
            });
            logger.sseEvent(sessionId, sseEvent.event);
          }
        });

        // 执行 prompt
        logger.info('Executing prompt', { sessionId, textLength: text.length });
        await entry.session.prompt(text);
        
        // 记录完成
        const duration = Date.now() - startTime;
        logger.response(sessionId, duration);
      } catch (error) {
        // 发送错误事件
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Prompt execution failed', { sessionId, error: errorMsg });
        stream.writeSSE({
          event: 'error',
          data: JSON.stringify({ message: errorMsg }),
        });
      } finally {
        // 清理
        if (unsubscribe) {
          unsubscribe();
        }
        store.setBusy(sessionId, false);
        logger.debug('Session released', { sessionId });
      }
    });
  });

  return app;
}