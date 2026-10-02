/**
 * Global Application State & Toast Management
 */
const State = {
  currentUser: null,
  unreadNotifications: 0,
  listeners: [],

  init() {
    const cachedUser = localStorage.getItem('flaming_current_user') || localStorage.getItem('grace_current_user');
    if (cachedUser) {
      try {
        this.currentUser = JSON.parse(cachedUser);
      } catch (e) {
        this.currentUser = null;
      }
    }
  },

  setCurrentUser(user, token) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('flaming_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('flaming_current_user');
      localStorage.removeItem('grace_current_user');
    }

    if (token !== undefined) {
      API.setToken(token);
    }

    this.notify();
  },

  logout() {
    this.setCurrentUser(null, null);
    Toast.show('You have been signed out safely. Go in peace.');
  },

  isPastor() {
    return this.currentUser && (this.currentUser.role === 'pastor' || this.currentUser.role === 'admin');
  },

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },

  notify() {
    for (const listener of this.listeners) {
      listener(this);
    }
  }
};

const Toast = {
  show(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose vector icon
    let iconSvg = Icons.get('flame', { size: 18, color: 'var(--color-gold)' });
    if (type === 'success' || message.includes('prayed') || message.includes('faith')) {
      iconSvg = Icons.get('pray', { size: 18, color: 'var(--color-gold)' });
    } else if (type === 'error') {
      iconSvg = Icons.get('close', { size: 18, color: 'var(--color-danger)' });
    }

    toast.innerHTML = `
      <span style="display: flex; align-items: center; flex-shrink: 0;">${iconSvg}</span>
      <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
