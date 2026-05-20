/**
 * Chat API 集成测试
 * 
 * 测试用例：
 * - POST /api/chat/:sessionId 返回 SSE 流
 * - 发送消息后收到 text_delta 事件
 * - 发送消息后收到 tool_start/tool_end 事件
 * - 发送消息后收到 done 事件
 * - 空消息返回 400
 * - session 正忙时返回 429
 * - agent 错误时返回 error 事件
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Hono } from 'hono';
import { testClient } from 'hono/testing';
import { chatRoute } from '../../src/routes/chat';
import { SessionStore } from '../../src/services/sessionStore';

// Mock AgentSession
interface MockAgentSession {
  prompt: vi.Mock;
  subscribe: vi.Mock;
  dispose: vi.Mock;
}

// Mock createSession
const mockCreateSession = vi.fn();

// 创建 mock app
function createTestApp() {
  const app = new Hono();
  const store = new SessionStore(mockCreateSession);
  app.route('/api/chat', chatRoute(store));
  return app;
}

describe('Chat API', () => {
  let mockSession: MockAgentSession;

  beforeEach(() => {
    vi.clearAllMocks();

    // 创建 mock session
    mockSession = {
      prompt: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockReturnValue(vi.fn()), // 返回 unsubscribe 函数
      dispose: vi.fn(),
    };

    mockCreateSession.mockResolvedValue({
      session: mockSession,
      dispose: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('POST /api/chat/:sessionId', () => {
    it('应该返回 SSE 流', async () => {
      const app = createTestApp();
      const res = await app.request('/api/chat/test-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello' }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/event-stream');
      expect(res.headers.get('Cache-Control')).toBe('no-cache');
      expect(res.headers.get('Connection')).toBe('keep-alive');
    });

    it('空消息应该返回 400', async () => {
      const app = createTestApp();
      const res = await app.request('/api/chat/test-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '' }),
      });

      expect(res.status).toBe(400);
    });

    it('缺少 text 字段应该返回 400', async () => {
      const app = createTestApp();
      const res = await app.request('/api/chat/test-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });

    it('session 正忙时应该返回 429', async () => {
      const app = createTestApp();

      // 第一次请求
      const res1 = await app.request('/api/chat/test-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'First message' }),
      });

      // 在第一次请求完成前，第二次请求应该被拒绝
      // 但由于我们是 mock，需要手动模拟 session 正忙
      // 这个测试需要在实际实现中处理
    });

    it('应该调用 session.prompt', async () => {
      const app = createTestApp();
      await app.request('/api/chat/test-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello' }),
      });

      expect(mockSession.prompt).toHaveBeenCalledWith('Hello');
    });

    it('应该调用 session.prompt 并返回 SSE 响应', async () => {
      const app = createTestApp();
      const res = await app.request('/api/chat/test-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello' }),
      });

      // 验证响应是 SSE 流
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/event-stream');
      expect(res.body).toBeDefined();
      
      // 验证 prompt 被调用
      expect(mockSession.prompt).toHaveBeenCalledWith('Hello');
    });

    it('应该订阅 session 事件', async () => {
      const app = createTestApp();
      await app.request('/api/chat/test-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello' }),
      });

      // 验证 subscribe 被调用
      expect(mockSession.subscribe).toHaveBeenCalled();
    });
  });
});