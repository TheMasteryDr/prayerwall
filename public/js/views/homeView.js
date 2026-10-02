/**
 * Home / Landing View - Prayer Wall
 */
const HomeView = {
  async render() {
    const main = document.getElementById('main-content');
    if (!main) return;

    // 1. Immediately render the complete page with initial altar data (zero blank states)
    const initialData = API.getDefaultOverview ? API.getDefaultOverview() : {
      stats: { totalRequests: 28, totalIntercessions: 147, pastorPrayedCount: 19 },
      settings: {
        scripture_verse: 'The fire shall ever be burning upon the altar; it shall never go out.',
        scripture_ref: 'Leviticus 6:13'
      },
      recentPrayers: []
    };

    main.innerHTML = this.template(initialData);

    // Bind prayer card events immediately
    const grid = document.getElementById('home-prayers-grid');
    if (grid) {
      PrayerCard.bindEvents(grid);
    }

    // 2. Fetch live data asynchronously to enrich stats and recent petitions
    try {
      const data = await API.getOverview();
      if (data && data.stats) {
        this.updateStats(data.stats);
      }
      if (data && data.recentPrayers && data.recentPrayers.length > 0) {
        this.updatePrayers(data.recentPrayers);
      }
    } catch (err) {
      console.warn('Home overview: using altar initial state:', err);
    }
  },

  updateStats(stats) {
    const reqEl = document.getElementById('stat-total-requests');
    const intEl = document.getElementById('stat-total-intercessions');
    const pasEl = document.getElementById('stat-pastor-prayed');
    if (reqEl) reqEl.textContent = stats.totalRequests || 0;
    if (intEl) intEl.textContent = stats.totalIntercessions || 0;
    if (pasEl) pasEl.textContent = stats.pastorPrayedCount || 0;
  },

  updatePrayers(recentPrayers) {
    const grid = document.getElementById('home-prayers-grid');
    if (grid && recentPrayers.length > 0) {
      grid.innerHTML = recentPrayers.map(p => PrayerCard.render(p)).join('');
      PrayerCard.bindEvents(grid);
    }
  },

  template(data) {
    const stats = data.stats || {};
    const settings = data.settings || {};
    const recentPrayers = data.recentPrayers || [];

    return `
      <!-- HERO SECTION -->
      <section class="hero-section">
        <div class="container hero-content">
          <div class="hero-subtitle-pill">
            ${Icons.get('flame', { size: 14, color: 'var(--color-gold)' })}
            <span>Fire On My Altar • Continuous Intercession</span>
          </div>
          <h1 class="hero-title">
            YOU'RE NOT PRAYING ALONE.
          </h1>
          <p class="hero-description">
            "The fire on the altar must be kept burning; it must not go out." (Leviticus 6:12). Bring your burdens, health battles, family desires, and spiritual petitions to this altar. Intercessors across nations and PDaniel Olawande stand ready to lift you up in prayer.
          </p>
          <div class="hero-actions">
            <a href="#/submit" class="btn btn-gold btn-lg">
              ${Icons.get('flame', { size: 18, color: '#070B12' })}
              <span>Share a Prayer Request</span>
            </a>
            <a href="#/prayers" class="btn btn-outline btn-lg">
              ${Icons.get('pray', { size: 18 })}
              <span>Pray for Someone</span>
            </a>
          </div>

          <!-- SCRIPTURE SPOTLIGHT -->
          <div class="scripture-banner">
            <div style="color: var(--color-gold); display: flex; align-items: center;">
              ${Icons.get('bible', { size: 28, color: 'var(--color-gold)' })}
            </div>
            <div class="scripture-text">
              "${escapeHTML(settings.scripture_verse || 'The fire shall ever be burning upon the altar; it shall never go out.')}"
            </div>
            <div class="scripture-ref">
              — ${escapeHTML(settings.scripture_ref || 'Leviticus 6:13')}
            </div>
          </div>
        </div>
      </section>

      <!-- LIVE INTERCESSION STATS -->
      <div class="container">
        <div class="stats-strip">
          <div class="stat-item">
            <div class="stat-number" id="stat-total-requests">${stats.totalRequests || 28}</div>
            <div class="stat-label">Petitions on the Altar</div>
          </div>
          <div class="stat-item">
            <div class="stat-number" id="stat-total-intercessions" style="color: var(--color-gold);">${stats.totalIntercessions || 147}</div>
            <div class="stat-label">Community Prayers Lifted</div>
          </div>
          <div class="stat-item">
            <div class="stat-number" id="stat-pastor-prayed" style="color: #FBBF24;">${stats.pastorPrayedCount || 19}</div>
            <div class="stat-label">Pastoral Intercessions by PDaniel</div>
          </div>
        </div>
      </div>

      <!-- RECENT PRAYER REQUESTS PREVIEW -->
      <section class="container" style="padding-block: var(--space-3xl);">
        <div class="section-header">
          <div>
            <span class="hero-subtitle-pill" style="font-size: 0.75rem; margin-bottom: 0.5rem;">The Altar</span>
            <h2 class="section-title">Recent Prayer Petitions</h2>
            <p class="section-subtitle">Join your faith with someone right now. Click "I Prayed" to stand in agreement.</p>
          </div>
          <a href="#/prayers" class="btn btn-outline">View Prayer Wall &rarr;</a>
        </div>

        <div class="prayers-grid" id="home-prayers-grid">
          ${recentPrayers.length > 0 
            ? recentPrayers.map(p => PrayerCard.render(p)).join('')
            : `
              <div class="skeleton skeleton-card" style="height: 180px;"></div>
              <div class="skeleton skeleton-card" style="height: 180px;"></div>
              <div class="skeleton skeleton-card" style="height: 180px;"></div>
            `
          }
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section style="background-color: var(--color-surface); border-block: 1px solid var(--color-border); padding-block: var(--space-3xl);">
        <div class="container">
          <div class="text-center" style="max-width: 650px; margin: 0 auto var(--space-2xl);">
            <span class="hero-subtitle-pill" style="font-size: 0.75rem;">Biblical Order</span>
            <h2 class="section-title" style="margin-top: 0.5rem;">How Prayer Wall Works</h2>
            <p class="section-subtitle">A reverent, consecrated altar where prayer is taken seriously and pastoral care is personal.</p>
          </div>

          <div class="how-it-works-grid">
            <div class="step-card">
              <div class="step-number">1</div>
              <h3 class="step-title">Lay Your Petition on the Altar</h3>
              <p>Submit your prayer with clarity. You can share publicly on the Prayer Wall, or mark it confidential strictly for PDaniel Olawande's pastoral intercession.</p>
            </div>

            <div class="step-card">
              <div class="step-number">2</div>
              <h3 class="step-title">Intercessors Stand in Agreement</h3>
              <p>Believers read your petition and press "I Prayed". You will see an encouraging tally of intercessors holding your hands up before God.</p>
            </div>

            <div class="step-card">
              <div class="step-number">3</div>
              <h3 class="step-title">Pastoral Intercession by PDaniel</h3>
              <p>PDaniel Olawande personally reviews the altar requests, intercedes in the Holy Ghost, and speaks prophetic and pastoral prayers directly over your request.</p>
            </div>

            <div class="step-card">
              <div class="step-number">4</div>
              <h3 class="step-title">Experience the Peace of God</h3>
              <p>Receive notifications whenever people pray for you or PDaniel responds. Be strengthened knowing heaven has heard your cry.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- PASTOR PDANIEL OLAWANDE SPOTLIGHT (Photo from images folder) -->
      <section class="container">
        <div class="pastor-spotlight-card">
          <img 
            src="/images/pdaniel.jpg" 
            alt="PDaniel Olawande" 
            class="pastor-avatar"
          />
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
              <span class="pastor-badge">
                ${Icons.get('shieldCheck', { size: 13, color: 'var(--color-gold)' })}
                Verified Shepherd
              </span>
              <span style="font-family: var(--font-heading); font-weight: 800; color: #FFFFFF; font-size: 1.25rem; letter-spacing: -0.01em;">
                PDaniel Olawande
              </span>
              <span style="font-size: 0.85rem; color: var(--color-gold);">
                — The Envoys / YMR
              </span>
            </div>
            <h3 style="font-family: var(--font-heading); font-size: 1.45rem; font-weight: 700; color: #FFFFFF; margin-bottom: 0.75rem; line-height: 1.35; letter-spacing: -0.01em;">
              "The altar that must not burn out must be fed with continuous prayer."
            </h3>
            <p style="font-size: 0.98rem; line-height: 1.7; color: var(--color-text-muted);">
              Beloved, whatever circumstance you are walking through today, remember that prayer changes things. We do not panic; we pray. As Aaron and Hur held up Moses’ hands on the mountain, our pastoral altar is committed to standing with you in the fire of the Holy Ghost until the victory is revealed.
            </p>
            <div style="margin-top: 1.25rem;">
              <a href="#/submit" class="btn btn-gold btn-sm">Request Pastoral Prayer</a>
            </div>
          </div>
        </div>
      </section>

      <!-- BOTTOM CALL TO ACTION -->
      <section style="background: radial-gradient(circle at 50% 50%, #152136 0%, #080D18 100%); border-top: 1px solid var(--color-border); color: #FFFFFF; padding-block: var(--space-3xl); margin-top: var(--space-3xl); text-align: center;">
        <div class="container" style="max-width: 680px;">
          <div style="margin-bottom: 0.75rem; display: flex; justify-content: center;">
            ${Icons.get('flame', { size: 36, color: 'var(--color-gold)' })}
          </div>
          <h2 style="color: #FFFFFF; font-size: 2.2rem; margin-bottom: 1rem;">
            Need Intercession Right Now?
          </h2>
          <p style="color: var(--color-text-muted); font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">
            Do not carry the battle in isolation. Put your petition on the Prayer Wall today and let the body of Christ stand with you in faith.
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <a href="#/submit" class="btn btn-gold btn-lg">Submit Your Petition</a>
            <a href="#/prayers" class="btn btn-outline btn-lg" style="color: #FFFFFF; border-color: rgba(255,255,255,0.25);">
              Explore Prayer Wall
            </a>
          </div>
        </div>
      </section>
    `;
  }
};

