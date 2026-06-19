// Authentication check

// Simple local login check used by all pages.
export function checkAuth() {
  const user = localStorage.getItem('user');
  const onLoginPage = window.location.pathname.endsWith('login.html');

  if (onLoginPage) {
    if (user) {
      window.location.assign(new URL('index.html', window.location.href));
    }
    return;
  }

  if (!user) {
    window.location.assign(new URL('login.html', window.location.href));
    return;
  }

  renderUserProfile(user);
}

// Header profile widget

function renderUserProfile(userName) {
  const headerInner = document.querySelector('.site-header__inner');
  if (!headerInner) return;

  if (document.getElementById('user-profile-widget')) return;

  const profileDiv = document.createElement('div');
  profileDiv.id = 'user-profile-widget';
  profileDiv.className = 'user-profile';

  const greetingSpan = document.createElement('span');
  greetingSpan.className = 'user-profile__greeting';
  greetingSpan.textContent = 'Hello, ';

  const nameStrong = document.createElement('strong');
  nameStrong.className = 'user-profile__name';
  nameStrong.textContent = userName;

  greetingSpan.appendChild(nameStrong);
  greetingSpan.append('!');

  const logoutBtn = document.createElement('button');
  logoutBtn.id = 'logout-btn';
  logoutBtn.type = 'button';
  logoutBtn.className = 'user-profile__logout-btn';
  logoutBtn.textContent = 'Log out';

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.assign(new URL('login.html', window.location.href));
  });

  profileDiv.appendChild(greetingSpan);
  profileDiv.appendChild(logoutBtn);
  headerInner.appendChild(profileDiv);
}
