/**
 * Prayer Submission View - Prayer Wall
 */
const SubmitView = {
  categories: [],

  async render() {
    const main = document.getElementById('main-content');
    if (!main) return;

    main.innerHTML = `
      <div class="container" style="padding-top: var(--space-2xl); max-width: 760px;">
        <div class="text-center" style="margin-bottom: 2rem;">
          <span class="hero-subtitle-pill" style="font-size: 0.75rem;">
            ${Icons.get('flame', { size: 13, color: 'var(--color-gold)' })}
            <span>Holy Ghost Altar of Intercession</span>
          </span>
          <h1 style="font-size: 2.25rem; margin-top: 0.5rem;">Lay Your Petition on the Altar</h1>
          <p class="section-subtitle">
            "The fire shall ever be burning upon the altar; it shall never go out." — Leviticus 6:13
          </p>
        </div>

        <div class="form-card" id="submit-form-container">
          <form id="prayer-submission-form">
            <!-- Title -->
            <div class="form-group">
              <label class="form-label" for="prayer-title">
                Prayer Request Title <span style="color: var(--color-gold);">*</span>
              </label>
              <input 
                type="text" 
                id="prayer-title" 
                class="form-input" 
                placeholder="e.g. Divine breakthrough, financial release, and peace in our home" 
                minlength="5" 
                required 
              />
              <span class="form-hint">A brief, focused summary of your petition.</span>
            </div>

            <!-- Category -->
            <div class="form-group">
              <label class="form-label" for="prayer-category">
                Category <span style="color: var(--color-gold);">*</span>
              </label>
              <select id="prayer-category" class="form-select" required>
                <option value="" disabled selected>Select category of prayer...</option>
              </select>
            </div>

            <!-- Prayer Content -->
            <div class="form-group">
              <label class="form-label" for="prayer-content">
                Prayer Petition Details <span style="color: var(--color-gold);">*</span>
              </label>
              <textarea 
                id="prayer-content" 
                class="form-textarea" 
                placeholder="Pour out what is on your heart before God. Share the circumstances you are believing the Lord to turn around..." 
                minlength="10" 
                rows="6"
                required
              ></textarea>
              <span class="form-hint">Intercessors and PDaniel Olawande will read this to pray with understanding and prophetic burden.</span>
            </div>

            <!-- Author & Anonymity -->
            <div class="form-group">
              <label class="form-label">How should your name appear?</label>
              <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.25rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.95rem; color: #FFFFFF;">
                  <input type="radio" name="name-display" id="name-public" value="named" checked style="accent-color: var(--color-gold);">
                  <span>Display my name:</span>
                </label>
                <input 
                  type="text" 
                  id="author-name-input" 
                  class="form-input" 
                  style="max-width: 240px; padding: 0.4rem 0.75rem;" 
                  value="${escapeHTML(State.currentUser?.name || '')}" 
                  placeholder="Your Name (e.g. Sister Mary)"
                />
              </div>
              <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.95rem; margin-top: 0.5rem; color: var(--color-text-muted);">
                <input type="radio" name="name-display" id="name-anon" value="anon" style="accent-color: var(--color-gold);">
                <span>Submit anonymously (Displays as "Anonymous")</span>
              </label>
            </div>

            <!-- Privacy Setting -->
            <div class="form-group">
              <label class="form-label">Altar Visibility</label>
              <div class="privacy-options-grid">
                <label class="privacy-card selected" for="privacy-public">
                  <input type="radio" name="visibility" id="privacy-public" value="public" checked>
                  <div>
                    <strong style="display: flex; align-items: center; gap: 6px; font-size: 0.95rem; color: #FFFFFF;">
                      ${Icons.get('globe', { size: 15, color: 'var(--color-gold)' })} Public Prayer Wall
                    </strong>
                    <span style="font-size: 0.82rem; color: var(--color-text-muted);">
                      Shown on the prayer wall for believers worldwide and PDaniel Olawande to pray.
                    </span>
                  </div>
                </label>

                <label class="privacy-card" for="privacy-private">
                  <input type="radio" name="visibility" id="privacy-private" value="private">
                  <div>
                    <strong style="display: flex; align-items: center; gap: 6px; font-size: 0.95rem; color: #F87171;">
                      ${Icons.get('lock', { size: 15, color: '#F87171' })} Confidential to PDaniel
                    </strong>
                    <span style="font-size: 0.82rem; color: var(--color-text-muted);">
                      Kept strictly private. Only you and PDaniel Olawande can view this petition.
                    </span>
                  </div>
                </label>

                <label class="privacy-card" for="privacy-unlisted">
                  <input type="radio" name="visibility" id="privacy-unlisted" value="unlisted">
                  <div>
                    <strong style="display: flex; align-items: center; gap: 6px; font-size: 0.95rem; color: #FFFFFF;">
                      ${Icons.get('link', { size: 15, color: '#94A3B8' })} Unlisted Link
                    </strong>
                    <span style="font-size: 0.82rem; color: var(--color-text-muted);">
                      Not listed on the public wall; only people you share the direct link with can view.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Anti-spam Honeypot -->
            <div style="display: none;" aria-hidden="true">
              <input type="text" name="website_url_check" id="honeypot-input" tabindex="-1" autocomplete="off">
            </div>

            <!-- Altar Guarantee Note -->
            <div style="background-color: #0A0F1A; border-left: 3px solid var(--color-gold); padding: 0.85rem 1rem; border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 8px;">
              ${Icons.get('shieldCheck', { size: 16, color: 'var(--color-gold)' })}
              <div><strong>Altar Consecration:</strong> We treat all petitions with spiritual sanctity and strict confidentiality. Private requests are protected by server-side authorization.</div>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="btn btn-gold btn-lg" id="submit-prayer-btn" style="width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
              ${Icons.get('flame', { size: 18, color: '#070B12' })}
              <span>Lay Petition Upon the Altar</span>
            </button>
          </form>
        </div>
      </div>
    `;

    // Load categories into select dropdown
    try {
      const res = await API.getCategories();
      this.categories = res.categories || [];
      const select = document.getElementById('prayer-category');
      if (select) {
        select.innerHTML = '<option value="" disabled selected>Select category of prayer...</option>' +
          this.categories.map(c => `
            <option value="${c.id}">${escapeHTML(c.name)}</option>
          `).join('');
      }
    } catch (err) {
      console.error('Failed to load categories into submit form:', err);
    }

    // Bind privacy card styles
    main.querySelectorAll('input[name="visibility"]').forEach(radio => {
      radio.addEventListener('change', () => {
        main.querySelectorAll('.privacy-card').forEach(c => c.classList.remove('selected'));
        radio.closest('.privacy-card')?.classList.add('selected');
      });
    });

    // Handle Submission
    const form = document.getElementById('prayer-submission-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-prayer-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳</span> Placing on the altar...';

        const title = document.getElementById('prayer-title').value.trim();
        const category_id = document.getElementById('prayer-category').value;
        const content = document.getElementById('prayer-content').value.trim();
        const isAnon = document.getElementById('name-anon').checked;
        const authorName = document.getElementById('author-name-input').value.trim();
        const visibility = main.querySelector('input[name="visibility"]:checked')?.value || 'public';
        const honeypot = document.getElementById('honeypot-input').value;

        try {
          const res = await API.submitPrayer({
            title,
            category_id,
            content,
            is_anonymous: isAnon,
            author_name: authorName,
            visibility,
            website_url_check: honeypot
          });

          SubmitView.renderConfirmation(res.prayerId, visibility);
        } catch (err) {
          Toast.show(err.message, 'error');
          submitBtn.disabled = false;
          submitBtn.innerHTML = `
            ${Icons.get('flame', { size: 18, color: '#070B12' })}
            <span>Lay Petition Upon the Altar</span>
          `;
        }
      });
    }
  },

  renderConfirmation(prayerId, visibility) {
    const main = document.getElementById('main-content');
    if (!main) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    main.innerHTML = `
      <div class="container" style="padding-top: var(--space-2xl); max-width: 680px;">
        <div class="confirmation-card">
          <div class="confirmation-icon-wrap">
            ${Icons.get('flame', { size: 36, color: 'var(--color-gold)' })}
          </div>

          <h2 style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 700; color: #FFFFFF; letter-spacing: -0.015em;">
            Your Petition Has Been Placed on the Altar.
          </h2>

          <p style="font-size: 1.15rem; color: var(--color-gold); font-weight: 700;">
            "You are not praying alone."
          </p>

          <p style="color: var(--color-text-muted); line-height: 1.65; max-width: 520px;">
            ${visibility === 'private'
              ? 'Your private petition is in PDaniel Olawande’s pastoral prayer queue. He will intercede over your request in the Spirit.'
              : 'Your petition is now live on the Prayer Wall. Believers across the fellowship are now standing in agreement with you.'}
          </p>

          <div style="background-color: var(--pastor-bg); border: 1px solid var(--pastor-border); border-radius: var(--radius-md); padding: 1rem; width: 100%; margin-top: 0.5rem;">
            <p style="font-family: var(--font-heading); font-size: 0.95rem; color: #FFFFFF; letter-spacing: -0.01em;">
              "Again, truly I tell you that if two of you on earth agree about anything they ask for, it will be done for them by my Father in heaven." — Matthew 18:19
            </p>
          </div>

          <div style="display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap; justify-content: center; width: 100%;">
            <a href="#/prayers/${prayerId}" class="btn btn-gold btn-lg" style="flex: 1; min-width: 200px;">
              View My Petition
            </a>
            <a href="#/prayers" class="btn btn-outline btn-lg" style="flex: 1; min-width: 200px;">
              Pray for Others
            </a>
          </div>
        </div>
      </div>
    `;
  }
};
