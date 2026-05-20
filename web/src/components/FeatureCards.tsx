// ============================================
// Feature Cards Component
// Grid of AI capability cards
// Memoized for performance (pattern: rerender-memo)
// ============================================

import { memo } from 'react';
import { useTranslation } from '../i18n/TranslationContext';

// Feature icons as simple SVG components
const icons = {
  // Brain icon for natural language
  naturalLanguage: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.95-.083-1.867-.548-2.469a5 5 0 117.072 0" />
    </svg>
  ),
  // Memory icon
  contextMemory: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
  ),
  // Globe icon for multi-language
  multiLanguage: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  // Bolt icon for fast response
  fastResponse: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

// Feature keys array - static, hoisted outside component
const featureKeys = ['naturalLanguage', 'contextMemory', 'multiLanguage', 'fastResponse'] as const;

function FeatureCardsComponent() {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {featureKeys.map((key) => (
        <div
          key={key}
          className="bg-white rounded-lg p-6 shadow-sm hover-lift border border-neutral-200"
        >
          {/* Icon container */}
          <div className="w-12 h-12 rounded-lg bg-accent-purple/10 flex items-center justify-center mb-4 text-accent-purple">
            {icons[key]}
          </div>
          {/* Feature title */}
          <h3 className="font-semibold text-neutral-800 mb-2">
            {t(`features.${key}.title`)}
          </h3>
          {/* Feature description */}
          <p className="text-neutral-600 text-sm">
            {t(`features.${key}.description`)}
          </p>
        </div>
      ))}
    </div>
  );
}

// Export memoized component
export const FeatureCards = memo(FeatureCardsComponent);