/**
 * Server Entry Point
 * 
 * 启动 Hono 服务器，配置：
 * - Chat API 路由
 * - CORS
 * - Session 管理
 */

import { config } from 'dotenv';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { chatRoute } from './routes/chat';
import { SessionStore } from './services/sessionStore';
import { createSession } from 'pi-agent';
import { createLogger, cleanOldLogs } from './services/logger';

// 加载环境变量（从 pi_agent 目录）
config({ path: '../pi_agent/.env' });

// 创建 logger
const logger = createLogger('main');

// ============================================
// Configuration
// ============================================

const PORT = Number(process.env.PORT) || 3000;

// ============================================
// Create Session Function
// ============================================

/**
 * 创建 Agent Session 的函数
 * 用于 SessionStore
 */
async function createAgentSession() {
  const { session, dispose } = await createSession();
  return { session, dispose };
}

// ============================================
// Server Setup
// ============================================

async function main() {
  const app = new Hono();

  // CORS 配置（开发模式允许所有来源）
  app.use('*', cors({
    origin: '*',  // 开发模式允许所有来源
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  }));

  // Session Store
  const sessionStore = new SessionStore(createAgentSession);

  // 定期清理过期 session（每 5 分钟）
  setInterval(() => {
    sessionStore.cleanup();
    logger.debug('Session cleanup executed', { activeSessions: sessionStore.size });
  }, 5 * 60 * 1000);

  // 每天清理旧日志
  cleanOldLogs(7);
  setInterval(() => cleanOldLogs(7), 24 * 60 * 60 * 1000);

  // Chat API 路由
  app.route('/api/chat', chatRoute(sessionStore));

  // 健康检查
  app.get('/health', (c) => c.json({ status: 'ok' }));

  // 启动服务器
  console.log('Starting server...');
  logger.info('Server starting...');

  serve({
    fetch: app.fetch,
    port: PORT,
    hostname: '0.0.0.0',  // 监听所有网络接口（局域网访问）
  });

  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📡 LAN access: http://<your-ip>:${PORT}`);
  console.log(`📡 Chat API: POST http://localhost:${PORT}/api/chat/:sessionId`);
  console.log(`❤️  Health: GET http://localhost:${PORT}/health`);
  logger.info(`Server started`, { port: PORT });
}

main().catch((error) => {
  logger.error('Failed to start server', { error: String(error) });
  console.error('Failed to start server:', error);
  process.exit(1);
});