/**
 * api.js
 * GitHub REST API access layer for OpportunityHub.
 * Handles fetch, HTTP errors, rate-limit detection, and Pull Request filtering.
 */

import { ISSUES_ENDPOINT, GITHUB_ACCEPT_HEADER, PAGE_SIZE } from './config.js';
import { parseOpportunityIssue } from './parser.js';
import { getApiCache, setApiCache } from './storage.js';

// ---------------------------------------------------------------------------
// Internal fetch wrapper
// ---------------------------------------------------------------------------

/**
 * Performs a fetch request to the GitHub API with correct headers.
 * Converts non-OK HTTP responses to descriptive Error objects.
 *
 * @param {string} url - Full URL to fetch.
 * @returns {Promise<object|object[]>} Parsed JSON response.
 * @throws {Error} With a user-friendly message for common HTTP errors.
 */
async function githubFetch(url) {
  let response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: GITHUB_ACCEPT_HEADER,
      },
    });
  } catch (networkError) {
    // fetch() itself threw — network is unavailable.
    throw new Error(
      'Network error: unable to reach the GitHub API. Please check your internet connection.'
    );
  }

  if (!response.ok) {
    if (response.status === 403) {
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const reset = response.headers.get('X-RateLimit-Reset');
      if (remaining === '0' && reset) {
        const resetTime = new Date(Number(reset) * 1000).toLocaleTimeString();
        throw new Error(
          `GitHub API rate limit reached. Unauthenticated requests are limited to 60 per hour. Limit resets at ${resetTime}.`
        );
      }
      throw new Error('GitHub API returned 403 Forbidden. The repository may be private or the request was blocked.');
    }

    if (response.status === 404) {
      throw new Error('GitHub API returned 404 Not Found. The opportunity or repository does not exist.');
    }

    if (response.status === 429) {
      throw new Error('Too many requests to the GitHub API. Please wait a moment and try again.');
    }

    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error('GitHub API returned a response that could not be parsed as JSON.');
  }
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Fetches a page of open Issues from the repository and returns an array of
 * normalized opportunity objects.
 *
 * Pull Requests are automatically filtered out (GitHub Issues endpoints
 * return both Issues and Pull Requests; PRs have a `pull_request` property).
 *
 * Uses a short-lived localStorage cache to reduce rate-limit pressure.
 *
 * @param {number} page - Page number (1-based).
 * @returns {Promise<{ opportunities: object[], hasMore: boolean }>}
 */
export async function fetchOpportunities(page = 1) {
  const cacheKey = `page-${page}`;
  const cached = getApiCache(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `${ISSUES_ENDPOINT}?state=open&per_page=${PAGE_SIZE}&page=${page}&sort=created&direction=desc`;
  const rawIssues = await githubFetch(url);

  if (!Array.isArray(rawIssues)) {
    throw new Error('GitHub API returned an unexpected response format for issues.');
  }

  // Filter out Pull Requests and parse each Issue into a normalized object.
  const opportunities = [];
  for (const issue of rawIssues) {
    try {
      const parsed = parseOpportunityIssue(issue);
      if (parsed !== null) {
        opportunities.push(parsed);
      }
    } catch {
      // One malformed Issue must not crash the entire page load.
      // Skip it silently.
    }
  }

  // hasMore is true when the API returned a full page — there may be more.
  const hasMore = rawIssues.length === PAGE_SIZE;

  const result = { opportunities, hasMore };
  setApiCache(cacheKey, result);
  return result;
}

/**
 * Fetches a single Issue by number and returns a normalized opportunity object.
 *
 * @param {number|string} issueNumber
 * @returns {Promise<object>} Normalized opportunity object.
 * @throws {Error} If the issue is not found, is a PR, or data is malformed.
 */
export async function fetchOpportunityByNumber(issueNumber) {
  const num = parseInt(issueNumber, 10);
  if (!num || num < 1) {
    throw new Error('Invalid opportunity number. Please go back and select a valid opportunity.');
  }

  const url = `${ISSUES_ENDPOINT}/${num}`;
  const rawIssue = await githubFetch(url);

  if (rawIssue.pull_request) {
    throw new Error('This item is a Pull Request, not an opportunity.');
  }

  const opportunity = parseOpportunityIssue(rawIssue);
  if (!opportunity) {
    throw new Error('The opportunity data could not be read. The issue may be malformed.');
  }

  return opportunity;
}
