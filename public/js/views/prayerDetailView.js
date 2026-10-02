/**
 * Prayer Detail View (Dedicated Page: #/prayers/:id) - Flaming Prayer Wall
 */
const PrayerDetailView = {
  async render(prayerId) {
    const main = document.getElementById('main-content');
    if (!main) return;

    main.innerHTML = `
      <div class="container" style="padding-top: var(--space-2xl);">
        <a href="#/prayers" class="btn btn-ghost btn-sm" style="margin-bottom: 1rem;">
          &larr; Back to Flaming Prayer Wall
        </a>
        <div class="skeleton skeleton-card" style="height: 350px;"></div>
      </div>
    `;

    try {
      const data = await API.getPrayer(prayerId);
      const prayer = data.prayer;

      const isPrivate = prayer.visibility === 'private';
      const hasPastor = prayer.has_pastor_prayed;
      const pastorResp = prayer.pastor_response;
      const isCurrentPastor = State.isPastor();

      main.innerHTML = `
        <div class="container" style="padding-top: var(--space-xl); max-width: 960px;">
          <!-- Navigation back -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
            <a href="#/prayers" class="btn btn-ghost btn-sm">
              &larr; Back to Prayer Wall
            </a>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-sm btn-outline detail-share-btn">
                ${Icons.get('share', { size: 14 })}
                <span>Share</span>
              </button>
              <button class="btn btn-sm btn-ghost detail-report-btn" style="color: var(--color-danger);">
                Report
              </button>
            </div>
          </div>

          <!-- Main Prayer Card -->
          <div class="prayer-detail-card">
            <!-- Header Meta -->
            <div class="prayer-card-header">
              <div class="prayer-meta">
                <span class="badge badge-category" style="display: inline-flex; align-items: center; gap: 5px;">
                  ${prayer.category ? Icons.get(prayer.category.slug, { size: 13 }) : Icons.get('flame', { size: 13 })}
                  ${escapeHTML(prayer.category?.name || 'General')}
                </span>
                ${isPrivate ? `<span class="badge badge-private" style="display: inline-flex; align-items: center; gap: 4px;">${Icons.get('lock', { size: 12 })} Confidential Pastoral Care</span>` : ''}
                <span class="meta-dot">•</span>
                <span class="prayer-author">${escapeHTML(prayer.author_name || 'Anonymous')}</span>
                <span class="meta-dot">•</span>
                <span>${timeAgo(prayer.created_at)}</span>
              </div>
            </div>

            <!-- Title -->
            <h1 style="font-family: var(--font-heading); font-size: 2rem; font-weight: 700; color: #FFFFFF; line-height: 1.3; letter-spacing: -0.015em;">
              ${escapeHTML(prayer.title)}
            </h1>

            <!-- Prayer Content -->
            <div style="font-size: 1.1rem; line-height: 1.8; color: var(--color-text-main); white-space: pre-line; padding-block: 0.5rem;">
              ${escapeHTML(prayer.content)}
            </div>

            <!-- THE PASTOR'S PRAYER (VISUALLY DISTINGUISHED) -->
            ${hasPastor ? `
              <div class="pastor-prayer-box" style="margin-top: 1rem; padding: 1.5rem;">
                <div class="pastor-box-header">
                  <div class="pastor-tagline">
                    <span class="pastor-badge">
                      ${Icons.get('shieldCheck', { size: 13, color: 'var(--color-gold)' })}
                      Verified Shepherd
                    </span>
                    <span style="font-size: 1.05rem; font-weight: 700; color: #FFFFFF;">
                      ${escapeHTML(pastorResp?.pastor_name || 'PDaniel Olawande')}
                    </span>
                  </div>
                  ${pastorResp?.created_at ? `<span class="pastor-time">${timeAgo(pastorResp.created_at)}</span>` : ''}
                </div>

                ${pastorResp && !pastorResp.prayed_only && pastorResp.response_text ? `
                  <div class="pastor-prayer-text" style="font-size: 1.05rem; padding-top: 0.5rem;">
                    "${escapeHTML(pastorResp.response_text)}"
                  </div>
                ` : `
                  <div class="pastor-prayer-prayed-only" style="font-size: 1rem; display: flex; align-items: center; gap: 6px;">
                    ${Icons.get('shieldCheck', { size: 15, color: 'var(--color-gold)' })}
                    <span>PDaniel Olawande has stood in prayer over this petition</span>
                  </div>
                `}

                ${isCurrentPastor ? `
                  <div style="margin-top: 0.75rem;">
                    <button class="btn btn-sm btn-outline pastor-edit-resp-btn" style="border-color: var(--color-gold); color: var(--color-gold); display: inline-flex; align-items: center; gap: 4px;">
                      ${Icons.get('edit', { size: 13 })} Edit Pastoral Prayer
                    </button>
                  </div>
                ` : ''}
              </div>
            ` : (isCurrentPastor ? `
              <div style="background: var(--pastor-bg); border: 1px dashed var(--pastor-border); border-radius: var(--radius-md); padding: 1rem; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <strong style="color: var(--pastor-accent);">Pastor Action:</strong>
                  <span style="font-size: 0.9rem; color: var(--color-text-muted);"> You have not yet interceded over this petition.</span>
                </div>
                <button class="btn btn-sm btn-gold pastor-pray-now-btn" style="display: inline-flex; align-items: center; gap: 5px;">
                  ${Icons.get('flame', { size: 14, color: '#070B12' })} Pray & Respond as PDaniel
                </button>
              </div>
            ` : '')}

            <!-- Bottom Action Row -->
            <div class="prayer-card-footer" style="padding-top: 1.5rem; margin-top: 1rem;">
              <div class="prayer-count-stat" id="detail-count-stat" style="font-size: 1rem;">
                ${Icons.get('pray', { size: 20, color: 'var(--color-gold)' })}
                <span><strong>${prayer.prayer_count}</strong> ${prayer.prayer_count === 1 ? 'person' : 'people'} have stood in prayer</span>
              </div>

              <button 
                class="btn btn-pray btn-lg ${prayer.user_has_prayed ? 'prayed' : ''}" 
                id="detail-pray-btn"
              >
                <span class="pray-hands-icon">${Icons.get('pray', { size: 18 })}</span>
                <span id="detail-pray-text">${prayer.user_has_prayed ? 'You Prayed' : 'I Prayed'}</span>
              </button>
            </div>
          </div>

          <!-- COMMUNITY ENCOURAGEMENTS SECTION (Unless Private) -->
          ${!isPrivate ? `
            <section class="comments-section">
              <h3 style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700; color: #FFFFFF; letter-spacing: -0.015em;">
                Words of Encouragement & Faith (${prayer.comments?.length || 0})
              </h3>

              <!-- Add Encouragement Form -->
              <div class="form-card" style="padding: 1.5rem; border-radius: var(--radius-lg);">
                <h4 style="font-size: 1rem; color: #FFFFFF; margin-bottom: 0.5rem;">
                  Leave a word of scripture or agreement:
                </h4>
                <form id="add-comment-form">
                  <div class="form-group" style="margin-bottom: 0.75rem;">
                    <textarea 
                      id="comment-content" 
                      class="form-textarea" 
                      style="min-height: 80px;" 
                      placeholder="e.g. Standing with you in faith. The Lord will finish what He started!"
                      maxlength="300"
                      required
                    ></textarea>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                    <span style="font-size: 0.78rem; color: var(--color-text-muted);">
                      Encouragements are kept brief to honor the focus on prayer.
                    </span>
                    <button type="submit" class="btn btn-primary btn-sm">
                      Post Encouragement
                    </button>
                  </div>
                </form>
              </div>

              <!-- Encouragements List -->
              <div id="comments-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${(prayer.comments && prayer.comments.length > 0) ? prayer.comments.map(c => `
                  <div class="comment-card">
                    <div class="comment-header">
                      <span class="comment-author" style="display: inline-flex; align-items: center; gap: 5px;">
                        ${Icons.get('salvation', { size: 14, color: 'var(--color-gold)' })}
                        ${escapeHTML(c.author_name)}
                      </span>
                      <span style="color: var(--color-text-light); font-size: 0.78rem;">${timeAgo(c.created_at)}</span>
                    </div>
                    <div class="comment-body">
                      ${escapeHTML(c.content)}
                    </div>
                  </div>
                `).join('') : `
                  <div style="text-align: center; padding: 2rem; color: var(--color-text-muted); font-size: 0.95rem;">
                    No encouragements posted yet. Be the first to leave a comforting scripture.
                  </div>
                `}
              </div>
            </section>
          ` : ''}
        </div>
      `;

      // Bind events
      const prayBtn = document.getElementById('detail-pray-btn');
      const prayText = document.getElementById('detail-pray-text');
      const countStat = document.getElementById('detail-count-stat');

      if (prayBtn) {
        prayBtn.addEventListener('click', async () => {
          const isPrayed = prayBtn.classList.contains('prayed');
          prayBtn.classList.toggle('prayed');
          prayText.textContent = isPrayed ? 'I Prayed' : 'You Prayed';

          try {
            const res = await API.pray(prayer.id);
            if (countStat) {
              countStat.innerHTML = `
                ${Icons.get('pray', { size: 20, color: 'var(--color-gold)' })}
                <span><strong>${res.prayer_count}</strong> ${res.prayer_count === 1 ? 'person' : 'people'} have stood in prayer</span>
              `;
            }
            if (res.action === 'prayed') {
              prayBtn.classList.add('prayed');
              prayText.textContent = 'You Prayed';
              Toast.show('Thank you for standing in agreement.', 'success');
            } else {
              prayBtn.classList.remove('prayed');
              prayText.textContent = 'I Prayed';
              Toast.show('Prayer updated.', 'info');
            }
          } catch (err) {
            prayBtn.classList.toggle('prayed', isPrayed);
            prayText.textContent = isPrayed ? 'You Prayed' : 'I Prayed';
            Toast.show(err.message, 'error');
          }
        });
      }

      // Share button
      main.querySelector('.detail-share-btn')?.addEventListener('click', () => {
        if (isPrivate) {
          Toast.show('Private requests cannot be shared.', 'info');
          return;
        }
        Modals.openShareModal(prayer.id, prayer.title);
      });

      // Report button
      main.querySelector('.detail-report-btn')?.addEventListener('click', () => {
        Modals.openReportModal(prayer.id);
      });

      // Pastor Action buttons
      main.querySelector('.pastor-pray-now-btn')?.addEventListener('click', () => {
        Modals.openPastorPrayerModal(prayer.id, prayer.title, prayer.author_name);
      });
      main.querySelector('.pastor-edit-resp-btn')?.addEventListener('click', () => {
        Modals.openPastorPrayerModal(prayer.id, prayer.title, prayer.author_name);
      });

      // Post comment form
      const commentForm = document.getElementById('add-comment-form');
      if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const input = document.getElementById('comment-content');
          const content = input.value.trim();
          if (!content) return;

          try {
            const res = await API.addComment(prayer.id, { content });
            Toast.show(res.message, 'success');
            input.value = '';
            PrayerDetailView.render(prayer.id);
          } catch (err) {
            Toast.show(err.message, 'error');
          }
        });
      }

    } catch (err) {
      console.error('Detail view error:', err);
      main.innerHTML = `
        <div class="container" style="padding-top: var(--space-3xl); max-width: 600px;">
          <div class="confirmation-card">
            <h2 style="color: #FFFFFF;">Request Unavailable</h2>
            <p style="color: var(--color-text-muted); margin-block: 0.5rem;">
              ${escapeHTML(err.message || 'This prayer request may be private or no longer available.')}
            </p>
            <a href="#/prayers" class="btn btn-primary btn-sm" style="margin-top: 1rem;">
              Return to Prayer Wall
            </a>
          </div>
        </div>
      `;
    }
  }
};
