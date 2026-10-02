/**
 * Prayer Wall View (Server-Side Paginated, Search, Filterable) - Flaming Prayer Wall
 */
const PrayerWallView = {
  state: {
    page: 1,
    limit: 12,
    category: 'all',
    sort: 'latest',
    search: '',
    categories: [],
    prayers: [],
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    }
  },

  async render() {
    const main = document.getElementById('main-content');
    if (!main) return;

    main.innerHTML = `
      <div class="container" style="padding-top: var(--space-2xl);">
        <div class="section-header">
          <div>
            <h1 style="font-size: 2.25rem;">The Flaming Prayer Wall</h1>
            <p class="section-subtitle">
              Read the petitions of fellow believers, intercede with Holy Ghost fire, and see PDaniel Olawande's prayers.
            </p>
          </div>
          <a href="#/submit" class="btn btn-gold">
            ${Icons.get('flame', { size: 16, color: '#070B12' })}
            <span>Submit a Petition</span>
          </a>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="prayer-toolbar">
          <!-- Search -->
          <div class="search-input-wrapper">
            ${Icons.get('search', { size: 18, className: 'search-icon' })}
            <input 
              type="text" 
              id="wall-search-input" 
              class="search-input" 
              placeholder="Search by keywords, petition title, or author name..." 
              value="${escapeHTML(this.state.search)}"
            />
          </div>

          <!-- Category Pills -->
          <div class="category-filter-bar" id="category-filter-bar">
            <button class="cat-pill ${this.state.category === 'all' ? 'active' : ''}" data-category="all">
              ${Icons.get('globe', { size: 13 })} All Petitions
            </button>
            <div class="skeleton" style="width: 120px; height: 32px; border-radius: 99px;"></div>
          </div>

          <!-- Sort Options -->
          <div class="sort-tabs">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-muted);">
              Sort By:
            </span>
            <div class="sort-btn-group">
              <button class="sort-btn ${this.state.sort === 'latest' ? 'active' : ''}" data-sort="latest">
                Latest
              </button>
              <button class="sort-btn ${this.state.sort === 'pastor_prayed' ? 'active' : ''}" data-sort="pastor_prayed">
                ${Icons.get('shieldCheck', { size: 13, color: 'var(--color-gold)' })} PDaniel Prayed
              </button>
              <button class="sort-btn ${this.state.sort === 'most_prayed' ? 'active' : ''}" data-sort="most_prayed">
                Most Intercessions
              </button>
              <button class="sort-btn ${this.state.sort === 'needs_prayer' ? 'active' : ''}" data-sort="needs_prayer">
                Needs Immediate Intercession
              </button>
            </div>
          </div>
        </div>

        <!-- Prayers Grid Container -->
        <div id="prayers-results-container">
          <div class="prayers-grid">
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
          </div>
        </div>

        <!-- Server-side Pagination Container -->
        <div id="wall-pagination-container"></div>
      </div>
    `;

    // Load categories & prayers
    await this.loadCategories();
    await this.fetchPrayers();
    this.bindToolbarEvents();
  },

  async loadCategories() {
    try {
      const res = await API.getCategories();
      this.state.categories = res.categories || [];
      const bar = document.getElementById('category-filter-bar');
      if (!bar) return;

      bar.innerHTML = `
        <button class="cat-pill ${this.state.category === 'all' ? 'active' : ''}" data-category="all">
          ${Icons.get('globe', { size: 13 })} All Petitions
        </button>
        ${this.state.categories.map(c => `
          <button class="cat-pill ${this.state.category === c.slug ? 'active' : ''}" data-category="${c.slug}">
            ${Icons.get(c.slug, { size: 13 })} ${escapeHTML(c.name)} ${c.prayer_count > 0 ? `(${c.prayer_count})` : ''}
          </button>
        `).join('')}
      `;

      bar.querySelectorAll('.cat-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          bar.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.category = btn.dataset.category;
          this.state.page = 1;
          this.fetchPrayers();
        });
      });
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  },

  async fetchPrayers() {
    const container = document.getElementById('prayers-results-container');
    const paginationContainer = document.getElementById('wall-pagination-container');
    if (!container) return;

    container.innerHTML = `
      <div class="prayers-grid">
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
      </div>
    `;

    try {
      const res = await API.getPrayers({
        page: this.state.page,
        limit: this.state.limit,
        category: this.state.category,
        sort: this.state.sort,
        search: this.state.search
      });

      this.state.prayers = res.prayers || [];
      this.state.pagination = res.pagination || {
        page: 1, limit: 12, total: 0, totalPages: 1, hasNext: false, hasPrev: false
      };

      if (this.state.prayers.length === 0) {
        container.innerHTML = `
          <div class="confirmation-card" style="margin-block: 2rem;">
            <div class="confirmation-icon-wrap">${Icons.get('flame', { size: 32, color: 'var(--color-gold)' })}</div>
            <h3 style="font-size: 1.35rem; color: #FFFFFF;">No Petitions Found</h3>
            <p style="color: var(--color-text-muted); max-width: 420px;">
              ${this.state.search ? `No prayer petitions matched "${escapeHTML(this.state.search)}".` : 'Be the first to lay a petition on this altar.'}
            </p>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
              <a href="#/submit" class="btn btn-gold btn-sm">Submit a Petition</a>
              ${this.state.category !== 'all' || this.state.search ? `
                <button class="btn btn-outline btn-sm reset-filter-btn">Reset Filters</button>
              ` : ''}
            </div>
          </div>
        `;

        const resetBtn = container.querySelector('.reset-filter-btn');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            this.state.category = 'all';
            this.state.search = '';
            this.state.page = 1;
            const searchInput = document.getElementById('wall-search-input');
            if (searchInput) searchInput.value = '';
            this.fetchPrayers();
          });
        }

        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
      }

      // Render cards
      container.innerHTML = `
        <div class="prayers-grid">
          ${this.state.prayers.map(p => PrayerCard.render(p)).join('')}
        </div>
      `;

      PrayerCard.bindEvents(container);

      // Render Pagination
      this.renderPagination(paginationContainer);

    } catch (err) {
      console.error('Fetch prayers error:', err);
      container.innerHTML = `
        <div class="confirmation-card">
          <p style="color: var(--color-danger);">Unable to load prayer requests right now. Please check your connection.</p>
          <button class="btn btn-primary btn-sm retry-btn" style="margin-top: 1rem;">Retry</button>
        </div>
      `;
      container.querySelector('.retry-btn')?.addEventListener('click', () => this.fetchPrayers());
    }
  },

  renderPagination(container) {
    if (!container) return;
    const { page, totalPages, total, limit } = this.state.pagination;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    let pageButtonsHTML = '';

    // Generate page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
        pageButtonsHTML += `
          <button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">
            ${i}
          </button>
        `;
      } else if (i === page - 3 || i === page + 3) {
        pageButtonsHTML += `<span style="padding: 0 4px; color: var(--color-text-muted);">…</span>`;
      }
    }

    container.innerHTML = `
      <div class="pagination-wrapper">
        <button class="page-btn prev-btn" ${page <= 1 ? 'disabled' : ''} aria-label="Previous Page">
          &larr; Prev
        </button>

        ${pageButtonsHTML}

        <button class="page-btn next-btn" ${page >= totalPages ? 'disabled' : ''} aria-label="Next Page">
          Next &rarr;
        </button>
      </div>
      <div class="text-center" style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 2rem;">
        Showing ${start}–${end} of <strong>${total}</strong> prayer petitions
      </div>
    `;

    // Bind page buttons
    container.querySelectorAll('.page-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPage = parseInt(btn.dataset.page, 10);
        if (targetPage !== this.state.page) {
          this.state.page = targetPage;
          this.fetchPrayers();
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }
      });
    });

    const prevBtn = container.querySelector('.prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.state.page > 1) {
          this.state.page--;
          this.fetchPrayers();
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }
      });
    }

    const nextBtn = container.querySelector('.next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.state.page < totalPages) {
          this.state.page++;
          this.fetchPrayers();
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }
      });
    }
  },

  bindToolbarEvents() {
    const searchInput = document.getElementById('wall-search-input');
    if (searchInput) {
      let debounceTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          this.state.search = e.target.value.trim();
          this.state.page = 1;
          this.fetchPrayers();
        }, 350);
      });
    }

    const sortGroup = document.querySelector('.sort-btn-group');
    if (sortGroup) {
      sortGroup.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          sortGroup.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.sort = btn.dataset.sort;
          this.state.page = 1;
          this.fetchPrayers();
        });
      });
    }
  }
};
