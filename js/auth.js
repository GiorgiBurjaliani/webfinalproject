/**
 * auth.js
 * Manages user authentication state and site-header user integration.
 */

/**
 * Checks if the user is authenticated.
 * If not, redirects to login.html.
 * If authenticated, renders the user greeting and logout button in the header.
 */
export function checkAuth() {
  const user = localStorage.getItem('user');

  // If on login page and already logged in, redirect to index
  if (window.location.pathname.endsWith('login.html')) {
    if (user) {
      window.location.href = 'index.html';
    }
    return;
  }

  // If not on login page and not logged in, redirect to login
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // If logged in, inject the user profile UI into the header
  renderUserProfile(user);
}

/**
 * Renders the user profile widget in the header.
 *
 * @param {string} userName
 */
function renderUserProfile(userName) {
  const headerInner = document.querySelector('.site-header__inner');
  if (!headerInner) return;

  // Prevent duplicate rendering
  if (document.getElementById('user-profile-widget')) return;

  const profileDiv = document.createElement('div');
  profileDiv.id = 'user-profile-widget';
  profileDiv.className = 'user-profile';

  const greetingSpan = document.createElement('span');
  greetingSpan.className = 'user-profile__greeting';
  greetingSpan.textContent = 'გამარჯობა, ';

  const nameStrong = document.createElement('strong');
  nameStrong.className = 'user-profile__name';
  nameStrong.textContent = userName;

  greetingSpan.appendChild(nameStrong);
  greetingSpan.append('!');

  const logoutBtn = document.createElement('button');
  logoutBtn.id = 'logout-btn';
  logoutBtn.type = 'button';
  logoutBtn.className = 'user-profile__logout-btn';
  logoutBtn.textContent = 'გამოსვლა';

  logoutBtn.addEventListener('click', () => {
    // Clear user session
    localStorage.removeItem('user');
    document.cookie = 'authorized=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = 'login.html';
  });

  profileDiv.appendChild(greetingSpan);
  profileDiv.appendChild(logoutBtn);
  headerInner.appendChild(profileDiv);
}
