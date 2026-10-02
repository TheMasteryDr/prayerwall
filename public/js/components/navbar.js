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
            ${Icons.get('flame', { size: 22, color: '#070B12' })}
          </div>
          <div class="brand-titles">
            <span style="font-family: var(--font-heading); font-weight: 800; color: #FFFFFF; font-size: 1.25rem; letter-spacing: -0.01em;" class="brand-title-text">
              FLAMING PRAYER WALL
            </span>
            <span class="brand-text-sub">Fire On My Altar • PDaniel Ministry</span>
          </div>
        </a>

        <!-- Desktop Navigation Links / Mobile Drawer (Responsive containment) -->
        <ul class="nav-links" id="desktop-nav-links">
          <li>
            <a href="#/" class="nav-link ${currentHash === '#/' ? 'active' : ''}">
              ${Icons.get('bible', { size: 16 })}
              <span>Home</span>
            </a>
          </li>
          <li>
            <a href="#/prayers" class="nav-link ${currentHash.startsWith('#/prayers') ? 'active' : ''}">
              ${Icons.get('globe', { size: 16 })}
              <span>Prayer Wall</span>
            </a>
          </li>
          <li>
            <a href="#/submit" class="nav-link ${currentHash === '#/submit' ? 'active' : ''}">
              ${Icons.get('flame', { size: 16, color: 'var(--color-gold)' })}
              <span>Ask for Prayer</span>
            </a>
          </li>
          ${user ? `
            <li>
              <a href="#/my-prayers" class="nav-link ${currentHash === '#/my-prayers' ? 'active' : ''}">
                ${Icons.get('pray', { size: 16 })}
                <span>My Prayers</span>
              </a>
            </li>
          ` : ''}
          ${isPastor ? `
            <li>
              <a href="#/admin" class="nav-pastor-badge-link ${currentHash === '#/admin' ? 'active' : ''}">
                ${Icons.get('shieldCheck', { size: 14, color: 'var(--color-gold)' })}
                <span>PDaniel Portal</span>
              </a>
            </li>
          ` : ''}

          <!-- Mobile Drawer Auth Bar -->
          ${!user ? `
            <li class="mobile-drawer-auth" style="margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid rgba(255, 255, 255, 0.08);">
              <button class="btn btn-gold btn-sm open-login-drawer-btn" style="width: 100%; justify-content: center; gap: 8px;">
                ${Icons.get('user', { size: 15, color: '#070B12' })}
                <span>Sign In / Register</span>
              </button>
            </li>
          ` : `
            <li class="mobile-drawer-auth" style="margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <div style="font-size: 0.85rem; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                Signed in as <strong style="color: #FFFFFF;">${escapeHTML(user.name)}</strong>
              </div>
              <button class="btn-signout drawer-logout-btn" style="padding: 0.35rem 0.75rem; border-radius: 99px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #FCA5A5; display: inline-flex; align-items: center; gap: 4px; font-size: 0.8rem;">
                ${Icons.get('logout', { size: 13 })}
                <span>Sign Out</span>
              </button>
            </li>
          `}
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
              <div class="user-profile-pill" style="cursor: pointer;" title="View Journal / Profile">
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
                      ? `${Icons.get('shieldCheck', { size: 11, color: 'var(--color-gold)' })} Shepherd` 
                      : 'Intercessor'
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
              ${Icons.get('user', { size: 14 })}
              <span class="login-btn-label">Sign In</span>
            </button>
            <a href="#/submit" class="btn btn-gold btn-sm header-cta-btn">
              ${Icons.get('flame', { size: 15, color: '#070B12' })}
              <span>Ask for Prayer</span>
            </a>
          `}

          <!-- Prominent Mobile Collapse Toggle -->
          <button class="mobile-nav-toggle" id="mobile-nav-toggle" aria-label="Toggle Navigation Menu" aria-expanded="false">
            <span class="toggle-icon-hamburger">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              <span class="mobile-toggle-label">Menu</span>
            </span>
            <span class="toggle-icon-close" style="display: none;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span class="mobile-toggle-label">Close</span>
            </span>
          </button>
        </div>
      </div>
      <!-- Dimmed backdrop overlay for mobile drawer -->
      <div class="mobile-menu-backdrop" id="mobile-menu-backdrop"></div>
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

    const profilePill = header.querySelector('.user-profile-pill');
    if (profilePill) {
      profilePill.addEventListener('click', () => {
        window.location.hash = State.isPastor() ? '#/admin' : '#/my-prayers';
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
    const backdrop = header.querySelector('#mobile-menu-backdrop');
    if (mobileToggle && navLinks) {
      const openIcon = mobileToggle.querySelector('.toggle-icon-hamburger');
      const closeIcon = mobileToggle.querySelector('.toggle-icon-close');

      const setDrawerState = (open) => {
        if (open) {
          navLinks.classList.add('mobile-open');
          mobileToggle.classList.add('is-active');
          mobileToggle.setAttribute('aria-expanded', 'true');
          if (openIcon) openIcon.style.display = 'none';
          if (closeIcon) closeIcon.style.display = 'inline-flex';
          if (backdrop) backdrop.classList.add('active');
        } else {
          navLinks.classList.remove('mobile-open');
          mobileToggle.classList.remove('is-active');
          mobileToggle.setAttribute('aria-expanded', 'false');
          if (openIcon) openIcon.style.display = 'inline-flex';
          if (closeIcon) closeIcon.style.display = 'none';
          if (backdrop) backdrop.classList.remove('active');
        }
      };

      mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        setDrawerState(!navLinks.classList.contains('mobile-open'));
      });

      if (backdrop) {
        backdrop.addEventListener('click', () => setDrawerState(false));
      }

      // Close mobile drawer when clicking a link
      navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          setDrawerState(false);
        });
      });

      // Drawer auth actions
      const drawerLoginBtn = navLinks.querySelector('.open-login-drawer-btn');
      if (drawerLoginBtn) {
        drawerLoginBtn.addEventListener('click', () => {
          setDrawerState(false);
          Modals.openAuthModal();
        });
      }

      const drawerLogoutBtn = navLinks.querySelector('.drawer-logout-btn');
      if (drawerLogoutBtn) {
        drawerLogoutBtn.addEventListener('click', () => {
          setDrawerState(false);
          State.logout();
          Toast.show('You have been signed out.', 'info');
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        });
      }

      // Close mobile drawer on outside click or Escape key
      document.addEventListener('click', (e) => {
        if (!header.contains(e.target)) {
          setDrawerState(false);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('mobile-open')) {
          setDrawerState(false);
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
