// ============================================
// App Component
// Main application entry with page navigation
// Supports switching between landing page and chat interface
// ============================================

import { useState, Suspense, lazy } from 'react';
import { TranslationProvider, useTranslation } from './i18n/TranslationContext';
import { HeroSection } from './components/HeroSection';
import { FeatureCards } from './components/FeatureCards';
import { IntegrationLogos } from './components/IntegrationLogos';
import { ChatInterface } from './components/ChatInterface';

// Lazy load ChatPreview - heavy component with animation logic (pattern: bundle-dynamic-imports)
const ChatPreview = lazy(() => import('./components/ChatPreview').then(m => ({ default: m.ChatPreview })));

// Footer component using translation hook
function Footer() {
  const { t } = useTranslation();
  return <span>{t('footer')}</span>;
}

// Page state type
type PageState = 'landing' | 'chat';

function App() {
  // Track current page view
  const [currentPage, setCurrentPage] = useState<PageState>('landing');

  // Navigate to chat interface
  const handleTryNow = () => {
    setCurrentPage('chat');
  };

  // Return to landing page
  const handleBackToLanding = () => {
    setCurrentPage('landing');
  };

  return (
    <TranslationProvider>
      {currentPage === 'chat' ? (
        // Full-screen chat interface
        <ChatInterface onBack={handleBackToLanding} />
      ) : (
        // Landing page
        <div className="min-h-screen bg-neutral-50">
          {/* Hero section with CTA */}
          <HeroSection onTryNow={handleTryNow} />

          {/* Chat preview demo - lazy loaded */}
          <section className="py-16 px-4">
            <Suspense
              fallback={
                <div className="glass-effect rounded-xl p-4 max-w-md mx-auto text-center text-neutral-500">
                  Loading demo...
                </div>
              }
            >
              <ChatPreview />
            </Suspense>
          </section>

          {/* Feature cards section */}
          <section className="py-12 px-4 feature-section">
            <div className="max-w-4xl mx-auto">
              <FeatureCards />
            </div>
          </section>

          {/* Integration logos section */}
          <IntegrationLogos />

          {/* Footer */}
          <footer className="py-8 text-center text-neutral-500 border-t border-neutral-200">
            <Footer />
          </footer>
        </div>
      )}
    </TranslationProvider>
  );
}

export default App;