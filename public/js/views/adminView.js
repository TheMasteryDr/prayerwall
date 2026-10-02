/**
 * Pastor & Administrator Command Center View - Flaming Prayer Wall
 */
const AdminView = {
  activeQueue: 'awaiting', // 'awaiting', 'private', 'prayed', 'reports', 'members', 'settings'
  stats: {},
  prayers: [],
  memberSearch: '',
  memberRole: 'all',

  async render() {
    const main = document.getElementById('main-content');
    if (!main) return;

    if (!State.isPastor()) {
      main.innerHTML = `
        <div class="container" style="padding-top: var(--space-3xl); max-width: 600px;">
          <div class="confirmation-card">
            <div class="confirmation-icon-wrap" style="color: var(--color-danger); border-color: rgba(239, 68, 68, 0.4);">${Icons.get('lock', { size: 32, color: 'var(--color-danger)' })}</div>
            <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 700; color: #FFFFFF; letter-spacing: -0.01em;">
              Pastoral & Altar Access Restricted
            </h2>
            <p style="color: var(--color-text-muted); line-height: 1.6; max-width: 440px;">
              This area is reserved strictly for PDaniel Olawande and ordained pastoral staff to review confidential petitions and shepherd the prayer community.
            </p>
            <div style="margin-top: 1.25rem;">
              <button class="btn btn-gold open-pastor-auth-modal-btn" style="display: inline-flex; align-items: center; gap: 6px;">
                ${Icons.get('lock', { size: 14, color: '#070B12' })}
                <span>Sign In with Pastoral Account</span>
              </button>
            </div>
          </div>
        </div>
      `;

      main.querySelector('.open-pastor-auth-modal-btn')?.addEventListener('click', () => {
        Modals.openAuthModal();
      });
      return;
    }

    // Render Admin Shell
    main.innerHTML = `
      <div class="container" style="padding-top: var(--space-xl);">
        <div class="section-header" style="margin-bottom: 1.5rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span class="pastor-badge">
                ${Icons.get('shieldCheck', { size: 13, color: 'var(--color-gold)' })}
                Verified Shepherd
              </span>
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-gold);">PDaniel Pastoral Altar</span>
            </div>
            <h1 style="font-size: 2.2rem;">Pastoral Care & Altar Oversight</h1>
            <p class="section-subtitle">
              Intercede for the flock with Holy Ghost fire, release prophetic prayers, and oversee the altar.
            </p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <a href="#/prayers" class="btn btn-outline btn-sm">View Public Wall</a>
          </div>
        </div>

        <!-- Real-Time Pastoral Statistics -->
        <div class="stats-strip" id="admin-stats-strip" style="margin-bottom: var(--space-xl);">
          <div class="skeleton" style="height: 80px;"></div>
        </div>

        <!-- Dashboard Layout -->
        <div class="dashboard-layout">
          <!-- Navigation Sidebar -->
          <aside class="dashboard-sidebar">
            <button class="sidebar-tab-btn ${this.activeQueue === 'awaiting' ? 'active' : ''}" data-queue="awaiting" style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${Icons.get('clock', { size: 16 })}
                <span>Awaiting Your Prayer</span>
              </div>
              <span class="sidebar-badge" id="badge-awaiting">0</span>
            </button>
            <button class="sidebar-tab-btn ${this.activeQueue === 'private' ? 'active' : ''}" data-queue="private" style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${Icons.get('lock', { size: 16 })}
                <span>Confidential Petitions</span>
              </div>
              <span class="sidebar-badge" id="badge-private">0</span>
            </button>
            <button class="sidebar-tab-btn ${this.activeQueue === 'prayed' ? 'active' : ''}" data-queue="prayed" style="display: flex; align-items: center; gap: 8px;">
              ${Icons.get('check', { size: 16 })}
              <span>Completed Intercessions</span>
            </button>
            <button class="sidebar-tab-btn ${this.activeQueue === 'members' ? 'active' : ''}" data-queue="members" style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${Icons.get('users', { size: 16 })}
                <span>Registered Intercessors</span>
              </div>
              <span class="sidebar-badge" id="badge-members" style="background: rgba(59, 130, 246, 0.2); color: #60A5FA;">0</span>
            </button>
            <button class="sidebar-tab-btn ${this.activeQueue === 'reports' ? 'active' : ''}" data-queue="reports" style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${Icons.get('shieldCheck', { size: 16 })}
                <span>Moderation & Reports</span>
              </div>
              <span class="sidebar-badge" id="badge-reports" style="background: rgba(239, 68, 68, 0.2); color: #F87171;">0</span>
            </button>
            <button class="sidebar-tab-btn ${this.activeQueue === 'settings' ? 'active' : ''}" data-queue="settings" style="display: flex; align-items: center; gap: 8px;">
              ${Icons.get('settings', { size: 16 })}
              <span>Ministry Settings</span>
            </button>
          </aside>

          <!-- Main Queue Content -->
          <div id="admin-queue-content">
            <div class="skeleton skeleton-card" style="height: 350px;"></div>
          </div>
        </div>
      </div>
    `;

    // Bind sidebar buttons
    main.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        main.querySelectorAll('.sidebar-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeQueue = btn.dataset.queue;
        this.loadQueueContent();
      });
    });

    await this.loadStats();
    await this.loadQueueContent();
  },

  async loadStats() {
    try {
      const res = await API.getAdminStats();
      this.stats = res.stats || {};

      const strip = document.getElementById('admin-stats-strip');
      if (strip) {
        strip.innerHTML = `
          <div class="stat-item" style="border-left: 4px solid var(--color-gold);">
            <div class="stat-number" style="color: var(--color-gold);">${this.stats.awaitingPastor || 0}</div>
            <div class="stat-label">Awaiting PDaniel's Prayer</div>
          </div>
          <div class="stat-item">
            <div class="stat-number" style="color: #FFFFFF;">${this.stats.prayedByPastor || 0}</div>
            <div class="stat-label">Prayed by PDaniel</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${this.stats.privateRequests || 0}</div>
            <div class="stat-label">Confidential Petitions</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${this.stats.totalIntercessions || 0}</div>
            <div class="stat-label">Total Community Prayers</div>
          </div>
        `;
      }

      const bAwaiting = document.getElementById('badge-awaiting');
      if (bAwaiting) bAwaiting.textContent = this.stats.awaitingPastor || 0;

      const bPrivate = document.getElementById('badge-private');
      if (bPrivate) bPrivate.textContent = this.stats.privateRequests || 0;

      const bReports = document.getElementById('badge-reports');
      if (bReports) bReports.textContent = this.stats.pendingReports || 0;

      const bMembers = document.getElementById('badge-members');
      if (bMembers) bMembers.textContent = this.stats.activeUsers || 0;

    } catch (err) {
      console.error('Stats error:', err);
    }
  },

  async loadQueueContent() {
    const container = document.getElementById('admin-queue-content');
    if (!container) return;

    if (this.activeQueue === 'members') {
      await this.renderMembers(container);
    } else if (this.activeQueue === 'reports') {
      await this.renderReports(container);
    } else if (this.activeQueue === 'settings') {
      await this.renderSettings(container);
    } else {
      await this.renderPrayerQueue(container);
    }
  },

  async renderPrayerQueue(container) {
    container.innerHTML = `<div class="skeleton skeleton-card"></div>`;
    try {
      const res = await API.getAdminPrayers({ queue: this.activeQueue });
      const prayers = res.prayers || [];

      if (prayers.length === 0) {
        container.innerHTML = `
          <div class="form-card text-center" style="padding: 3rem 1.5rem;">
            <div class="confirmation-icon-wrap" style="margin: 0 auto 1rem; width: 56px; height: 56px;">
              ${Icons.get('check', { size: 28, color: 'var(--color-gold)' })}
            </div>
            <h3 style="font-size: 1.3rem; color: #FFFFFF;">Queue Clear</h3>
            <p style="color: var(--color-text-muted); margin-top: 0.5rem;">
              No petitions currently in this queue.
            </p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div>
          <div style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 1rem;">
            Showing <strong>${prayers.length}</strong> petitions in this queue:
          </div>

          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${prayers.map(p => `
              <div class="admin-prayer-row" id="admin-p-${p.id}">
                <div class="admin-prayer-header">
                  <div class="prayer-meta">
                    <span class="badge badge-category" style="display: inline-flex; align-items: center; gap: 4px;">
                      ${p.category ? Icons.get(p.category.slug, { size: 12 }) : Icons.get('flame', { size: 12 })}
                      ${escapeHTML(p.category?.name || 'General')}
                    </span>
                    ${p.visibility === 'private' ? `<span class="badge badge-private" style="display: inline-flex; align-items: center; gap: 4px;">${Icons.get('lock', { size: 12 })} Confidential</span>` : ''}
                    ${p.has_pastor_prayed ? `<span class="pastor-badge" style="display: inline-flex; align-items: center; gap: 4px;">${Icons.get('shieldCheck', { size: 12, color: 'var(--color-gold)' })} Prayed</span>` : `<span class="badge" style="background:rgba(245, 158, 11, 0.2); color:#FBBF24; display: inline-flex; align-items: center; gap: 4px;">${Icons.get('clock', { size: 12 })} Awaiting PDaniel</span>`}
                    <span class="meta-dot">•</span>
                    <strong style="color: #FFFFFF;">${escapeHTML(p.author_name)}</strong>
                    ${p.author_email ? `<span style="font-size: 0.8rem; color: var(--color-text-light);">(${escapeHTML(p.author_email)})</span>` : ''}
                    <span class="meta-dot">•</span>
                    <span>${timeAgo(p.created_at)}</span>
                  </div>

                  <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-gold); display: inline-flex; align-items: center; gap: 4px;">
                    ${Icons.get('pray', { size: 14, color: 'var(--color-gold)' })} ${p.prayer_count} prayed
                  </span>
                </div>

                <h3 style="font-family: var(--font-heading); font-size: 1.18rem; font-weight: 700; color: #FFFFFF; margin-top: 0.25rem; letter-spacing: -0.01em;">
                  <a href="#/prayers/${p.id}">${escapeHTML(p.title)}</a>
                </h3>

                <p style="font-size: 0.95rem; color: var(--color-text-main); line-height: 1.6;">
                  ${escapeHTML(p.content)}
                </p>

                <!-- Existing Pastoral Prayer if already given -->
                ${p.pastor_response ? `
                  <div class="pastor-prayer-box" style="padding: 0.75rem 1rem;">
                    <div style="font-size: 0.8rem; font-weight: 700; color: var(--pastor-accent);">
                      Your Pastoral Prayer (${timeAgo(p.pastor_response.created_at)}):
                    </div>
                    ${p.pastor_response.response_text ? `
                      <div class="pastor-prayer-text" style="font-size: 0.92rem; margin-top: 0.25rem;">
                        "${escapeHTML(p.pastor_response.response_text)}"
                      </div>
                    ` : `
                      <div style="font-size: 0.85rem; color: var(--pastor-accent); font-weight: 600;">
                        Marked as "Prayed" only
                      </div>
                    `}
                  </div>
                ` : ''}

                <!-- Pastoral Action Buttons -->
                <div class="admin-prayer-actions">
                  <button 
                    class="btn btn-sm btn-gold admin-pray-respond-btn"
                    data-id="${p.id}"
                    data-title="${escapeHTML(p.title)}"
                    data-author="${escapeHTML(p.author_name)}"
                    style="display: inline-flex; align-items: center; gap: 5px;"
                  >
                    ${Icons.get('flame', { size: 14, color: '#070B12' })}
                    <span>${p.has_pastor_prayed ? 'Update Pastoral Prayer' : 'Pray & Respond'}</span>
                  </button>

                  <button 
                    class="btn btn-sm btn-outline admin-pray-quick-btn"
                    data-id="${p.id}"
                    title="Mark as Prayed without typing a message"
                    style="display: inline-flex; align-items: center; gap: 5px;"
                  >
                    ${Icons.get('check', { size: 14 })}
                    <span>Quick "Mark Prayed"</span>
                  </button>

                  <a href="#/prayers/${p.id}" class="btn btn-sm btn-ghost">
                    View Full
                  </a>

                  <!-- Moderation dropdown / buttons -->
                  <button class="btn btn-sm btn-ghost admin-mod-btn" data-id="${p.id}" data-action="hide" style="color: var(--color-text-muted); margin-left: auto;">
                    Hide
                  </button>
                  <button class="btn btn-sm btn-ghost admin-mod-btn" data-id="${p.id}" data-action="delete" style="color: var(--color-danger);">
                    Delete
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      // Bind Pray & Respond modal button
      container.querySelectorAll('.admin-pray-respond-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          Modals.openPastorPrayerModal(btn.dataset.id, btn.dataset.title, btn.dataset.author);
        });
      });

      // Bind Quick Mark Prayed
      container.querySelectorAll('.admin-pray-quick-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            const res = await API.submitPastorResponse(id, { prayed_only: true });
            Toast.show(res.message, 'success');
            await AdminView.loadStats();
            await AdminView.loadQueueContent();
          } catch (err) {
            Toast.show(err.message, 'error');
          }
        });
      });

      // Bind Moderation actions
      container.querySelectorAll('.admin-mod-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const action = btn.dataset.action;
          if (action === 'delete' && !confirm('Are you sure you want to permanently delete this prayer petition?')) {
            return;
          }
          try {
            const res = await API.moderatePrayer(id, action);
            Toast.show(res.message, 'info');
            await AdminView.loadStats();
            await AdminView.loadQueueContent();
          } catch (err) {
            Toast.show(err.message, 'error');
          }
        });
      });

    } catch (err) {
      container.innerHTML = `<p style="color: var(--color-danger);">${escapeHTML(err.message)}</p>`;
    }
  },

  async renderReports(container) {
    container.innerHTML = `<div class="skeleton skeleton-card"></div>`;
    try {
      const res = await API.getReports();
      const reports = res.reports || [];

      if (reports.length === 0) {
        container.innerHTML = `
          <div class="form-card text-center" style="padding: 3rem 1.5rem;">
            <div class="confirmation-icon-wrap" style="margin: 0 auto 1rem; width: 56px; height: 56px;">
              ${Icons.get('shieldCheck', { size: 28, color: 'var(--color-gold)' })}
            </div>
            <h3 style="font-size: 1.3rem; color: #FFFFFF;">No Moderation Reports</h3>
            <p style="color: var(--color-text-muted); margin-top: 0.5rem;">
              The prayer wall is clean. All reports have been resolved.
            </p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${reports.map(r => `
            <div class="comment-card" style="border-left: 4px solid var(--color-danger);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div>
                  <span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #F87171;">Reason: ${escapeHTML(r.reason)}</span>
                  <span class="badge" style="background: #1E293B; color: #94A3B8; margin-left: 0.35rem;">Status: ${escapeHTML(r.status)}</span>
                </div>
                <span style="font-size: 0.78rem; color: var(--color-text-muted);">${timeAgo(r.created_at)}</span>
              </div>

              ${r.prayer_title ? `
                <div style="margin-bottom: 0.5rem;">
                  <strong style="color: #FFFFFF;">Reported Prayer:</strong> <a href="#/prayers/${r.prayer_request_id}">${escapeHTML(r.prayer_title)}</a>
                  <p style="font-size: 0.88rem; color: var(--color-text-muted); margin-top: 2px;">"${escapeHTML(r.prayer_content?.substring(0, 140))}..."</p>
                </div>
              ` : ''}

              ${r.details ? `
                <div style="background: #0A0F1A; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem; margin-bottom: 0.75rem;">
                  <strong>Reporter notes:</strong> ${escapeHTML(r.details)}
                </div>
              ` : ''}

              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-sm btn-outline resolve-report-btn" data-id="${r.id}" data-status="resolved">
                  Mark Resolved
                </button>
                <button class="btn btn-sm btn-ghost resolve-report-btn" data-id="${r.id}" data-status="dismissed">
                  Dismiss
                </button>
                ${r.prayer_request_id ? `
                  <button class="btn btn-sm btn-ghost admin-mod-btn" data-id="${r.prayer_request_id}" data-action="hide" style="color: var(--color-danger); margin-left: auto;">
                    Hide Reported Petition
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      container.querySelectorAll('.resolve-report-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const status = btn.dataset.status;
          try {
            const res = await API.updateReport(id, status);
            Toast.show(res.message, 'success');
            await AdminView.loadStats();
            await AdminView.renderReports(container);
          } catch (err) {
            Toast.show(err.message, 'error');
          }
        });
      });

      container.querySelectorAll('.admin-mod-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const action = btn.dataset.action;
          try {
            const res = await API.moderatePrayer(id, action);
            Toast.show(res.message, 'info');
          } catch (err) {
            Toast.show(err.message, 'error');
          }
        });
      });

    } catch (err) {
      container.innerHTML = `<p style="color: var(--color-danger);">${escapeHTML(err.message)}</p>`;
    }
  },

  async renderSettings(container) {
    container.innerHTML = `<div class="skeleton skeleton-card"></div>`;
    try {
      const res = await API.getSettings();
      const settings = res.settings || {};

      container.innerHTML = `
        <div class="form-card">
          <h3 style="font-size: 1.3rem; margin-bottom: 1.25rem; color: #FFFFFF;">Ministry & Altar Configuration</h3>
          <form id="admin-settings-form">
            <div class="form-group">
              <label class="form-label" for="set-platform-name">Platform Title</label>
              <input type="text" id="set-platform-name" class="form-input" value="${escapeHTML(settings.platform_name || 'Flaming Prayer Wall')}" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="set-pastor-name">Lead Pastor / Revivalist Name</label>
              <input type="text" id="set-pastor-name" class="form-input" value="${escapeHTML(settings.pastor_name || 'PDaniel Olawande')}" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="set-church-name">Ministry / Fellowship</label>
              <input type="text" id="set-church-name" class="form-input" value="${escapeHTML(settings.church_name || 'Flaming Network / The Envoys')}">
            </div>

            <div class="form-group">
              <label class="form-label" for="set-scripture-verse">Altar Scripture (Verse Text)</label>
              <textarea id="set-scripture-verse" class="form-textarea" rows="3">${escapeHTML(settings.scripture_verse || 'The earnest prayer of a righteous person has great power and produces wonderful results.')}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label" for="set-scripture-ref">Scripture Reference</label>
              <input type="text" id="set-scripture-ref" class="form-input" value="${escapeHTML(settings.scripture_ref || 'James 5:16 (NLT)')}">
            </div>

            <div class="form-group">
              <label class="form-label" for="set-pagination">Prayer Wall Page Size</label>
              <input type="number" id="set-pagination" class="form-input" value="${escapeHTML(settings.pagination_size || '12')}" min="6" max="48">
            </div>

            <button type="submit" class="btn btn-gold btn-lg">
              Save Ministry Settings
            </button>
          </form>
        </div>
      `;

      container.querySelector('#admin-settings-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          platform_name: document.getElementById('set-platform-name').value,
          pastor_name: document.getElementById('set-pastor-name').value,
          church_name: document.getElementById('set-church-name').value,
          scripture_verse: document.getElementById('set-scripture-verse').value,
          scripture_ref: document.getElementById('set-scripture-ref').value,
          pagination_size: document.getElementById('set-pagination').value
        };

        try {
          const saveRes = await API.saveSettings(payload);
          Toast.show(saveRes.message, 'success');
        } catch (err) {
          Toast.show(err.message, 'error');
        }
      });
    } catch (err) {
      container.innerHTML = `<p style="color: var(--color-danger);">${escapeHTML(err.message)}</p>`;
    }
  },

  async renderMembers(container) {
    container.innerHTML = `<div class="skeleton skeleton-card" style="height: 350px;"></div>`;
    try {
      const res = await API.getAdminMembers({ search: this.memberSearch, role: this.memberRole });
      const members = res.members || [];
      const totalMembers = res.pagination?.total || members.length;

      const pastorsCount = members.filter(m => m.role === 'pastor').length;
      const moderatorsCount = members.filter(m => m.role === 'moderator').length;
      const intercessorsCount = members.filter(m => m.role === 'user').length;
      const totalPrayersLifted = members.reduce((sum, m) => sum + (m.prayers_lifted || 0), 0);

      container.innerHTML = `
        <div>
          <!-- Summary Metrics Cards -->
          <div class="admin-summary-grid">
            <div class="admin-summary-card" style="border-left: 3px solid var(--color-gold);">
              <div class="admin-summary-val" style="color: var(--color-gold);">${totalMembers}</div>
              <div class="admin-summary-label">Total Registered</div>
            </div>
            <div class="admin-summary-card" style="border-left: 3px solid #38BDF8;">
              <div class="admin-summary-val" style="color: #38BDF8;">${pastorsCount} Pastors • ${moderatorsCount} Mods</div>
              <div class="admin-summary-label">Altar Leadership</div>
            </div>
            <div class="admin-summary-card" style="border-left: 3px solid #34D399;">
              <div class="admin-summary-val" style="color: #34D399;">${intercessorsCount}</div>
              <div class="admin-summary-label">Active Intercessors</div>
            </div>
            <div class="admin-summary-card" style="border-left: 3px solid #A78BFA;">
              <div class="admin-summary-val" style="color: #A78BFA;">${totalPrayersLifted}</div>
              <div class="admin-summary-label">Community Prayers Lifted</div>
            </div>
          </div>

          <!-- Search and Filter Bar -->
          <div class="admin-filter-bar">
            <div class="admin-search-input-wrap">
              ${Icons.get('search', { size: 16, color: 'var(--color-text-muted)' })}
              <input 
                type="text" 
                id="admin-member-search" 
                placeholder="Search intercessor by name, email or bio..." 
                value="${escapeHTML(this.memberSearch)}"
              >
              ${this.memberSearch ? `
                <button type="button" id="clear-member-search" style="background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 2px;">
                  ${Icons.get('close', { size: 14 })}
                </button>
              ` : ''}
            </div>

            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <label for="admin-member-role-filter" style="font-size: 0.85rem; color: var(--color-text-muted); white-space: nowrap;">Filter Role:</label>
              <select id="admin-member-role-filter" class="form-select" style="padding: 0.45rem 0.85rem; font-size: 0.88rem; min-width: 150px;">
                <option value="all" ${this.memberRole === 'all' ? 'selected' : ''}>All Roles</option>
                <option value="user" ${this.memberRole === 'user' ? 'selected' : ''}>Intercessors</option>
                <option value="moderator" ${this.memberRole === 'moderator' ? 'selected' : ''}>Moderators</option>
                <option value="pastor" ${this.memberRole === 'pastor' ? 'selected' : ''}>Pastoral Staff</option>
              </select>
            </div>
          </div>

          <!-- Members Table -->
          ${members.length === 0 ? `
            <div class="form-card text-center" style="padding: 3rem 1.5rem;">
              <div class="confirmation-icon-wrap" style="margin: 0 auto 1rem; width: 56px; height: 56px;">
                ${Icons.get('users', { size: 28, color: 'var(--color-gold)' })}
              </div>
              <h3 style="font-size: 1.3rem; color: #FFFFFF;">No Members Found</h3>
              <p style="color: var(--color-text-muted); margin-top: 0.5rem;">
                No registered intercessors match your filter criteria.
              </p>
            </div>
          ` : `
            <div class="admin-members-table-wrap">
              <table class="admin-members-table">
                <thead>
                  <tr>
                    <th>Intercessor / Member</th>
                    <th>Spiritual Role</th>
                    <th>Petitions</th>
                    <th>Prayers Lifted</th>
                    <th>Joined</th>
                    <th style="text-align: right;">Manage Account</th>
                  </tr>
                </thead>
                <tbody>
                  ${members.map(m => {
                    const initials = (m.name || 'Member')
                      .split(' ')
                      .map(part => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    const isPastor = m.role === 'pastor';
                    const isModerator = m.role === 'moderator';
                    const currentUserId = State.user?.id;
                    const isSelf = m.id === currentUserId || (isPastor && State.user?.role === 'pastor' && m.email === State.user?.email);

                    return `
                      <tr id="member-row-${m.id}">
                        <td>
                          <div style="display: flex; align-items: center; gap: 0.75rem;">
                            ${m.avatar ? `
                              <img src="${escapeHTML(m.avatar)}" alt="${escapeHTML(m.name)}" class="admin-member-avatar" style="border: 2px solid ${isPastor ? 'var(--color-gold)' : isModerator ? '#38BDF8' : 'rgba(255, 255, 255, 0.15)'};">
                            ` : `
                              <div class="admin-member-avatar" style="background: ${isPastor ? 'linear-gradient(135deg, #F59E0B, #D97706)' : isModerator ? 'linear-gradient(135deg, #0284C7, #0369A1)' : 'linear-gradient(135deg, #1E293B, #0F172A)'}; color: ${isPastor ? '#070B12' : '#FFFFFF'}; border: 1px solid rgba(255, 255, 255, 0.1);">
                                ${initials}
                              </div>
                            `}
                            <div>
                              <div style="font-weight: 700; color: #FFFFFF; display: flex; align-items: center; gap: 6px;">
                                <span>${escapeHTML(m.name)}</span>
                                ${isSelf ? `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: var(--color-gold); font-size: 0.7rem; padding: 1px 6px;">You</span>` : ''}
                              </div>
                              <div style="font-size: 0.8rem; color: var(--color-text-muted); font-family: monospace;">
                                ${escapeHTML(m.email)}
                              </div>
                              ${m.bio ? `
                                <div style="font-size: 0.78rem; color: var(--color-text-light); max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">
                                  ${escapeHTML(m.bio)}
                                </div>
                              ` : ''}
                            </div>
                          </div>
                        </td>

                        <td>
                          ${isPastor ? `
                            <span class="role-badge-pastor">
                              ${Icons.get('shieldCheck', { size: 13, color: '#FBBF24' })}
                              Verified Shepherd
                            </span>
                          ` : isModerator ? `
                            <span class="role-badge-moderator">
                              ${Icons.get('shieldCheck', { size: 13, color: '#60A5FA' })}
                              Moderator
                            </span>
                          ` : `
                            <span class="role-badge-user">
                              ${Icons.get('pray', { size: 13, color: '#34D399' })}
                              Intercessor
                            </span>
                          `}
                        </td>

                        <td>
                          <span class="member-stats-chip">
                            ${Icons.get('flame', { size: 13, color: 'var(--color-gold)' })}
                            <strong>${m.petitions_count || 0}</strong>
                          </span>
                        </td>

                        <td>
                          <span class="member-stats-chip" style="color: #60A5FA;">
                            ${Icons.get('pray', { size: 13, color: '#60A5FA' })}
                            <strong>${m.prayers_lifted || 0}</strong>
                          </span>
                        </td>

                        <td style="font-size: 0.82rem; color: var(--color-text-muted); white-space: nowrap;">
                          ${timeAgo(m.created_at)}
                        </td>

                        <td>
                          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.4rem;">
                            <!-- Role Selector -->
                            <select 
                              class="form-select admin-role-change-select" 
                              data-id="${m.id}" 
                              data-name="${escapeHTML(m.name)}" 
                              data-prev="${m.role}"
                              ${isSelf && isPastor ? 'disabled title="You cannot demote yourself from Pastoral status"' : ''}
                              style="padding: 0.35rem 0.6rem; font-size: 0.8rem; height: 32px; width: 110px;"
                            >
                              <option value="user" ${m.role === 'user' ? 'selected' : ''}>Intercessor</option>
                              <option value="moderator" ${m.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                              <option value="pastor" ${m.role === 'pastor' ? 'selected' : ''}>Pastor</option>
                            </select>

                            <!-- Password Reset -->
                            <button 
                              type="button" 
                              class="btn btn-sm btn-outline admin-reset-pwd-btn" 
                              data-id="${m.id}" 
                              data-name="${escapeHTML(m.name)}" 
                              title="Set or reset password for ${escapeHTML(m.name)}"
                              style="padding: 0.35rem 0.6rem; height: 32px; display: inline-flex; align-items: center; gap: 4px;"
                            >
                              ${Icons.get('key', { size: 13 })}
                              <span style="font-size: 0.78rem;">Reset</span>
                            </button>

                            <!-- Delete / Remove Button -->
                            <button 
                              type="button" 
                              class="btn btn-sm btn-ghost admin-del-member-btn" 
                              data-id="${m.id}" 
                              data-name="${escapeHTML(m.name)}" 
                              title="${isSelf ? 'Cannot delete your own active account' : 'Remove account from altar'}"
                              ${isSelf || m.id === 1 ? 'disabled style="opacity: 0.25; cursor: not-allowed; padding: 0.35rem 0.5rem; height: 32px;"' : 'style="color: var(--color-danger); padding: 0.35rem 0.5rem; height: 32px;"'}
                            >
                              ${Icons.get('trash', { size: 14, color: isSelf || m.id === 1 ? 'var(--color-text-muted)' : 'var(--color-danger)' })}
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;

      // Bind search input with debouncing
      const searchInput = container.querySelector('#admin-member-search');
      let searchTimeout;
      searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
          this.memberSearch = e.target.value.trim();
          await this.renderMembers(container);
        }, 300);
      });

      // Bind clear search
      container.querySelector('#clear-member-search')?.addEventListener('click', async () => {
        this.memberSearch = '';
        await this.renderMembers(container);
      });

      // Bind role filter
      container.querySelector('#admin-member-role-filter')?.addEventListener('change', async (e) => {
        this.memberRole = e.target.value;
        await this.renderMembers(container);
      });

      // Bind role change select
      container.querySelectorAll('.admin-role-change-select').forEach(sel => {
        sel.addEventListener('change', async () => {
          const id = sel.dataset.id;
          const name = sel.dataset.name;
          const newRole = sel.value;
          const prevRole = sel.dataset.prev;

          if (confirm(`Change spiritual role for "${name}" from ${prevRole.toUpperCase()} to ${newRole.toUpperCase()}?`)) {
            try {
              const res = await API.updateMemberRole(id, newRole);
              Toast.show(res.message, 'success');
              await this.renderMembers(container);
            } catch (err) {
              Toast.show(err.message, 'error');
              sel.value = prevRole; // revert
            }
          } else {
            sel.value = prevRole; // revert
          }
        });
      });

      // Bind Reset Password
      container.querySelectorAll('.admin-reset-pwd-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const name = btn.dataset.name;
          Modals.openResetPasswordModal(id, name);
        });
      });

      // Bind Delete Member
      container.querySelectorAll('.admin-del-member-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const name = btn.dataset.name;
          if (confirm(`Are you sure you want to permanently remove "${name}" from the prayer platform? This cannot be undone.`)) {
            try {
              const res = await API.deleteMember(id);
              Toast.show(res.message, 'info');
              await this.loadStats();
              await this.renderMembers(container);
            } catch (err) {
              Toast.show(err.message, 'error');
            }
          }
        });
      });

    } catch (err) {
      container.innerHTML = `<p style="color: var(--color-danger);">${escapeHTML(err.message)}</p>`;
    }
  }
};
