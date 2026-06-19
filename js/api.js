// This file keeps all GitHub API requests in one place.
// It also changes GitHub's raw issue data into opportunities for the app.

import { ISSUES_ENDPOINT, GITHUB_ACCEPT_HEADER, PAGE_SIZE } from './config.js';
import { parseOpportunityIssue } from './parser.js';
import { getApiCache, setApiCache } from './storage.js';

// Small helper for GitHub requests, so I do not repeat the same fetch code.
async function githubFetch(url) {
  let response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: GITHUB_ACCEPT_HEADER,
      },
    });
  } catch {
    // If fetch fails here, it usually means the internet connection is missing.
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

// Loads one page of GitHub issues and turns them into opportunity cards.
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

  // GitHub can return pull requests here too, so I only keep real issues.
  const opportunities = [];
  for (const issue of rawIssues) {
    try {
      const parsed = parseOpportunityIssue(issue);
      if (parsed !== null) {
        opportunities.push(parsed);
      }
    } catch {
      // If one issue has bad formatting, the rest of the page should still load.
    }
  }

  // If the page is full, there might be another page after this one.
  const hasMore = rawIssues.length === PAGE_SIZE;

  const result = { opportunities, hasMore };
  setApiCache(cacheKey, result);
  return result;
}

// Used on the details page when the user opens one opportunity.
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
