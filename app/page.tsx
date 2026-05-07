import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <main className={styles.landing}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          {/* Logo */}
          <div className={styles.logoWrapper}>
            <div className={styles.logoIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                  <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#0a84ff" />
                    <stop offset="100%" stopColor="#bf5af2" />
                  </linearGradient>
                </defs>
                <circle cx="24" cy="24" r="22" stroke="url(#logoGrad)" strokeWidth="2.5" fill="none" />
                <path d="M16 24 L22 18 L22 22 L32 22 L32 26 L22 26 L22 30 Z" fill="url(#logoGrad)" />
                <circle cx="24" cy="24" r="4" fill="url(#logoGrad)" opacity="0.6" />
              </svg>
            </div>
            <span className={styles.logoText}>Nexus Feed</span>
          </div>

          {/* Headline */}
          <h1 className={`text-display ${styles.headline}`}>
            Your interests.{" "}
            <span className="text-gradient">Infinitely deep.</span>
            <br />
            Your digest.{" "}
            <span style={{ color: "var(--text-secondary)" }}>Crystal clear.</span>
          </h1>

          {/* Subtitle */}
          <p className={styles.subtitle}>
            Define what you care about through an AI-generated taxonomy that goes
            as deep as you want. Get a clean daily digest — no noise, no
            algorithms, just signal.
          </p>

          {/* CTA */}
          <div className={styles.ctaGroup}>
            <a href="/login" className={`btn btn-primary btn-lg ${styles.ctaBtn}`} id="cta-get-started">
              Get Started
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
              </svg>
            </a>
          </div>

          {/* Trust signals */}
          <p className={styles.trustText}>
            Free to use · No credit card · Powered by AI
          </p>
        </div>

        {/* Floating preview cards */}
        <div className={styles.previewCards}>
          <div className={`${styles.previewCard} ${styles.card1}`}>
            <div className={styles.previewCardHeader}>
              <div className={styles.previewDot} style={{ background: "var(--accent-blue)" }} />
              <span>Artificial Intelligence</span>
            </div>
            <div className={styles.previewItem}>
              <div className={styles.previewTitle}>GPT-5.5 launches with 1M context window</div>
              <div className={styles.previewSummary}>OpenAI announced its latest model targeting complex agentic workflows...</div>
            </div>
            <div className={styles.previewItem}>
              <div className={styles.previewTitle}>EU passes landmark AI regulation update</div>
              <div className={styles.previewSummary}>The European Parliament approved stricter rules for foundation models...</div>
            </div>
          </div>

          <div className={`${styles.previewCard} ${styles.card2}`}>
            <div className={styles.previewCardHeader}>
              <div className={styles.previewDot} style={{ background: "var(--accent-purple)" }} />
              <span>Space Exploration</span>
            </div>
            <div className={styles.previewItem}>
              <div className={styles.previewTitle}>SpaceX Starship completes orbital refueling</div>
              <div className={styles.previewSummary}>A major milestone for the Artemis program and Mars ambitions...</div>
            </div>
          </div>

          <div className={`${styles.previewCard} ${styles.card3}`}>
            <div className={styles.previewCardHeader}>
              <div className={styles.previewDot} style={{ background: "var(--accent-teal)" }} />
              <span>Climate & Energy</span>
            </div>
            <div className={styles.previewItem}>
              <div className={styles.previewTitle}>Solar hits 50% of global new energy capacity</div>
              <div className={styles.previewSummary}>IEA reports solar installations exceeded all other energy sources combined...</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featureGrid}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🧠</div>
            <h3 className="text-title">AI-Generated Taxonomy</h3>
            <p className="text-body">
              Start broad, drill infinitely deep. &quot;Technology → AI → Generative AI → Open Source Models&quot; — your specificity, your feed.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📡</div>
            <h3 className="text-title">Live Search + Summary</h3>
            <p className="text-body">
              Every morning, we search the web for your interests, filter the noise, and deliver 3-5 key developments with sources.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>✨</div>
            <h3 className="text-title">Zero Noise</h3>
            <p className="text-body">
              No ads. No recommendations. No engagement tricks. Just what happened today in the areas you defined.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
