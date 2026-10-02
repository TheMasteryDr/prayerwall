/**
 * Navigation Bar Component - Flaming Prayer Wall
 * Responsive, regal, and responsive navigation header with SVG icons
 */
const Navbar = {
  render() {
    const header = document.getElementById('site-header');
    if (!header) return;

    const user = State.currentUser;
    const isPastor = State.isPastor();
    const currentHash = window.location.hash || '#/';

    header.innerHTML = `
      <div class="container header-inner">
        <!-- Brand Logo -->
        <a href="#/" class="brand-link">
          <div class="brand-icon">
            ${Icons.get('flame', { size: 24, color: '#070B12' })}
          </div>
          <div>
            <span style="font-family: var(--font-serif); font-weight: 800; color: #FFFFFF; font-size: 1.25rem; letter-spacing: 0.04em;">
              FLAMING PRAYER WALL
            </span>
            <span class="brand-text-sub">Fire On My Altar • PDaniel Ministry</span>
          </div>
        </a>

        <!-- Desktop Navigation Links (Nowrap, Responsive Gaps) -->
        <ul class="nav-links" id="desktop-nav-links">
          <li><a href="#/" class="nav-link ${currentHash === '#/' ? 'active' : ''}">Home</a></li>
          <li><a href="#/prayers" class="nav-link ${currentHash.startsWith('#/prayers') ? 'active' : ''}">Prayer Wall</a></li>
          <li><a href="#/submit" class="nav-link ${currentHash === '#/submit' ? 'active' : ''}">Ask for Prayer</a></li>
          ${user ? `<li><a href="#/my-prayers" class="nav-link ${currentHash === '#/my-prayers' ? 'active' : ''}">My Prayers</a></li>` : ''}
          ${isPastor ? `
            <li>
              <a href="#/admin" class="nav-pastor-badge-link ${currentHash === '#/admin' ? 'active' : ''}">
                ${Icons.get('shieldCheck', { size: 14, color: 'var(--color-gold)' })}
                <span>PDaniel Portal</span>
              </a>
            </li>
          ` : ''}
        </ul>

        <!-- Action Items / Auth -->
        <div class="header-actions">
          ${user ? `
            <!-- Authenticated User Account Bar -->
            <div class="user-account-bar">
              <!-- Notifications Bell -->
              <button class="nav-icon-btn notif-bell-btn" title="Altar Notifications" aria-label="Notifications">
                ${Icons.get('bell', { size: 18 })}
                ${State.unreadNotifications > 0 ? `
                  <span class="notif-pulse-badge">${State.unreadNotifications}</span>
                ` : ''}
              </button>

              <!-- Profile Capsule -->
              <div class="user-profile-pill">
                <div class="user-avatar-wrap">
                  ${isPastor 
                    ? `<img src="/images/pdaniel.jpg" alt="PDaniel Olawande" class="user-avatar-img">`
                    : `<div class="user-avatar-initials">${escapeHTML((user.name || 'U').charAt(0).toUpperCase())}</div>`
                  }
                </div>
                <div class="user-meta">
                  <span class="user-name-text">${escapeHTML(user.name)}</span>
                  <span class="user-role-label ${isPastor ? 'pastor-role' : ''}">
                    ${isPastor 
                      ? `${Icons.get('shieldCheck', { size: 11, color: 'var(--color-gold)' })} Verified Shepherd` 
                      : 'Altar Intercessor'
                    }
                  </span>
                </div>
              </div>

              <!-- Sign Out Button -->
              <button class="btn-signout logout-btn" title="Sign Out of Altar">
                ${Icons.get('logout', { size: 15 })}
                <span class="logout-text">Sign Out</span>
              </button>
            </div>
          ` : `
            <!-- Guest / Unauthenticated Actions -->
            <button class="btn btn-outline btn-sm open-login-btn">
              ${Icons.get('user', { size: 15 })}
              <span>Sign In</span>
            </button>
            <a href="#/submit" class="btn btn-gold btn-sm">
              ${Icons.get('flame', { size: 15, color: '#070B12' })}
              <span>Ask for Prayer</span>
            </a>
          `}

          <!-- Mobile Toggle -->
          <button class="mobile-nav-toggle" id="mobile-nav-toggle" aria-label="Toggle Navigation Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Attach event listeners
    const logoutBtn = header.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        State.logout();
        Toast.show('You have been signed out.', 'info');
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
    }

    const openLoginBtn = header.querySelector('.open-login-btn');
    if (openLoginBtn) {
      openLoginBtn.addEventListener('click', () => {
        Modals.openAuthModal();
      });
    }

    const notifBell = header.querySelector('.notif-bell-btn');
    if (notifBell) {
      notifBell.addEventListener('click', () => {
        window.location.hash = '#/my-prayers';
      });
    }

    const mobileToggle = header.querySelector('#mobile-nav-toggle');
    const navLinks = header.querySelector('#desktop-nav-links');
    if (mobileToggle && navLinks) {
      mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('mobile-open');
      });

      // Close mobile drawer when clicking a link
      navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          navLinks.classList.remove('mobile-open');
        });
      });

      // Close mobile drawer on outside click
      document.addEventListener('click', (e) => {
        if (!header.contains(e.target)) {
          navLinks.classList.remove('mobile-open');
        }
      });
    }
  },

  renderMobileBottomBar() {
    const bar = document.getElementById('mobile-bottom-bar');
    if (!bar) return;

    const hash = window.location.hash || '#/';
    const isPastor = State.isPastor();

    bar.innerHTML = `
      <a href="#/" class="mobile-bar-item ${hash === '#/' ? 'active' : ''}">
        ${Icons.get('bible', { size: 20 })}
        <span>Home</span>
      </a>
      <a href="#/prayers" class="mobile-bar-item ${hash.startsWith('#/prayers') ? 'active' : ''}">
        ${Icons.get('globe', { size: 20 })}
        <span>Wall</span>
      </a>
      <a href="#/submit" class="mobile-bar-item ${hash === '#/submit' ? 'active' : ''}" style="color: var(--color-gold);">
        ${Icons.get('flame', { size: 22, color: 'var(--color-gold)' })}
        <span>Petition</span>
      </a>
      <a href="#/my-prayers" class="mobile-bar-item ${hash === '#/my-prayers' ? 'active' : ''}">
        ${Icons.get('pray', { size: 20 })}
        <span>My Prayers</span>
      </a>
      ${isPastor ? `
        <a href="#/admin" class="mobile-bar-item ${hash === '#/admin' ? 'active' : ''}" style="color: var(--color-gold);">
          ${Icons.get('shieldCheck', { size: 20, color: 'var(--color-gold)' })}
          <span>Portal</span>
        </a>
      ` : ''}
    `;
  }
};
