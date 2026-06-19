import { STORAGE_KEYS, CACHE_TTL_MS } from './config.js';

// Safe localStorage helpers

// All localStorage access goes through these helpers.
function readStorage(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(key);
    return defaultValue;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// Saved opportunities

export function getSavedOpportunities() {
  return readStorage(STORAGE_KEYS.SAVED, []);
}

export function isOpportunitySaved(id) {
  const saved = getSavedOpportunities();
  return saved.some((item) => item.id === id);
}

export function saveOpportunity(opportunity) {
  const saved = getSavedOpportunities();
  if (saved.some((item) => item.id === opportunity.id)) return false;
  saved.push(opportunity);
  writeStorage(STORAGE_KEYS.SAVED, saved);
  return true;
}

export function removeSavedOpportunity(id) {
  const saved = getSavedOpportunities();
  const updated = saved.filter((item) => item.id !== id);
  writeStorage(STORAGE_KEYS.SAVED, updated);
}

export function clearSavedOpportunities() {
  if (!window.confirm('Are you sure you want to remove all saved opportunities? This cannot be undone.')) {
    return false;
  }
  localStorage.removeItem(STORAGE_KEYS.SAVED);
  localStorage.removeItem(STORAGE_KEYS.STATUSES);
  return true;
}

// Application statuses

// Statuses are stored separately so saved cards can change progress quickly.
export function getStatuses() {
  return readStorage(STORAGE_KEYS.STATUSES, {});
}

export function getStatusForOpportunity(id) {
  const statuses = getStatuses();
  return statuses[id] || 'interested';
}

export function updateOpportunityStatus(id, status) {
  const statuses = getStatuses();
  statuses[id] = status;
  writeStorage(STORAGE_KEYS.STATUSES, statuses);
}

// Last filters

export function getLastFilters() {
  return readStorage(STORAGE_KEYS.LAST_FILTERS, {});
}

export function saveLastFilters(filters) {
  writeStorage(STORAGE_KEYS.LAST_FILTERS, filters);
}

// Suggestion draft

export function getSuggestionDraft() {
  return readStorage(STORAGE_KEYS.SUGGESTION_DRAFT, null);
}

export function saveSuggestionDraft(draft) {
  writeStorage(STORAGE_KEYS.SUGGESTION_DRAFT, draft);
}

export function clearSuggestionDraft() {
  localStorage.removeItem(STORAGE_KEYS.SUGGESTION_DRAFT);
}

// Submitted suggestions

export function getSubmittedSuggestions() {
  return readStorage(STORAGE_KEYS.SUBMITTED_SUGGESTIONS, []);
}

export function addSubmittedSuggestion(suggestion) {
  const list = getSubmittedSuggestions();
  list.push({ ...suggestion, submittedAt: new Date().toISOString() });
  writeStorage(STORAGE_KEYS.SUBMITTED_SUGGESTIONS, list);
}

// API cache

// Cache GitHub responses briefly to avoid hitting the anonymous rate limit.
export function getApiCache(cacheKey) {
  const cache = readStorage(STORAGE_KEYS.API_CACHE, {});
  const entry = cache[cacheKey];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
  return entry.data;
}

export function setApiCache(cacheKey, data) {
  const cache = readStorage(STORAGE_KEYS.API_CACHE, {});
  cache[cacheKey] = { data, timestamp: Date.now() };
  writeStorage(STORAGE_KEYS.API_CACHE, cache);
}
