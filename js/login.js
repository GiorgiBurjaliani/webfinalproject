import { checkAuth } from './auth.js';

// Check auth state on load (redirects to index.html if already logged in)
checkAuth();

document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const inputEl = document.getElementById('name-input');
  const name = inputEl.value.trim();
  const errorEl = document.getElementById('login-error');

  if (!name) {
    errorEl.textContent = 'გთხოვთ შეიყვანოთ სახელი.';
    errorEl.hidden = false;
    inputEl.classList.add('form-field__input--error');
    return;
  }

  if (name.length < 2) {
    errorEl.textContent = 'სახელი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან.';
    errorEl.hidden = false;
    inputEl.classList.add('form-field__input--error');
    return;
  }

  errorEl.hidden = true;
  inputEl.classList.remove('form-field__input--error');

  // Save user name and set authorized cookie
  localStorage.setItem('user', name);
  document.cookie = 'authorized=true; path=/;';

  window.location.href = 'index.html';
});
