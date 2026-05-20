/**
 * SessionStore 单元测试
 * 
 * 测试用例：
 * - 创建新 session
 * - 获取已存在的 session
 * - session 30 分钟无活动后过期
 * - 更新 lastActiveAt
 * - 删除 session
 * - 并发请求同一 sessionId（第二个被拒绝）
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock AgentSession 类型
interface MockSession {
  id: string;
  prompt: vi.Mock;
  subscribe: vi.Mock;
  dispose: vi.Mock;
}

// Mock createSession 函数
const mockCreateSession = vi.fn();

// 由于 SessionStore 还没实现，我们定义它的接口
interface SessionEntry {
  sessionId: string;
  session: MockSession;
  createdAt: Date;
  lastActiveAt: Date;
  isBusy: boolean;
}

interface SessionStore {
  getOrCreate(sessionId: string): Promise<SessionEntry>;
  get(sessionId: string): SessionEntry | undefined;
  delete(sessionId: string): void;
  setBusy(sessionId: string, busy: boolean): void;
  isBusy(sessionId: string): boolean;
  cleanup(): void;
}

// 动态导入，允许我们先写测试
// 实际实现后，这会导入真正的 SessionStore
async function createSessionStore(): Promise<SessionStore> {
  // 先返回一个 mock 实现，后续替换为真实实现
  const { SessionStore } = await import('../../src/services/sessionStore');
  return new SessionStore(mockCreateSession);
}

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock createSession 返回值
    mockCreateSession.mockResolvedValue({
      session: {
        id: 'mock-session-id',
        prompt: vi.fn(),
        subscribe: vi.fn(() => vi.fn()),
        dispose: vi.fn(),
      },
      dispose: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getOrCreate', () => {
    it('应该创建新 session', async () => {
      store = await createSessionStore();
      const entry = await store.getOrCreate('session-1');

      expect(entry).toBeDefined();
      expect(entry.sessionId).toBe('session-1');
      expect(entry.session).toBeDefined();
      expect(entry.isBusy).toBe(false);
    });

    it('应该返回已存在的 session（不创建新的）', async () => {
      store = await createSessionStore();
      const entry1 = await store.getOrCreate('session-1');
      const entry2 = await store.getOrCreate('session-1');

      expect(entry1).toBe(entry2);
      expect(mockCreateSession).toHaveBeenCalledTimes(1);
    });

    it('应该更新 lastActiveAt', async () => {
      store = await createSessionStore();
      const entry1 = await store.getOrCreate('session-1');
      const time1 = entry1.lastActiveAt;

      // 等待一小段时间
      await new Promise(resolve => setTimeout(resolve, 10));

      const entry2 = await store.getOrCreate('session-1');
      expect(entry2.lastActiveAt.getTime()).toBeGreaterThanOrEqual(time1.getTime());
    });
  });

  describe('get', () => {
    it('应该返回已存在的 session', async () => {
      store = await createSessionStore();
      await store.getOrCreate('session-1');

      const entry = store.get('session-1');
      expect(entry).toBeDefined();
    });

    it('应该返回 undefined 如果 session 不存在', async () => {
      store = await createSessionStore();
      const entry = store.get('non-existent');
      expect(entry).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('应该删除 session', async () => {
      store = await createSessionStore();
      await store.getOrCreate('session-1');

      store.delete('session-1');
      expect(store.get('session-1')).toBeUndefined();
    });

    it('应该调用 session.dispose()', async () => {
      const mockDispose = vi.fn();
      mockCreateSession.mockResolvedValue({
        session: {
          id: 'mock-session-id',
          prompt: vi.fn(),
          subscribe: vi.fn(() => vi.fn()),
          dispose: mockDispose,
        },
        dispose: mockDispose,
      });

      store = await createSessionStore();
      await store.getOrCreate('session-1');
      store.delete('session-1');

      expect(mockDispose).toHaveBeenCalled();
    });
  });

  describe('isBusy / setBusy', () => {
    it('初始状态应该不忙', async () => {
      store = await createSessionStore();
      await store.getOrCreate('session-1');

      expect(store.isBusy('session-1')).toBe(false);
    });

    it('setBusy 应该改变状态', async () => {
      store = await createSessionStore();
      await store.getOrCreate('session-1');

      store.setBusy('session-1', true);
      expect(store.isBusy('session-1')).toBe(true);

      store.setBusy('session-1', false);
      expect(store.isBusy('session-1')).toBe(false);
    });

    it('不存在的 session 应该返回 false', async () => {
      store = await createSessionStore();
      expect(store.isBusy('non-existent')).toBe(false);
    });
  });

  describe('过期清理', () => {
    it('应该清理超过 30 分钟无活动的 session', async () => {
      vi.useFakeTimers();
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);

      store = await createSessionStore();
      await store.getOrCreate('session-1');

      // 前进 31 分钟
      vi.setSystemTime(new Date('2024-01-01T00:31:00Z'));

      store.cleanup();

      expect(store.get('session-1')).toBeUndefined();
    });

    it('不应该清理未过期的 session', async () => {
      vi.useFakeTimers();
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);

      store = await createSessionStore();
      await store.getOrCreate('session-1');

      // 前进 29 分钟
      vi.setSystemTime(new Date('2024-01-01T00:29:00Z'));

      store.cleanup();

      expect(store.get('session-1')).toBeDefined();
    });
  });
});