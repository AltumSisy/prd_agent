// ============================================
// Hero Section Component
// Main landing area with headline and CTA
// ============================================

import { useTranslation } from '../i18n/TranslationContext';
import { LanguageSwitch } from './LanguageSwitch';

interface HeroSectionProps {
  onTryNow: () => void; // Callback when Try Now button is clicked
}

export function HeroSection({ onTryNow }: HeroSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="hero-gradient py-20 px-4 relative">
      {/* Language switch positioned top-right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitch />
      </div>

      {/* Centered content */}
      <div className="max-w-3xl mx-auto text-center">
        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
          {t('heroTitle')}
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-neutral-600 mb-8">
          {t('heroSubtitle')}
        </p>

        {/* CTA buttons */}
        <div className="flex gap-4 justify-center">
          {/* Primary CTA - purple accent, navigates to chat */}
          <button
            onClick={onTryNow}
            className="px-6 py-3 bg-accent-purple text-white rounded-lg font-medium hover:bg-accent-dark transition-colors shadow-md hover:shadow-lg"
          >
            {t('tryNow')}
          </button>

          {/* Secondary CTA */}
          <button
            onClick={() => {
              // Scroll to feature cards section
              document.querySelector('.feature-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3 bg-white text-neutral-700 rounded-lg font-medium border border-neutral-300 hover:border-neutral-400 transition-colors"
          >
            {t('learnMore')}
          </button>
        </div>
      </div>
    </section>
  );
}