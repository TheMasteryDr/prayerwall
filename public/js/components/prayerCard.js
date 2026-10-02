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
            <span class="badge badge-category" style="display: inline-flex; align-items: center; gap: 5px;">
              ${prayer.category ? Icons.get(prayer.category.slug, { size: 13 }) : Icons.get('flame', { size: 13 })}
              ${escapeHTML(prayer.category ? prayer.category.name : 'Prayer')}
            </span>
            ${isPrivate ? `<span class="badge badge-private" style="display: inline-flex; align-items: center; gap: 4px;">${Icons.get('lock', { size: 12 })} Confidential</span>` : ''}
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
                  ${Icons.get('shieldCheck', { size: 13, color: 'var(--color-gold)' })}
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
              <div class="pastor-prayer-prayed-only" style="display: flex; align-items: center; gap: 6px;">
                ${Icons.get('shieldCheck', { size: 14, color: 'var(--color-gold)' })}
                <span>PDaniel Olawande has stood in prayer over this petition</span>
              </div>
            `}
          </div>
        ` : ''}

        <!-- Footer Actions -->
        <div class="prayer-card-footer">
          <!-- Prayer Count -->
          <div class="prayer-count-stat" id="count-stat-${prayer.id}">
            ${Icons.get('pray', { size: 16, color: 'var(--color-gold)' })}
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
              <span class="pray-hands-icon">${Icons.get('pray', { size: 15 })}</span>
              <span class="pray-btn-text">${prayer.user_has_prayed ? 'You Prayed' : 'I Prayed'}</span>
            </button>

            <!-- Pastor Quick Respond (Only visible to Pastor/Admin) -->
            ${isCurrentPastor ? `
              <button 
                class="btn btn-sm btn-outline pastor-action-btn" 
                data-prayer-id="${prayer.id}"
                data-prayer-title="${escapeHTML(prayer.title)}"
                data-author="${escapeHTML(prayer.author_name)}"
                title="Respond as PDaniel"
                style="border-color: var(--color-gold); color: var(--color-gold); display: inline-flex; align-items: center; gap: 5px;"
              >
                ${Icons.get('flame', { size: 14, color: 'var(--color-gold)' })} Pastor Action
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
              ${Icons.get('share', { size: 15 })}
            </button>

            <!-- View Request -->
            <a 
              href="#/prayers/${prayer.id}" 
              class="btn btn-sm btn-ghost" 
              title="View full petition and prayers"
              aria-label="View full petition"
            >
              ${Icons.get('link', { size: 15 })}
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
        btnText.textContent = isCurrentlyPrayed ? 'I Prayed' : 'You Prayed';

        const countStat = container.querySelector(`#count-stat-${prayerId}`);

        try {
          const res = await API.pray(prayerId);
          if (countStat) {
            countStat.innerHTML = `
              ${Icons.get('pray', { size: 16, color: 'var(--color-gold)' })}
              <span><strong>${res.prayer_count}</strong> ${res.prayer_count === 1 ? 'person' : 'people'} prayed</span>
            `;
          }

          if (res.action === 'prayed') {
            btn.classList.add('prayed');
            btnText.textContent = 'You Prayed';
            Toast.show('Thank you for standing in agreement and prayer.', 'success');
          } else {
            btn.classList.remove('prayed');
            btnText.textContent = 'I Prayed';
            Toast.show('Prayer intercession updated.', 'info');
          }
        } catch (err) {
          // Revert optimistic update on failure
          btn.classList.toggle('prayed', isCurrentlyPrayed);
          btnText.textContent = isCurrentlyPrayed ? 'You Prayed' : 'I Prayed';
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
