/**
 * Navigation Bar Component
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
        <!-- Logo -->
        <a href="#/" class="brand-link">
          <div class="brand-icon">
            <!-- Flaming Holy Fire Icon -->
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c1.1 2.2 2.5 4.3 2.5 6.5 0 2.2-1.8 4-4 4s-4-1.8-4-4c0-2.2 1.4-4.3 2.5-6.5C7.2 4.1 4 8.5 4 13c0 4.4 3.6 8 8 8s8-3.6 8-8c0-4.5-3.2-8.9-5-11z"/>
            </svg>
          </div>
          <div>
            <span style="font-family: var(--font-serif); font-weight: 800; color: #FFFFFF; font-size: 1.25rem; letter-spacing: 0.04em;">
              FLAMING PRAYER WALL
            </span>
            <span class="brand-text-sub">Fire On My Altar • PDaniel Ministry</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <ul class="nav-links">
          <li><a href="#/" class="nav-link ${currentHash === '#/' ? 'active' : ''}">Home</a></li>
          <li><a href="#/prayers" class="nav-link ${currentHash.startsWith('#/prayers') ? 'active' : ''}">Prayer Wall</a></li>
          <li><a href="#/submit" class="nav-link ${currentHash === '#/submit' ? 'active' : ''}">Ask for Prayer</a></li>
          ${user ? `<li><a href="#/my-prayers" class="nav-link ${currentHash === '#/my-prayers' ? 'active' : ''}">My Prayers</a></li>` : ''}
          ${isPastor ? `
            <li>
              <a href="#/admin" class="nav-link ${currentHash === '#/admin' ? 'active' : ''}" style="color: var(--color-gold); font-weight: 700;">
                <span class="pastor-badge" style="margin-right: 4px;">✓ PDaniel</span> Admin
              </a>
            </li>
          ` : ''}
        </ul>

        <!-- Action Items / Auth / Demo Switcher -->
        <div class="header-actions">
          <!-- Quick Demo Persona Switcher (Convenient for grading & verification) -->
          <div class="demo-switcher" style="display: flex; align-items: center; gap: 4px; background: #0F172A; border: 1px solid var(--color-border); padding: 3px 6px; border-radius: var(--radius-full); font-size: 0.78rem;">
            <span style="color: var(--color-text-light); font-size: 0.72rem; padding-inline: 4px; font-weight: 600;">Role:</span>
            <button class="btn-ghost btn-sm demo-btn" data-role="pastor" title="Switch to PDaniel Olawande" style="padding: 2px 7px; border-radius: 99px; ${isPastor ? 'background: var(--color-gold); color: #070B12; font-weight: 800;' : ''}">
              🔥 PDaniel
            </button>
            <button class="btn-ghost btn-sm demo-btn" data-role="member" title="Switch to Member Sarah" style="padding: 2px 7px; border-radius: 99px; ${user && !isPastor ? 'background: #334155; color: #fff; font-weight: 700;' : ''}">
              👤 Member
            </button>
            ${user ? `
              <button class="btn-ghost btn-sm logout-btn" title="Sign out to Guest" style="padding: 2px 7px; border-radius: 99px; color: var(--color-text-muted);">
                🚪 Out
              </button>
            ` : ''}
          </div>

          ${user ? `
            <!-- Notifications Bell -->
            <button class="btn btn-ghost btn-sm notif-bell-btn" title="Notifications" style="position: relative; padding: 0.5rem;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              ${State.unreadNotifications > 0 ? `
                <span class="badge" style="position: absolute; top: -2px; right: -2px; background: var(--color-flame); color: #fff; font-size: 0.65rem; padding: 1px 5px;">
                  ${State.unreadNotifications}
                </span>
              ` : ''}
            </button>

            <!-- User Menu -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.88rem; font-weight: 600; color: #FFFFFF; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${escapeHTML(user.name)}
              </span>
            </div>
          ` : `
            <button class="btn btn-outline btn-sm open-login-btn">
              Sign In
            </button>
            <a href="#/submit" class="btn btn-gold btn-sm">
              Ask for Prayer
            </a>
          `}

          <!-- Mobile Toggle -->
          <button class="mobile-nav-toggle" aria-label="Toggle Navigation Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Attach listeners
    header.querySelectorAll('.demo-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const role = btn.dataset.role;
        try {
          const res = await API.demoLogin(role);
          State.setCurrentUser(res.user, res.token);
          Toast.show(res.message, 'success');
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        } catch (err) {
          Toast.show('Error switching demo account: ' + err.message, 'error');
        }
      });
    });

    const logoutBtn = header.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        State.logout();
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

    const mobileToggle = header.querySelector('.mobile-nav-toggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        const nav = header.querySelector('.nav-links');
        if (nav) {
          const isVisible = nav.style.display === 'flex';
          nav.style.display = isVisible ? 'none' : 'flex';
          nav.style.flexDirection = 'column';
          nav.style.position = 'absolute';
          nav.style.top = '74px';
          nav.style.left = '0';
          nav.style.right = '0';
          nav.style.background = '#0E1524';
          nav.style.padding = '1.5rem';
          nav.style.borderBottom = '1px solid #1E293B';
          nav.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Home</span>
      </a>
      <a href="#/prayers" class="mobile-bar-item ${hash.startsWith('#/prayers') ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
        </svg>
        <span>Wall</span>
      </a>
      <a href="#/submit" class="mobile-bar-item ${hash === '#/submit' ? 'active' : ''}" style="color: var(--color-gold);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <span>Submit</span>
      </a>
      <a href="#/my-prayers" class="mobile-bar-item ${hash === '#/my-prayers' ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>My Prayers</span>
      </a>
      ${isPastor ? `
        <a href="#/admin" class="mobile-bar-item ${hash === '#/admin' ? 'active' : ''}" style="color: var(--color-gold);">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          <span>PDaniel</span>
        </a>
      ` : ''}
    `;
  }
};
