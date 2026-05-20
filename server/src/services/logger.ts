/**
 * Logger Service
 * 
 * 简单的日志系统，支持：
 * - 控制台输出（开发调试）
 * - 文件输出（生产记录）
 */

import fs from 'fs';
import path from 'path';

// ============================================
// Configuration
// ============================================

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'server.log');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log');

// 日志级别
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// 当前日志级别（可通过环境变量配置）
const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

// ============================================
// Logger Class
// ============================================

class Logger {
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.ensureLogDir();
  }

  private ensureLogDir() {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  }

  private formatMessage(level: LogLevel, message: string, meta?: object): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.name}] ${message}${metaStr}`;
  }

  private writeToFile(level: LogLevel, formattedMessage: string) {
    const file = level === 'error' ? ERROR_LOG_FILE : LOG_FILE;
    fs.appendFileSync(file, formattedMessage + '\n');
  }

  private log(level: LogLevel, message: string, meta?: object) {
    // 检查日志级别
    if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, meta);

    // 控制台输出（带颜色）
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m',  // cyan
      info: '\x1b[32m',   // green
      warn: '\x1b[33m',   // yellow
      error: '\x1b[31m',  // red
    };
    const reset = '\x1b[0m';
    console.log(`${colors[level]}${formattedMessage}${reset}`);

    // 文件输出
    this.writeToFile(level, formattedMessage);
  }

  debug(message: string, meta?: object) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: object) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: object) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: object) {
    this.log('error', message, meta);
  }

  // 特殊方法：记录请求
  request(sessionId: string, text: string) {
    this.info('Request received', { sessionId, textLength: text.length });
  }

  // 特殊方法：记录响应
  response(sessionId: string, duration: number) {
    this.info('Response completed', { sessionId, durationMs: duration });
  }

  // 特殊方法：记录 SSE 事件
  sseEvent(sessionId: string, eventType: string) {
    this.debug('SSE event sent', { sessionId, eventType });
  }
}

// ============================================
// Factory
// ============================================

let loggers: Record<string, Logger> = {};

export function createLogger(name: string): Logger {
  if (!loggers[name]) {
    loggers[name] = new Logger(name);
  }
  return loggers[name];
}

// 默认 logger
export const logger = createLogger('server');

// ============================================
// 日志清理（可选）
// ============================================

/**
 * 清理旧日志文件
 * 保留最近 N 天的日志
 */
export function cleanOldLogs(daysToKeep: number = 7) {
  const now = Date.now();
  const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

  try {
    const files = fs.readdirSync(LOG_DIR);
    for (const file of files) {
      const filePath = path.join(LOG_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned old log file: ${file}`);
      }
    }
  } catch (error) {
    logger.warn('Failed to clean old logs', { error: String(error) });
  }
}