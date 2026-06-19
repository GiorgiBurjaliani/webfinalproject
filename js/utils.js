// Debounce

// Debounce uses a closure: timerId stays alive between input events.
export function createDebounce(callback, delay = 350) {
  let timerId = null;

  return function debounced(...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

// Date helpers

export function formatDate(dateStr, fallback = 'Not specified') {
  if (!dateStr) return fallback;

  const date = new Date(dateStr);

  if (isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getDeadlineStatus(deadlineStr) {
  if (!deadlineStr) {
    return { key: 'not-specified', label: 'Deadline not specified' };
  }

  const deadline = new Date(deadlineStr);

  if (isNaN(deadline.getTime())) {
    return { key: 'not-specified', label: 'Deadline not specified' };
  }

  const now = new Date();
  // Compare dates by day, not by the current hour.
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineStart = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());

  const diffMs = deadlineStart - todayStart;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { key: 'passed', label: 'Deadline passed' };
  }
  if (diffDays <= 7) {
    return { key: 'closing-soon', label: 'Closing soon' };
  }
  return { key: 'open', label: 'Applications open' };
}

// Text helpers

export function normalizeText(text) {
  if (typeof text !== 'string') return '';
  return text.toLowerCase().trim();
}

export function truncate(text, maxLength = 150) {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

// Sorting helpers

export function compareDeadlinesAsc(a, b) {
  const aDate = a.deadline ? new Date(a.deadline).getTime() : Infinity;
  const bDate = b.deadline ? new Date(b.deadline).getTime() : Infinity;
  return aDate - bDate;
}

export function compareDeadlinesDesc(a, b) {
  const aDate = a.deadline ? new Date(a.deadline).getTime() : -Infinity;
  const bDate = b.deadline ? new Date(b.deadline).getTime() : -Infinity;
  return bDate - aDate;
}

// Labels

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function categoryLabel(key) {
  const map = {
    hackathon: 'Hackathon',
    camp: 'Technology Camp',
    'ai-camp': 'AI Camp',
    competition: 'Competition',
    'startup-challenge': 'Startup Challenge',
    bootcamp: 'Bootcamp',
    workshop: 'Workshop',
    conference: 'Conference',
    'youth-program': 'Youth Program',
  };
  return map[key] || capitalize(key) || 'Opportunity';
}

export function fundingLabel(key) {
  const map = {
    free: 'Free',
    paid: 'Paid',
    'fully-funded': 'Fully Funded',
    'partially-funded': 'Partially Funded',
  };
  return map[key] || capitalize(key) || 'See details';
}

export function formatLabel(key) {
  const map = {
    online: 'Online',
    'in-person': 'In-person',
    hybrid: 'Hybrid',
  };
  return map[key] || capitalize(key) || 'See details';
}

// URL helpers

// Demo URLs should not be shown as real application links.
export function isPlaceholderUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') return true;
  const clean = url.trim().toLowerCase();
  
  if (clean.includes('placeholder') || clean.includes('demo')) return true;

  try {
    const parsed = new URL(clean);
    const hostname = parsed.hostname;
    if (hostname === 'example.com' || hostname.endsWith('.example.com')) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

// A root homepage is usually less useful than a specific event page.
export function isGeneralHomepageUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') return true;
  const clean = url.trim().toLowerCase();

  if (isPlaceholderUrl(clean)) return true;

  try {
    const parsed = new URL(clean);
    const hostname = parsed.hostname.replace('www.', '');
    const path = parsed.pathname === '/' ? '' : parsed.pathname;

    const isRoot = path === '' || path === '/';

    const generalDomains = [
      'reddit.com',
      'devpost.com',
      'eiturbanmobility.eu',
      'youthtbilisi.ge',
      'github.com',
      'tbilisi.gov.ge',
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'linkedin.com',
      'google.com',
      'youtube.com'
    ];

    if (isRoot && generalDomains.some(d => hostname === d || hostname.endsWith('.' + d))) {
      return true;
    }

    if (hostname === 'reddit.com' && (path.startsWith('/r/devvit') && path.split('/').length <= 3)) {
      return true;
    }

  } catch {
    return true; // invalid URL is considered general homepage/invalid
  }

  return false;
}
