/**
 * utils.js
 * Pure helper functions with no side effects.
 * Re-used across multiple page modules.
 */

// ---------------------------------------------------------------------------
// Debounce closure
// ---------------------------------------------------------------------------

/**
 * Creates a debounced version of a callback function.
 *
 * CLOSURE EXPLANATION:
 * - `timerId` is declared in the outer function scope.
 * - The returned inner function "closes over" timerId, keeping it alive
 *   between calls even after createDebounce() has returned.
 * - Each invocation of the inner function cancels the previous timeout and
 *   starts a new one, so the callback only fires after the user stops
 *   triggering events for `delay` ms.
 * - This prevents filtering or API work on every single keystroke.
 *
 * @param {Function} callback - The function to debounce.
 * @param {number} delay      - Wait time in milliseconds (default 350).
 * @returns {Function} The debounced inner function.
 */
export function createDebounce(callback, delay = 350) {
  let timerId = null; // outer variable captured by the inner function

  return function debounced(...args) {
    clearTimeout(timerId);           // cancel previous pending call
    timerId = setTimeout(() => {     // schedule new call
      callback(...args);
    }, delay);
  };
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Formats an ISO date string (YYYY-MM-DD or full ISO) to a human-readable
 * string such as "15 Jul 2025". Returns the fallback string when the value
 * is missing or invalid.
 *
 * @param {string|null|undefined} dateStr
 * @param {string} fallback
 * @returns {string}
 */
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

/**
 * Returns a deadline-status descriptor based on a deadline date string.
 *
 * Possible return values:
 *  - 'not-specified' → no deadline provided
 *  - 'passed'        → deadline is in the past
 *  - 'closing-soon'  → deadline is within the next 7 days
 *  - 'open'          → deadline is more than 7 days away
 *
 * @param {string|null|undefined} deadlineStr - ISO date string
 * @returns {{ key: string, label: string }}
 */
export function getDeadlineStatus(deadlineStr) {
  if (!deadlineStr) {
    return { key: 'not-specified', label: 'Deadline not specified' };
  }

  const deadline = new Date(deadlineStr);

  if (isNaN(deadline.getTime())) {
    return { key: 'not-specified', label: 'Deadline not specified' };
  }

  const now = new Date();
  // Compare at day granularity (strip time component)
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

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/**
 * Converts a string to lowercase and trims whitespace.
 * Used when comparing filter values against opportunity data.
 *
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (typeof text !== 'string') return '';
  return text.toLowerCase().trim();
}

/**
 * Truncates a string to `maxLength` characters, appending "…" if truncated.
 *
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 150) {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

// ---------------------------------------------------------------------------
// Sorting helpers
// ---------------------------------------------------------------------------

/**
 * Compares two opportunity objects by their deadline dates for ascending sort.
 * Opportunities with no deadline are sorted to the end.
 *
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
export function compareDeadlinesAsc(a, b) {
  const aDate = a.deadline ? new Date(a.deadline).getTime() : Infinity;
  const bDate = b.deadline ? new Date(b.deadline).getTime() : Infinity;
  return aDate - bDate;
}

/**
 * Compares two opportunity objects by their deadline dates for descending sort.
 * Opportunities with no deadline are sorted to the end.
 *
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
export function compareDeadlinesDesc(a, b) {
  const aDate = a.deadline ? new Date(a.deadline).getTime() : -Infinity;
  const bDate = b.deadline ? new Date(b.deadline).getTime() : -Infinity;
  return bDate - aDate;
}

/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Maps an internal category key to a display label.
 *
 * @param {string} key
 * @returns {string}
 */
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

/**
 * Maps an internal funding key to a display label.
 *
 * @param {string} key
 * @returns {string}
 */
export function fundingLabel(key) {
  const map = {
    free: 'Free',
    paid: 'Paid',
    'fully-funded': 'Fully Funded',
    'partially-funded': 'Partially Funded',
  };
  return map[key] || capitalize(key) || 'See details';
}

/**
 * Maps an internal format key to a display label.
 *
 * @param {string} key
 * @returns {string}
 */
export function formatLabel(key) {
  const map = {
    online: 'Online',
    'in-person': 'In-person',
    hybrid: 'Hybrid',
  };
  return map[key] || capitalize(key) || 'See details';
}

/**
 * Checks if a URL is a placeholder or demo link.
 *
 * @param {string} url
 * @returns {boolean}
 */
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
    return true; // invalid URL is considered a placeholder
  }
  return false;
}

/**
 * Checks if a URL points only to a general homepage (e.g. root path of a general organization/platform).
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isGeneralHomepageUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') return true;
  const clean = url.trim().toLowerCase();

  // If it's a known placeholder
  if (isPlaceholderUrl(clean)) return true;

  try {
    const parsed = new URL(clean);
    const hostname = parsed.hostname.replace('www.', '');
    const path = parsed.pathname === '/' ? '' : parsed.pathname;

    // Check if the path is empty (just the domain root)
    const isRoot = path === '' || path === '/';

    // List of domains where the root is considered a general homepage
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

    if (isRoot) {
      // If it's a root URL on any of these domains/subdomains or general domains
      if (generalDomains.some(d => hostname === d || hostname.endsWith('.' + d))) {
        return true;
      }
    }

    // Specific pages that are community/platform homepages rather than event pages
    if (hostname === 'reddit.com' && (path.startsWith('/r/devvit') && path.split('/').length <= 3)) {
      return true; // r/Devvit homepage itself
    }

  } catch {
    return true; // invalid URL is considered general homepage/invalid
  }

  return false;
}
