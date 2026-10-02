/**
 * User Dashboard / My Prayers View - Flaming Prayer Wall
 */
const MyPrayersView = {
  activeTab: 'my-requests', // 'my-requests', 'standing-with', 'notifications', 'profile'

  async render() {
    const main = document.getElementById('main-content');
    if (!main) return;

    const user = State.currentUser;

    if (!user) {
      main.innerHTML = `
        <div class="container" style="padding-top: var(--space-3xl); max-width: 600px;">
          <div class="confirmation-card">
            <div class="confirmation-icon-wrap">${Icons.get('user', { size: 32, color: 'var(--color-gold)' })}</div>
            <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 700; color: #FFFFFF; letter-spacing: -0.015em;">
              Sign In to View Your Petitions
            </h2>
            <p style="color: var(--color-text-muted); line-height: 1.6; max-width: 440px;">
              Create an account or sign in to track your personal petitions, see PDaniel Olawande's prayers, and receive notifications when brethren pray for you.
            </p>
            <div style="display: flex; gap: 0.75rem; margin-top: 1.25rem; flex-wrap: wrap; justify-content: center;">
              <button class="btn btn-gold open-auth-modal-btn">
                ${Icons.get('user', { size: 16, color: '#070B12' })}
                <span>Sign In / Register</span>
              </button>
            </div>
          </div>
        </div>
      `;

      main.querySelector('.open-auth-modal-btn')?.addEventListener('click', () => Modals.openAuthModal());
      return;
    }

    // Render Dashboard Shell
    main.innerHTML = `
      <div class="container" style="padding-top: var(--space-xl);">
        <div class="section-header" style="margin-bottom: 1.5rem;">
          <div>
            <h1 style="font-size: 2.2rem;">My Prayer Journal</h1>
            <p class="section-subtitle">
              Welcome, ${escapeHTML(user.name)}. Track your petitions and community intercessions.
            </p>
          </div>
          <a href="#/submit" class="btn btn-gold btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
            ${Icons.get('flame', { size: 15, color: '#070B12' })}
            <span>New Prayer Petition</span>
          </a>
        </div>

        <div class="dashboard-layout">
          <!-- Sidebar Navigation -->
          <aside class="dashboard-sidebar">
            <button class="sidebar-tab-btn ${this.activeTab === 'my-requests' ? 'active' : ''}" data-tab="my-requests" style="display: flex; align-items: center; gap: 8px;">
              ${Icons.get('bible', { size: 16 })}
              <span>My Petitions</span>
            </button>
            <button class="sidebar-tab-btn ${this.activeTab === 'standing-with' ? 'active' : ''}" data-tab="standing-with" style="display: flex; align-items: center; gap: 8px;">
              ${Icons.get('pray', { size: 16 })}
              <span>Prayers I Stand With</span>
            </button>
            <button class="sidebar-tab-btn ${this.activeTab === 'notifications' ? 'active' : ''}" data-tab="notifications" style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${Icons.get('bell', { size: 16 })}
                <span>Notifications</span>
              </div>
              ${State.unreadNotifications > 0 ? `<span class="sidebar-badge">${State.unreadNotifications}</span>` : ''}
            </button>
            <button class="sidebar-tab-btn ${this.activeTab === 'profile' ? 'active' : ''}" data-tab="profile" style="display: flex; align-items: center; gap: 8px;">
              ${Icons.get('user', { size: 16 })}
              <span>Account & Profile</span>
            </button>
          </aside>

          <!-- Tab Content Area -->
          <div id="dashboard-tab-content">
            <div class="skeleton skeleton-card" style="height: 300px;"></div>
          </div>
        </div>
      </div>
    `;

    // Bind sidebar tabs
    main.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        main.querySelectorAll('.sidebar-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.dataset.tab;
        this.loadTabContent();
      });
    });

    await this.loadTabContent();
  },

  async loadTabContent() {
    const container = document.getElementById('dashboard-tab-content');
    if (!container) return;

    if (this.activeTab === 'my-requests') {
      await this.renderMyRequests(container);
    } else if (this.activeTab === 'standing-with') {
      await this.renderStandingWith(container);
    } else if (this.activeTab === 'notifications') {
      await this.renderNotifications(container);
    } else if (this.activeTab === 'profile') {
      this.renderProfile(container);
    }
  },

  async renderMyRequests(container) {
    container.innerHTML = `<div class="skeleton skeleton-card"></div>`;
    try {
      const res = await API.getUserPrayers();
      const prayers = res.prayers || [];

      if (prayers.length === 0) {
        container.innerHTML = `
          <div class="form-card text-center" style="padding: 3rem 1.5rem;">
            <div class="confirmation-icon-wrap" style="margin: 0 auto 1rem; width: 56px; height: 56px;">
              ${Icons.get('flame', { size: 28, color: 'var(--color-gold)' })}
            </div>
            <h3 style="font-size: 1.3rem; color: #FFFFFF;">No Petitions on the Altar</h3>
            <p style="color: var(--color-text-muted); margin-top: 0.5rem; max-width: 400px; margin-inline: auto;">
              Whatever you are trusting God for, do not carry it alone. Share your petition on the Flaming Prayer Wall.
            </p>
            <a href="#/submit" class="btn btn-gold btn-sm" style="margin-top: 1.25rem;">
              Submit Your Petition
            </a>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${prayers.map(p => `
            <div class="prayer-card" style="padding: 1.5rem;" id="user-req-${p.id}">
              <div class="prayer-card-header">
                <div class="prayer-meta">
                  <span class="badge badge-category" style="display: inline-flex; align-items: center; gap: 4px;">
                    ${p.category ? Icons.get(p.category.slug, { size: 12 }) : Icons.get('flame', { size: 12 })}
                    ${escapeHTML(p.category?.name || 'General')}
                  </span>
                  ${p.visibility === 'private' ? `<span class="badge badge-private" style="display: inline-flex; align-items: center; gap: 4px;">${Icons.get('lock', { size: 12 })} Confidential</span>` : '<span class="badge badge-category">Public</span>'}
                  <span class="meta-dot">•</span>
                  <span>Submitted ${timeAgo(p.created_at)}</span>
                </div>
              </div>

              <h3 class="prayer-card-title">
                <a href="#/prayers/${p.id}">${escapeHTML(p.title)}</a>
              </h3>

              <div class="prayer-card-content" style="-webkit-line-clamp: 3;">
                ${escapeHTML(p.content)}
              </div>

              <!-- Pastor status banner -->
              ${p.has_pastor_prayed ? `
                <div class="pastor-prayer-box" style="margin-top: 0.5rem; padding: 0.85rem 1rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span class="pastor-badge" style="display: inline-flex; align-items: center; gap: 5px;">
                      ${Icons.get('shieldCheck', { size: 13, color: 'var(--color-gold)' })}
                      PDaniel Olawande has prayed for your petition
                    </span>
                    <span class="pastor-time">${timeAgo(p.pastor_response?.created_at)}</span>
                  </div>
                  ${p.pastor_response?.response_text ? `
                    <div class="pastor-prayer-text" style="font-size: 0.92rem; margin-top: 0.35rem;">
                      "${escapeHTML(p.pastor_response.response_text)}"
                    </div>
                  ` : ''}
                </div>
              ` : `
                <div style="font-size: 0.82rem; color: var(--color-text-muted); background: #0A0F1A; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); border: 1px dashed var(--color-border); display: flex; align-items: center; gap: 6px;">
                  ${Icons.get('clock', { size: 14, color: 'var(--color-gold)' })}
                  <span>In PDaniel Olawande's prayer queue. You will be notified when he intercedes.</span>
                </div>
              `}

              <div class="prayer-card-footer" style="padding-top: 0.75rem;">
                <div class="prayer-count-stat">
                  ${Icons.get('pray', { size: 15, color: 'var(--color-gold)' })}
                  <span><strong>${p.prayer_count}</strong> people prayed for this</span>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <a href="#/prayers/${p.id}" class="btn btn-sm btn-outline">View Details</a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

    } catch (err) {
      container.innerHTML = `<p style="color: var(--color-danger);">${escapeHTML(err.message)}</p>`;
    }
  },

  async renderStandingWith(container) {
    container.innerHTML = `<div class="skeleton skeleton-card"></div>`;
    try {
      const res = await API.getUserIntercessions();
      const intercessions = res.intercessions || [];

      if (intercessions.length === 0) {
        container.innerHTML = `
          <div class="form-card text-center" style="padding: 3rem 1.5rem;">
            <div class="confirmation-icon-wrap" style="margin: 0 auto 1rem; width: 56px; height: 56px;">
              ${Icons.get('pray', { size: 28, color: 'var(--color-gold)' })}
            </div>
            <h3 style="font-size: 1.3rem; color: #FFFFFF;">No Intercessions Lifted Yet</h3>
            <p style="color: var(--color-text-muted); margin-top: 0.5rem; max-width: 400px; margin-inline: auto;">
              When you click "I Prayed" on the Flaming Wall, those petitions are kept in your prayer journal so you can continue holding them up before God.
            </p>
            <a href="#/prayers" class="btn btn-gold btn-sm" style="margin-top: 1.25rem;">
              Visit Flaming Wall
            </a>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${intercessions.map(p => `
            <div class="prayer-card" style="padding: 1.5rem;">
              <div class="prayer-meta">
                <span class="badge badge-category">${escapeHTML(p.category?.name || 'General')}</span>
                <span class="meta-dot">•</span>
                <span class="prayer-author">${escapeHTML(p.author_name)}</span>
                <span class="meta-dot">•</span>
                <span>You prayed ${timeAgo(p.intercession_date)}</span>
              </div>

              <h3 class="prayer-card-title">
                <a href="#/prayers/${p.id}">${escapeHTML(p.title)}</a>
              </h3>

              <div class="prayer-card-content" style="-webkit-line-clamp: 2;">
                ${escapeHTML(p.content)}
              </div>

              <div class="prayer-card-footer" style="padding-top: 0.75rem;">
                <div class="prayer-count-stat">
                  ${Icons.get('pray', { size: 15, color: 'var(--color-gold)' })}
                  <span><strong>${p.prayer_count}</strong> people standing in agreement</span>
                </div>
                <a href="#/prayers/${p.id}" class="btn btn-sm btn-outline">Keep Praying</a>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--color-danger);">${escapeHTML(err.message)}</p>`;
    }
  },

  async renderNotifications(container) {
    container.innerHTML = `<div class="skeleton skeleton-card"></div>`;
    try {
      const res = await API.getUserNotifications();
      const notifs = res.notifications || [];

      if (notifs.some(n => !n.read_at)) {
        API.markNotificationsRead().then(() => {
          State.unreadNotifications = 0;
          Navbar.render();
        });
      }

      if (notifs.length === 0) {
        container.innerHTML = `
          <div class="form-card text-center" style="padding: 3rem 1.5rem;">
            <div class="confirmation-icon-wrap" style="margin: 0 auto 1rem; width: 56px; height: 56px;">
              ${Icons.get('bell', { size: 28, color: 'var(--color-gold)' })}
            </div>
            <h3 style="font-size: 1.3rem; color: #FFFFFF;">No Notifications</h3>
            <p style="color: var(--color-text-muted); margin-top: 0.5rem;">
              You will receive alerts here whenever someone stands in prayer for you or PDaniel responds.
            </p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${notifs.map(n => {
            const isPastorNotif = n.type === 'pastor_prayed' || n.type === 'pastor_response';
            return `
              <div class="comment-card" style="${isPastorNotif ? 'border-left: 4px solid var(--color-gold); background: #141C2E;' : ''}">
                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span>${isPastorNotif ? Icons.get('flame', { size: 18, color: 'var(--color-gold)' }) : Icons.get('pray', { size: 18 })}</span>
                    <span style="font-size: 0.95rem; font-weight: 600; color: #FFFFFF;">
                      ${escapeHTML(n.message)}
                    </span>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--color-text-muted); white-space: nowrap;">
                    ${timeAgo(n.created_at)}
                  </span>
                </div>
                ${n.prayer_title ? `
                  <div style="margin-top: 0.4rem; padding-left: 1.75rem;">
                    <a href="#/prayers/${n.prayer_request_id}" style="font-size: 0.85rem; color: var(--color-gold); font-weight: 600;">
                      View Petition: "${escapeHTML(n.prayer_title)}" &rarr;
                    </a>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--color-danger);">${escapeHTML(err.message)}</p>`;
    }
  },

  renderProfile(container) {
    const user = State.currentUser;
    container.innerHTML = `
      <div class="form-card">
        <h3 style="font-size: 1.3rem; margin-bottom: 1.25rem; color: #FFFFFF;">Account Details</h3>
        <form id="profile-update-form">
          <div class="form-group">
            <label class="form-label" for="prof-name">Full Name</label>
            <input type="text" id="prof-name" class="form-input" value="${escapeHTML(user.name)}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="prof-email">Email Address</label>
            <input type="email" id="prof-email" class="form-input" value="${escapeHTML(user.email)}" disabled style="opacity: 0.6;">
            <span class="form-hint">Email address cannot be modified once verified.</span>
          </div>
          <div class="form-group">
            <label class="form-label" for="prof-bio">Spiritual Bio / About You</label>
            <textarea id="prof-bio" class="form-textarea" rows="3" placeholder="Tell the community a little about your walk with God...">${escapeHTML(user.bio || '')}</textarea>
          </div>
          <button type="submit" class="btn btn-gold">Save Profile</button>
        </form>
      </div>
    `;

    container.querySelector('#profile-update-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('prof-name').value;
      const bio = document.getElementById('prof-bio').value;
      try {
        const res = await API.updateProfile({ name, bio });
        State.setCurrentUser(res.user, res.token);
        Toast.show(res.message, 'success');
        Navbar.render();
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    });
  }
};
