/**
 * Modal Dialogs Manager - Flaming Prayer Wall
 */
const Modals = {
  activeModal: null,

  closeAll() {
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
      overlay.classList.remove('active');
    });
    this.activeModal = null;
  },

  open(overlayId) {
    this.closeAll();
    const overlay = document.getElementById(overlayId);
    if (overlay) {
      overlay.classList.add('active');
      this.activeModal = overlayId;
      const focusable = overlay.querySelector('input, textarea, button:not(.modal-close-btn)');
      if (focusable) focusable.focus();
    }
  },

  // 1. Auth Modal
  openAuthModal(defaultTab = 'login') {
    let overlay = document.getElementById('auth-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'auth-modal-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <div class="modal-header">
          <h3 class="modal-title" id="auth-modal-title">Sign In to Flaming Prayer Wall</h3>
          <button class="modal-close-btn" aria-label="Close modal">
            ${Icons.get('close', { size: 18 })}
          </button>
        </div>

        <div class="modal-body">
          <!-- Tabs -->
          <div style="display: flex; border-bottom: 1px solid var(--color-border); margin-bottom: 1.25rem;">
            <button id="tab-login" class="btn btn-ghost btn-sm" style="flex: 1; border-bottom: 2px solid var(--color-gold); font-weight: 700; color: #FFFFFF;">
              Sign In
            </button>
            <button id="tab-register" class="btn btn-ghost btn-sm" style="flex: 1; font-weight: 600;">
              Create Account
            </button>
          </div>

          <!-- Login Form -->
          <form id="login-form">
            <div class="form-group">
              <label class="form-label" for="login-email">Email Address</label>
              <input type="email" id="login-email" class="form-input" required autocomplete="email" placeholder="e.g. pastor@flamingprayerwall.org">
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input type="password" id="login-password" class="form-input" required autocomplete="current-password" placeholder="••••••••">
            </div>
            <button type="submit" class="btn btn-gold" style="width: 100%; margin-top: 0.5rem;">
              Sign In to Altar
            </button>
          </form>

          <!-- Register Form -->
          <form id="register-form" style="display: none;">
            <div class="form-group">
              <label class="form-label" for="reg-name">Full Name</label>
              <input type="text" id="reg-name" class="form-input" required placeholder="Sister Mary / Brother John">
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-email">Email Address</label>
              <input type="email" id="reg-email" class="form-input" required autocomplete="email" placeholder="name@example.com">
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-password">Create Password</label>
              <input type="password" id="reg-password" class="form-input" minlength="6" required autocomplete="new-password" placeholder="At least 6 characters">
            </div>
            <button type="submit" class="btn btn-gold" style="width: 100%; margin-top: 0.5rem;">
              Create Free Account
            </button>
          </form>
        </div>
      </div>
    `;

    // Tab toggle
    const tabLogin = overlay.querySelector('#tab-login');
    const tabRegister = overlay.querySelector('#tab-register');
    const loginForm = overlay.querySelector('#login-form');
    const regForm = overlay.querySelector('#register-form');

    tabLogin.addEventListener('click', () => {
      tabLogin.style.borderBottom = '2px solid var(--color-gold)';
      tabLogin.style.color = '#FFFFFF';
      tabRegister.style.borderBottom = 'none';
      tabRegister.style.color = 'var(--color-text-muted)';
      loginForm.style.display = 'block';
      regForm.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.style.borderBottom = '2px solid var(--color-gold)';
      tabRegister.style.color = '#FFFFFF';
      tabLogin.style.borderBottom = 'none';
      tabLogin.style.color = 'var(--color-text-muted)';
      loginForm.style.display = 'none';
      regForm.style.display = 'block';
    });

    // Close button
    overlay.querySelector('.modal-close-btn').addEventListener('click', () => this.closeAll());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeAll();
    });

    // Handle Login Submit
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = overlay.querySelector('#login-email').value;
      const password = overlay.querySelector('#login-password').value;
      try {
        const res = await API.login({ email, password });
        State.setCurrentUser(res.user, res.token);
        Toast.show('Welcome back, ' + res.user.name, 'success');
        this.closeAll();
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    });

    // Handle Register Submit
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = overlay.querySelector('#reg-name').value;
      const email = overlay.querySelector('#reg-email').value;
      const password = overlay.querySelector('#reg-password').value;
      try {
        const res = await API.register({ name, email, password });
        State.setCurrentUser(res.user, res.token);
        Toast.show('Welcome to the altar, ' + res.user.name, 'success');
        this.closeAll();
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    });

    this.open('auth-modal-overlay');
  },

  // 2. Pastor Prayer & Response Modal
  openPastorPrayerModal(prayerId, title, author) {
    let overlay = document.getElementById('pastor-prayer-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pastor-prayer-modal-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="pastor-modal-title">
        <div class="modal-header" style="background: var(--pastor-bg); border-bottom: 1px solid var(--pastor-border);">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="pastor-badge" style="display: inline-flex; align-items: center; gap: 5px;">
              ${Icons.get('shieldCheck', { size: 13, color: 'var(--color-gold)' })}
              PDaniel Olawande
            </span>
            <h3 class="modal-title" id="pastor-modal-title" style="font-size: 1.15rem; color: #FFFFFF;">Pastoral Intercession</h3>
          </div>
          <button class="modal-close-btn" aria-label="Close modal">
            ${Icons.get('close', { size: 18 })}
          </button>
        </div>

        <form id="pastor-response-form">
          <div class="modal-body">
            <p style="font-size: 0.88rem; color: var(--color-text-muted); margin-bottom: 0.75rem;">
              Interceding for: <strong style="color: #FFFFFF;">${escapeHTML(author)}</strong>
            </p>
            <div style="background: #0A0F1A; padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); font-size: 0.92rem; font-weight: 600; color: #FFFFFF; margin-bottom: 1.25rem;">
              "${escapeHTML(title)}"
            </div>

            <!-- Choice: Prayed Only or Written Response -->
            <div class="form-group">
              <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                <input type="checkbox" id="pastor-prayed-only-check" style="width: 18px; height: 18px; accent-color: var(--color-gold);">
                <span>Mark as "Prayed" only (without writing a response message)</span>
              </label>
              <span class="form-hint">
                Will display: "PDaniel Olawande has stood in prayer over this petition" with verified shepherd badge on the prayer card.
              </span>
            </div>

            <div class="form-group" id="pastor-textarea-group">
              <label class="form-label" for="pastor-response-text">Pastoral Prayer / Words of Prophetic Agreement</label>
              <textarea 
                id="pastor-response-text" 
                class="form-textarea" 
                placeholder="Father in the name of Jesus, we bring this petition before the altar of fire. We release healing, total deliverance, supernatural breakthrough, and peace in Jesus' mighty name..."
                rows="5"
              ></textarea>
              <span class="form-hint">Your prayer will be featured prominently with your verified shepherd badge.</span>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-gold" style="display: inline-flex; align-items: center; gap: 6px;">
              ${Icons.get('flame', { size: 15, color: '#070B12' })}
              <span>Release Pastoral Prayer</span>
            </button>
          </div>
        </form>
      </div>
    `;

    const check = overlay.querySelector('#pastor-prayed-only-check');
    const textareaGroup = overlay.querySelector('#pastor-textarea-group');
    const textarea = overlay.querySelector('#pastor-response-text');

    check.addEventListener('change', () => {
      textareaGroup.style.display = check.checked ? 'none' : 'block';
    });

    overlay.querySelector('.modal-close-btn').addEventListener('click', () => this.closeAll());
    overlay.querySelector('.cancel-btn').addEventListener('click', () => this.closeAll());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeAll();
    });

    overlay.querySelector('#pastor-response-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const prayedOnly = check.checked;
      const responseText = prayedOnly ? null : textarea.value.trim();

      try {
        const res = await API.submitPastorResponse(prayerId, {
          prayed_only: prayedOnly,
          response_text: responseText
        });
        Toast.show(res.message, 'success');
        this.closeAll();
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } catch (err) {
        Toast.show('Error: ' + err.message, 'error');
      }
    });

    this.open('pastor-prayer-modal-overlay');
  },

  // 3. Share Modal
  openShareModal(prayerId, title) {
    let overlay = document.getElementById('share-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'share-modal-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    const shareUrl = `${window.location.origin}/#/prayers/${prayerId}`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(`Please stand with us in prayer on the Flaming Prayer Wall: "${title}"`);

    overlay.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
        <div class="modal-header">
          <h3 class="modal-title" id="share-modal-title">Share Prayer Petition</h3>
          <button class="modal-close-btn" aria-label="Close modal">
            ${Icons.get('close', { size: 18 })}
          </button>
        </div>

        <div class="modal-body">
          <p style="font-size: 0.92rem; color: var(--color-text-muted); margin-bottom: 1.25rem;">
            Invite believers to join their faith with this petition:
          </p>

          <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
            <input type="text" class="form-input" id="share-link-input" value="${shareUrl}" readonly>
            <button class="btn btn-gold" id="copy-share-btn">Copy</button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
            <a href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="justify-content: flex-start; gap: 8px;">
              ${Icons.get('whatsapp', { size: 16, color: '#22C55E' })}
              <span>WhatsApp</span>
            </a>
            <a href="https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="justify-content: flex-start; gap: 8px;">
              ${Icons.get('telegram', { size: 16, color: '#38BDF8' })}
              <span>Telegram</span>
            </a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="justify-content: flex-start; gap: 8px;">
              ${Icons.get('facebook', { size: 16, color: '#60A5FA' })}
              <span>Facebook</span>
            </a>
            <a href="https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="justify-content: flex-start; gap: 8px;">
              ${Icons.get('xTwitter', { size: 16, color: '#FFFFFF' })}
              <span>X / Twitter</span>
            </a>
          </div>

          ${navigator.share ? `
            <button class="btn btn-ghost" id="native-share-btn" style="width: 100%; margin-top: 1rem; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
              ${Icons.get('share', { size: 16 })}
              <span>Device Share</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;

    overlay.querySelector('.modal-close-btn').addEventListener('click', () => this.closeAll());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeAll();
    });

    const copyBtn = overlay.querySelector('#copy-share-btn');
    copyBtn.addEventListener('click', () => {
      const input = overlay.querySelector('#share-link-input');
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy', 2000);
        Toast.show('Prayer link copied to clipboard.', 'success');
      });
    });

    const nativeBtn = overlay.querySelector('#native-share-btn');
    if (nativeBtn) {
      nativeBtn.addEventListener('click', () => {
        navigator.share({
          title: `Flaming Prayer Wall`,
          text: title,
          url: shareUrl
        }).catch(() => {});
      });
    }

    this.open('share-modal-overlay');
  },

  // 4. Moderation / Report Modal
  openReportModal(prayerId, commentId = null) {
    let overlay = document.getElementById('report-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'report-modal-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        <div class="modal-header">
          <h3 class="modal-title" id="report-modal-title">Report Content for Pastoral Review</h3>
          <button class="modal-close-btn" aria-label="Close modal">
            ${Icons.get('close', { size: 18 })}
          </button>
        </div>

        <form id="report-form">
          <div class="modal-body">
            <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 1rem;">
              Our pastoral team strives to keep this altar sacred and reverent. Please select a reason:
            </p>

            <div class="form-group">
              <label class="form-label" for="report-reason">Reason</label>
              <select id="report-reason" class="form-select" required>
                <option value="spam">Spam or commercial promotion</option>
                <option value="inappropriate">Inappropriate or irreverent language</option>
                <option value="scam">Financial solicitation or scam</option>
                <option value="harassment">Harassment or abusive content</option>
                <option value="other">Other concern</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="report-details">Additional details (optional)</label>
              <textarea id="report-details" class="form-textarea" placeholder="Help us understand the issue..." rows="3"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" style="background-color: var(--color-danger); border-color: var(--color-danger);">Submit Report</button>
          </div>
        </form>
      </div>
    `;

    overlay.querySelector('.modal-close-btn').addEventListener('click', () => this.closeAll());
    overlay.querySelector('.cancel-btn').addEventListener('click', () => this.closeAll());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeAll();
    });

    overlay.querySelector('#report-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const reason = overlay.querySelector('#report-reason').value;
      const details = overlay.querySelector('#report-details').value;

      try {
        const res = await API.reportPrayer(prayerId, {
          reason,
          details,
          comment_id: commentId
        });
        Toast.show(res.message, 'success');
        this.closeAll();
      } catch (err) {
        Toast.show('Error: ' + err.message, 'error');
      }
    });

    this.open('report-modal-overlay');
  }
};

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && Modals.activeModal) {
    Modals.closeAll();
  }
});
