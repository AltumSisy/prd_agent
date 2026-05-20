/**
 * SessionStore
 * 
 * 管理内存中的 Agent Session：
 * - 创建和获取 session
 * - 30 分钟过期清理
 * - 并发请求控制（busy 状态）
 */

import type { AgentSession } from '@earendil-works/pi-coding-agent';

// ============================================
// Types
// ============================================

export interface SessionEntry {
  sessionId: string;
  session: AgentSession;
  dispose: () => void;
  createdAt: Date;
  lastActiveAt: Date;
  isBusy: boolean;
}

export type CreateSessionFn = () => Promise<{
  session: AgentSession;
  dispose: () => void;
}>;

// ============================================
// Constants
// ============================================

/** Session 过期时间（30 分钟） */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// ============================================
// SessionStore Class
// ============================================

export class SessionStore {
  private sessions = new Map<string, SessionEntry>();
  private createSession: CreateSessionFn;

  constructor(createSession: CreateSessionFn) {
    this.createSession = createSession;
  }

  /**
   * 获取或创建 session
   */
  async getOrCreate(sessionId: string): Promise<SessionEntry> {
    let entry = this.sessions.get(sessionId);

    if (entry) {
      // 更新最后活动时间
      entry.lastActiveAt = new Date();
      return entry;
    }

    // 创建新 session
    const { session, dispose } = await this.createSession();
    entry = {
      sessionId,
      session,
      dispose,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      isBusy: false,
    };

    this.sessions.set(sessionId, entry);
    return entry;
  }

  /**
   * 获取已存在的 session（不创建新的）
   */
  get(sessionId: string): SessionEntry | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 删除 session
   */
  delete(sessionId: string): void {
    const entry = this.sessions.get(sessionId);
    if (entry) {
      entry.dispose();
      this.sessions.delete(sessionId);
    }
  }

  /**
   * 检查 session 是否正忙
   */
  isBusy(sessionId: string): boolean {
    const entry = this.sessions.get(sessionId);
    return entry?.isBusy ?? false;
  }

  /**
   * 设置 session 忙状态
   */
  setBusy(sessionId: string, busy: boolean): void {
    const entry = this.sessions.get(sessionId);
    if (entry) {
      entry.isBusy = busy;
    }
  }

  /**
   * 清理过期的 session
   */
  cleanup(): void {
    const now = new Date();
    for (const [sessionId, entry] of this.sessions) {
      const elapsed = now.getTime() - entry.lastActiveAt.getTime();
      if (elapsed > SESSION_TIMEOUT_MS) {
        this.delete(sessionId);
      }
    }
  }

  /**
   * 获取当前 session 数量（调试用）
   */
  get size(): number {
    return this.sessions.size;
  }
}