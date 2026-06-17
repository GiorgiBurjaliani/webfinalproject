/**
 * config.js
 * Central configuration for OpportunityHub.
 * Contains GitHub API settings and localStorage key constants.
 */

/** GitHub repository owner (used to build API endpoints). */
export const GITHUB_OWNER = 'GiorgiBurjaliani';

/** GitHub repository name (used to build API endpoints). */
export const GITHUB_REPOSITORY = 'webfinalproject';

/** Base URL for the GitHub REST API. */
export const API_BASE_URL = 'https://api.github.com';

/** Full issues endpoint for the project repository. */
export const ISSUES_ENDPOINT = `${API_BASE_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/issues`;

/** How many opportunities to load per page. */
export const PAGE_SIZE = 12;

/** Recommended Accept header for GitHub API v3. */
export const GITHUB_ACCEPT_HEADER = 'application/vnd.github+json';

// ---------------------------------------------------------------------------
// localStorage key constants
// ---------------------------------------------------------------------------

export const STORAGE_KEYS = {
  /** Array of saved opportunity objects. */
  SAVED: 'opportunityhub_saved',

  /** Object mapping opportunity ID → application status string. */
  STATUSES: 'opportunityhub_statuses',

  /** Object storing last-used filter values. */
  LAST_FILTERS: 'opportunityhub_last_filters',

  /** Object storing in-progress suggestion form draft. */
  SUGGESTION_DRAFT: 'opportunityhub_suggestion_draft',

  /** Array of submitted suggestion objects. */
  SUBMITTED_SUGGESTIONS: 'opportunityhub_submitted_suggestions',

  /** Cached API response to reduce rate-limit pressure. */
  API_CACHE: 'opportunityhub_api_cache',
};

/** How long (ms) to consider the API cache valid before re-fetching. */
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
