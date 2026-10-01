/**
 * Prayer Card Component - Flaming Prayer Wall
 */
const PrayerCard = {
  render(prayer, options = {}) {
    const isPrivate = prayer.visibility === 'private';
    const hasPastorPrayed = prayer.has_pastor_prayed;
    const pastorResp = prayer.pastor_response;
    const isCurrentPastor = State.isPastor();

    return `
      <article class="prayer-card" data-prayer-id="${prayer.id}" id="prayer-card-${prayer.id}">
        <!-- Header -->
        <div class="prayer-card-header">
          <div class="prayer-meta">
            <span class="badge badge-category">
              ${escapeHTML(prayer.category ? prayer.category.name : 'Prayer')}
            </span>
            ${isPrivate ? '<span class="badge badge-private">🔒 Confidential</span>' : ''}
            <span class="meta-dot">•</span>
            <span class="prayer-author">${escapeHTML(prayer.author_name || 'Anonymous')}</span>
            <span class="meta-dot">•</span>
            <span>${timeAgo(prayer.created_at)}</span>
          </div>
        </div>

        <!-- Title -->
        <h3 class="prayer-card-title">
          <a href="#/prayers/${prayer.id}">${escapeHTML(prayer.title)}</a>
        </h3>

        <!-- Content -->
        <div class="prayer-card-content">
          ${escapeHTML(prayer.content)}
        </div>

        <!-- THE PASTOR'S PRAYER (VISUALLY DISTINGUISHED) -->
        ${hasPastorPrayed ? `
          <div class="pastor-prayer-box">
            <div class="pastor-box-header">
              <div class="pastor-tagline">
                <span class="pastor-badge">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Verified Shepherd
                </span>
                <span>${escapeHTML(pastorResp?.pastor_name || 'PDaniel Olawande')}</span>
              </div>
              ${pastorResp?.created_at ? `<span class="pastor-time">${timeAgo(pastorResp.created_at)}</span>` : ''}
            </div>

            ${pastorResp && !pastorResp.prayed_only && pastorResp.response_text ? `
              <div class="pastor-prayer-text">
                "${escapeHTML(pastorResp.response_text)}"
              </div>
            ` : `
              <div class="pastor-prayer-prayed-only">
                <span>✓ PDaniel Olawande has stood in prayer over this petition</span>
              </div>
            `}
          </div>
        ` : ''}

        <!-- Footer Actions -->
        <div class="prayer-card-footer">
          <!-- Prayer Count -->
          <div class="prayer-count-stat" id="count-stat-${prayer.id}">
            <span>🙏</span>
            <span><strong>${prayer.prayer_count}</strong> ${prayer.prayer_count === 1 ? 'person' : 'people'} prayed</span>
          </div>

          <!-- Buttons Group -->
          <div class="card-actions-group">
            <!-- I Prayed Action -->
            <button 
              class="btn btn-sm btn-pray ${prayer.user_has_prayed ? 'prayed' : ''}" 
              data-prayer-id="${prayer.id}"
              aria-label="Pray for this request"
            >
              <span class="pray-hands-icon">🙏</span>
              <span class="pray-btn-text">${prayer.user_has_prayed ? '✓ You Prayed' : 'I Prayed'}</span>
            </button>

            <!-- Pastor Quick Respond (Only visible to Pastor/Admin) -->
            ${isCurrentPastor ? `
              <button 
                class="btn btn-sm btn-outline pastor-action-btn" 
                data-prayer-id="${prayer.id}"
                data-prayer-title="${escapeHTML(prayer.title)}"
                data-author="${escapeHTML(prayer.author_name)}"
                title="Respond as PDaniel"
                style="border-color: var(--color-gold); color: var(--color-gold);"
              >
                🔥 Pastor Action
              </button>
            ` : ''}

            <!-- Share Button -->
            <button 
              class="btn btn-sm btn-ghost share-btn" 
              data-prayer-id="${prayer.id}"
              data-prayer-title="${escapeHTML(prayer.title)}"
              data-is-private="${isPrivate}"
              title="Share prayer request"
              aria-label="Share prayer request"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </button>

            <!-- View Request -->
            <a 
              href="#/prayers/${prayer.id}" 
              class="btn btn-sm btn-ghost" 
              title="View full petition and prayers"
              aria-label="View full petition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </a>
          </div>
        </div>
      </article>
    `;
  },

  bindEvents(container) {
    if (!container) return;

    // Handle "I Prayed" clicks
    container.querySelectorAll('.btn-pray').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const prayerId = btn.dataset.prayerId;
        const btnText = btn.querySelector('.pray-btn-text');

        // Optimistic UI toggle
        const isCurrentlyPrayed = btn.classList.contains('prayed');
        btn.classList.toggle('prayed');
        btnText.textContent = isCurrentlyPrayed ? 'I Prayed' : '✓ You Prayed';

        const countStat = container.querySelector(`#count-stat-${prayerId}`);

        try {
          const res = await API.pray(prayerId);
          if (countStat) {
            countStat.innerHTML = `
              <span>🙏</span>
              <span><strong>${res.prayer_count}</strong> ${res.prayer_count === 1 ? 'person' : 'people'} prayed</span>
            `;
          }

          if (res.action === 'prayed') {
            btn.classList.add('prayed');
            btnText.textContent = '✓ You Prayed';
            Toast.show('Thank you for standing in agreement and prayer.', 'success');
          } else {
            btn.classList.remove('prayed');
            btnText.textContent = 'I Prayed';
            Toast.show('Prayer intercession updated.', 'info');
          }
        } catch (err) {
          // Revert optimistic update on failure
          btn.classList.toggle('prayed', isCurrentlyPrayed);
          btnText.textContent = isCurrentlyPrayed ? '✓ You Prayed' : 'I Prayed';
          Toast.show('Could not record prayer: ' + err.message, 'error');
        }
      });
    });

    // Handle Pastor Action Clicks
    container.querySelectorAll('.pastor-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const prayerId = btn.dataset.prayerId;
        const title = btn.dataset.prayerTitle;
        const author = btn.dataset.author;
        Modals.openPastorPrayerModal(prayerId, title, author);
      });
    });

    // Handle Share Clicks
    container.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const prayerId = btn.dataset.prayerId;
        const title = btn.dataset.prayerTitle;
        const isPrivate = btn.dataset.isPrivate === 'true';

        if (isPrivate) {
          Toast.show('Private prayer requests cannot be shared outside.', 'info');
          return;
        }

        Modals.openShareModal(prayerId, title);
      });
    });
  }
};
