import { checkAuth } from './auth.js';

// Page setup

// Check auth state on load. If the user is already logged in,
// auth.js redirects this page to index.html.
checkAuth();

const form = document.getElementById('login-form');
const inputEl = document.getElementById('name-input');
const errorEl = document.getElementById('login-error');

// Login form

function showLoginError(message) {
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }
  if (inputEl) {
    inputEl.classList.add('form-field__input--error');
  }
}

function clearLoginError() {
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
  if (inputEl) {
    inputEl.classList.remove('form-field__input--error');
  }
}

function handleLoginSubmit(event) {
  event.preventDefault();

  const name = inputEl ? inputEl.value.trim() : '';
  if (!name) {
    showLoginError('Please enter your name.');
    return;
  }

  if (name.length < 2) {
    showLoginError('Name must be at least 2 characters.');
    return;
  }

  clearLoginError();

  try {
    localStorage.setItem('user', name);
  } catch {
    showLoginError('Your browser blocked local storage. Please enable it and try again.');
    return;
  }

  window.location.assign(new URL('index.html', window.location.href));
}

if (form) {
  form.addEventListener('submit', handleLoginSubmit);
}
