// ============================================
// Integration Logos Component
// Display partner/platform integration logos
// Static content hoisted outside component (pattern: rendering-hoist-jsx)
// ============================================

import { memo } from 'react';
import { useTranslation } from '../i18n/TranslationContext';

// Integration logo placeholders - static data
const integrations = [
  { name: 'Slack', color: '#4A154B' },
  { name: 'Discord', color: '#5865F2' },
  { name: 'Teams', color: '#6264A7' },
  { name: 'WhatsApp', color: '#25D366' },
  { name: 'Telegram', color: '#0088cc' },
];

function IntegrationLogosComponent() {
  const { t } = useTranslation();

  return (
    <section className="py-12">
      {/* Section title */}
      <h2 className="text-xl font-semibold text-neutral-800 text-center mb-2">
        {t('integrationTitle')}
      </h2>
      <p className="text-neutral-500 text-center mb-8">
        {t('integrationSubtitle')}
      </p>

      {/* Logo row */}
      <div className="flex flex-wrap justify-center gap-6">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-sm border border-neutral-200 hover-lift"
          >
            {/* Logo placeholder circle */}
            <div
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: integration.color }}
            />
            <span className="text-neutral-700 font-medium">
              {integration.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// Export memoized component
export const IntegrationLogos = memo(IntegrationLogosComponent);