// ============================================
// Translation strings for English and Chinese
// Simple i18n setup without external libraries
// ============================================

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // Hero section
    heroTitle: 'Intelligent Agent',
    heroSubtitle: 'Build AI chatbots that understand context, remember conversations, and respond naturally.',
    tryNow: 'Try Now',
    learnMore: 'Learn More',

    // Chat preview demo
    userMessage: 'How can I improve my productivity?',
    aiResponse: 'Based on your work patterns, I recommend: 1) Time blocking for focused work, 2) Taking short breaks every 90 minutes, 3) Prioritizing tasks the night before. Would you like me to set up a personalized schedule?',
    typingIndicator: 'AI is thinking...',

    // Feature cards
    features: {
      naturalLanguage: {
        title: 'Natural Language Understanding',
        description: 'Understands context and intent, not just keywords.',
      },
      contextMemory: {
        title: 'Context Memory',
        description: 'Remembers previous conversations for personalized responses.',
      },
      multiLanguage: {
        title: 'Multi-language Support',
        description: 'Communicate fluently in over 50 languages.',
      },
      fastResponse: {
        title: 'Fast Response Time',
        description: 'Real-time streaming responses under 100ms.',
      },
    },

    // Integration section
    integrationTitle: 'Integrates with your favorite tools',
    integrationSubtitle: 'Connect seamlessly with popular platforms and services',

    // Footer
    footer: '© 2024 AI Chatbot Platform. Built with React.',
  },
  zh: {
    // Hero section
    heroTitle: '金发实施智能Agnet',
    heroSubtitle: '构建理解上下文、记忆对话、自然响应的AI聊天机器人。',
    tryNow: '立即体验',
    learnMore: '了解更多',

    // Chat preview demo
    userMessage: '如何提高我的工作效率？',
    aiResponse: '根据您的工作模式，我建议：1) 采用时间块法进行专注工作，2) 每90分钟短暂休息，3) 前一天晚上优先排序任务。需要我为您制定个性化日程吗？',
    typingIndicator: 'AI正在思考...',

    // Feature cards
    features: {
      naturalLanguage: {
        title: '自然语言理解',
        description: '理解上下文和意图，而非仅仅关键词。',
      },
      contextMemory: {
        title: '上下文记忆',
        description: '记忆历史对话，提供个性化响应。',
      },
      multiLanguage: {
        title: '多语言支持',
        description: '流畅支持超过50种语言。',
      },
      fastResponse: {
        title: '快速响应',
        description: '实时流式响应，延迟低于100毫秒。',
      },
    },

    // Integration section
    integrationTitle: '与您喜爱的工具无缝集成',
    integrationSubtitle: '轻松连接主流平台和服务',

    // Footer
    footer: '© 2024 AI聊天机器人平台。基于React构建。',
  },
};