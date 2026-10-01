/**
 * Client Application Entry & Client-Side Router
 */
const App = {
  async init() {
    State.init();

    // Check auth status if token exists
    if (API.getToken()) {
      try {
        const res = await API.getMe();
        State.currentUser = res.user;
        State.unreadNotifications = res.unreadNotifications || 0;
      } catch (err) {
        // If token expired or invalid, clear it
        State.setCurrentUser(null, null);
      }
    }

    // Subscribe navbar updates to State changes
    State.subscribe(() => {
      Navbar.render();
      Navbar.renderMobileBottomBar();
    });

    Navbar.render();
    Navbar.renderMobileBottomBar();

    // Listen to hash changes for routing
    window.addEventListener('hashchange', () => this.handleRoute());

    // Initial route handling
    this.handleRoute();
  },

  handleRoute() {
    const rawHash = window.location.hash || '#/';
    Navbar.render();
    Navbar.renderMobileBottomBar();

    // Match routes
    if (rawHash === '#/' || rawHash === '') {
      HomeView.render();
    } else if (rawHash.startsWith('#/prayers/')) {
      const parts = rawHash.split('/');
      const id = parts[2];
      if (id) {
        PrayerDetailView.render(id);
      } else {
        PrayerWallView.render();
      }
    } else if (rawHash.startsWith('#/prayers')) {
      PrayerWallView.render();
    } else if (rawHash === '#/submit') {
      SubmitView.render();
    } else if (rawHash === '#/my-prayers') {
      MyPrayersView.render();
    } else if (rawHash === '#/admin') {
      AdminView.render();
    } else {
      HomeView.render();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
