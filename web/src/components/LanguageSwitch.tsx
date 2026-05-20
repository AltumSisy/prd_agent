// ============================================
// Language Switch Component
// Toggle between English and Chinese
// ============================================

import { useTranslation } from '../i18n/TranslationContext';

export function LanguageSwitch() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded text-sm transition-colors ${
          language === 'en'
            ? 'bg-accent-purple text-white'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('zh')}
        className={`px-2 py-1 rounded text-sm transition-colors ${
          language === 'zh'
            ? 'bg-accent-purple text-white'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }`}
        aria-label="切换到中文"
      >
        中文
      </button>
    </div>
  );
}