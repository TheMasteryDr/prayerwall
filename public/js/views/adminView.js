/**
 * Pastor & Administrator Command Center View - Flaming Prayer Wall
 */
const AdminView = {
  activeQueue: 'awaiting', // 'awaiting', 'private', 'prayed', 'reports', 'settings'
  stats: {},
  prayers: [],

  async render() {
    const main = document.getElementById('main-content');
    if (!main) return;

    if (!State.isPastor()) {
      main.innerHTML = `
        <div class="container" style="padding-top: var(--space-3xl); max-width: 600px;">
          <div class="confirmation-card">
            <div class="confirmation-icon-wrap" style="color: var(--color-danger); border-color: rgba(239, 68, 68, 0.4);">🔒</div>
            <h2 style="font-family: var(--font-serif); font-size: 1.8rem; color: #FFFFFF;">
              Pastoral & Altar Access Restricted
            </h2>
            <p style="color: var(--color-text-muted); line-height: 1.6; max-width: 440px;">
              This area is reserved strictly for PDaniel Olawande and ordained pastoral staff to review confidential petitions and shepherd the prayer community.
            </p>
            <div style="margin-top: 1.25rem;">
              <button class="btn btn-gold quick-pastor-login-btn">
                🔥 Sign in as PDaniel Olawande
              </button>
            </div>
          </div>
        </div>
      `;

      main.querySelector('.quick-pastor-login-btn')?.addEventListener('click', async () => {
        try {
          const res = await API.demoLogin('pastor');
          State.setCurrentUser(res.user, res.token);
          Toast.show('Welcome, PDaniel Olawande', 'success');
          AdminView.render();
        } catch (err) {
          Toast.show(err.message, 'error');
        }
      });
      return;
    }

    // Render Admin Shell
    main.innerHTML = `
      <div class="container" style="padding-top: var(--space-xl);">
        <div class="section-header" style="margin-bottom: 1.5rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span class="pastor-badge">✓ Verified Shepherd</span>
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
            <button class="sidebar-tab-btn ${this.activeQueue === 'awaiting' ? 'active' : ''}" data-queue="awaiting">
              <span>⏳ Awaiting Your Prayer</span>
              <span class="sidebar-badge" id="badge-awaiting">0</span>
            </button>
            <button class="sidebar-tab-btn ${this.activeQueue === 'private' ? 'active' : ''}" data-queue="private">
              <span>🔒 Confidential Petitions</span>
              <span class="sidebar-badge" id="badge-private">0</span>
            </button>
            <button class="sidebar-tab-btn ${this.activeQueue === 'prayed' ? 'active' : ''}" data-queue="prayed">
              <span>✓ Completed Intercessions</span>
            </button>
            <button class="sidebar-tab-btn ${this.activeQueue === 'reports' ? 'active' : ''}" data-queue="reports">
              <span>🛡️ Moderation & Reports</span>
              <span class="sidebar-badge" id="badge-reports" style="background: rgba(239, 68, 68, 0.2); color: #F87171;">0</span>
            </button>
            <button class="sidebar-tab-btn ${this.activeQueue === 'settings' ? 'active' : ''}" data-queue="settings">
              <span>⚙️ Ministry Settings</span>
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

    } catch (err) {
      console.error('Stats error:', err);
    }
  },

  async loadQueueContent() {
    const container = document.getElementById('admin-queue-content');
    if (!container) return;

    if (this.activeQueue === 'reports') {
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
            <div class="confirmation-icon-wrap" style="margin: 0 auto 1rem; width: 56px; height: 56px; font-size: 1.5rem;">✓</div>
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
                    <span class="badge badge-category">${escapeHTML(p.category?.name || 'General')}</span>
                    ${p.visibility === 'private' ? '<span class="badge badge-private">🔒 Confidential</span>' : ''}
                    ${p.has_pastor_prayed ? '<span class="pastor-badge">✓ Prayed</span>' : '<span class="badge" style="background:rgba(245, 158, 11, 0.2); color:#FBBF24;">⏳ Awaiting PDaniel</span>'}
                    <span class="meta-dot">•</span>
                    <strong style="color: #FFFFFF;">${escapeHTML(p.author_name)}</strong>
                    ${p.author_email ? `<span style="font-size: 0.8rem; color: var(--color-text-light);">(${escapeHTML(p.author_email)})</span>` : ''}
                    <span class="meta-dot">•</span>
                    <span>${timeAgo(p.created_at)}</span>
                  </div>

                  <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-gold);">
                    🙏 ${p.prayer_count} prayed
                  </span>
                </div>

                <h3 style="font-family: var(--font-serif); font-size: 1.18rem; color: #FFFFFF; margin-top: 0.25rem;">
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
                  >
                    🔥 ${p.has_pastor_prayed ? 'Update Pastoral Prayer' : 'Pray & Respond'}
                  </button>

                  <button 
                    class="btn btn-sm btn-outline admin-pray-quick-btn"
                    data-id="${p.id}"
                    title="Mark as Prayed without typing a message"
                  >
                    ✓ Quick "Mark Prayed"
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
            <div class="confirmation-icon-wrap" style="margin: 0 auto 1rem; width: 56px; height: 56px; font-size: 1.5rem;">🛡️</div>
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
  }
};
