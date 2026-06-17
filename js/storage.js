/**
 * storage.js
 * All localStorage read/write operations for OpportunityHub.
 * Every JSON.parse is wrapped in try/catch to handle corrupted data.
 */

import { STORAGE_KEYS, CACHE_TTL_MS } from './config.js';

// ---------------------------------------------------------------------------
// Generic safe read/write
// ---------------------------------------------------------------------------

/**
 * Safely reads and parses a JSON value from localStorage.
 * Returns `defaultValue` if the key is missing or the JSON is corrupted.
 *
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 */
function readStorage(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    // Corrupted JSON — clear the corrupted entry and return the default.
    localStorage.removeItem(key);
    return defaultValue;
  }
}

/**
 * Serializes a value to JSON and writes it to localStorage.
 * Silently fails if localStorage is unavailable (e.g. private browsing quota).
 *
 * @param {string} key
 * @param {*} value
 */
function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or unavailable — fail silently.
  }
}

// ---------------------------------------------------------------------------
// Saved opportunities
// ---------------------------------------------------------------------------

/**
 * Returns all saved opportunities from localStorage.
 * @returns {object[]}
 */
export function getSavedOpportunities() {
  return readStorage(STORAGE_KEYS.SAVED, []);
}

/**
 * Checks whether an opportunity with the given ID is already saved.
 * @param {number|string} id
 * @returns {boolean}
 */
export function isOpportunitySaved(id) {
  const saved = getSavedOpportunities();
  return saved.some((item) => item.id === id);
}

/**
 * Saves an opportunity object. Prevents duplicates by ID.
 * @param {object} opportunity - Normalized opportunity object from parser.js.
 * @returns {boolean} True if saved successfully, false if already saved.
 */
export function saveOpportunity(opportunity) {
  const saved = getSavedOpportunities();
  if (saved.some((item) => item.id === opportunity.id)) return false;
  saved.push(opportunity);
  writeStorage(STORAGE_KEYS.SAVED, saved);
  return true;
}

/**
 * Removes a saved opportunity by ID.
 * @param {number|string} id
 */
export function removeSavedOpportunity(id) {
  const saved = getSavedOpportunities();
  const updated = saved.filter((item) => item.id !== id);
  writeStorage(STORAGE_KEYS.SAVED, updated);
}

/**
 * Removes all saved opportunities after user confirmation.
 * @returns {boolean} True if cleared, false if user cancelled.
 */
export function clearSavedOpportunities() {
  if (!window.confirm('Are you sure you want to remove all saved opportunities? This cannot be undone.')) {
    return false;
  }
  localStorage.removeItem(STORAGE_KEYS.SAVED);
  localStorage.removeItem(STORAGE_KEYS.STATUSES);
  return true;
}

// ---------------------------------------------------------------------------
// Application statuses
// ---------------------------------------------------------------------------

/**
 * Returns the status map: { opportunityId: statusString }
 * @returns {object}
 */
export function getStatuses() {
  return readStorage(STORAGE_KEYS.STATUSES, {});
}

/**
 * Returns the application status for one opportunity.
 * @param {number|string} id
 * @returns {string}
 */
export function getStatusForOpportunity(id) {
  const statuses = getStatuses();
  return statuses[id] || 'interested';
}

/**
 * Sets the application status for one opportunity.
 * @param {number|string} id
 * @param {string} status
 */
export function updateOpportunityStatus(id, status) {
  const statuses = getStatuses();
  statuses[id] = status;
  writeStorage(STORAGE_KEYS.STATUSES, statuses);
}

// ---------------------------------------------------------------------------
// Last filters
// ---------------------------------------------------------------------------

/**
 * Returns the last-used filter state object.
 * @returns {object}
 */
export function getLastFilters() {
  return readStorage(STORAGE_KEYS.LAST_FILTERS, {});
}

/**
 * Persists the current filter state.
 * @param {object} filters
 */
export function saveLastFilters(filters) {
  writeStorage(STORAGE_KEYS.LAST_FILTERS, filters);
}

// ---------------------------------------------------------------------------
// Suggestion draft
// ---------------------------------------------------------------------------

/**
 * Returns the saved suggestion form draft, or null.
 * @returns {object|null}
 */
export function getSuggestionDraft() {
  return readStorage(STORAGE_KEYS.SUGGESTION_DRAFT, null);
}

/**
 * Saves a partial suggestion form state as a draft.
 * @param {object} draft
 */
export function saveSuggestionDraft(draft) {
  writeStorage(STORAGE_KEYS.SUGGESTION_DRAFT, draft);
}

/**
 * Clears the suggestion draft.
 */
export function clearSuggestionDraft() {
  localStorage.removeItem(STORAGE_KEYS.SUGGESTION_DRAFT);
}

// ---------------------------------------------------------------------------
// Submitted suggestions
// ---------------------------------------------------------------------------

/**
 * Returns all locally submitted suggestions.
 * @returns {object[]}
 */
export function getSubmittedSuggestions() {
  return readStorage(STORAGE_KEYS.SUBMITTED_SUGGESTIONS, []);
}

/**
 * Appends a new submitted suggestion to the local list.
 * @param {object} suggestion
 */
export function addSubmittedSuggestion(suggestion) {
  const list = getSubmittedSuggestions();
  list.push({ ...suggestion, submittedAt: new Date().toISOString() });
  writeStorage(STORAGE_KEYS.SUBMITTED_SUGGESTIONS, list);
}

// ---------------------------------------------------------------------------
// API cache
// ---------------------------------------------------------------------------

/**
 * Returns cached API data if it exists and has not expired.
 * Returns null if the cache is missing, stale, or corrupted.
 *
 * @param {string} cacheKey - Unique key for this cache entry (e.g. 'page-1').
 * @returns {object[]|null}
 */
export function getApiCache(cacheKey) {
  const cache = readStorage(STORAGE_KEYS.API_CACHE, {});
  const entry = cache[cacheKey];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
  return entry.data;
}

/**
 * Stores API data in the cache with the current timestamp.
 *
 * @param {string} cacheKey
 * @param {object[]} data
 */
export function setApiCache(cacheKey, data) {
  const cache = readStorage(STORAGE_KEYS.API_CACHE, {});
  cache[cacheKey] = { data, timestamp: Date.now() };
  writeStorage(STORAGE_KEYS.API_CACHE, cache);
}
