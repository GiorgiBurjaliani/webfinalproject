/**
 * parser.js
 * Transforms raw GitHub Issue objects into normalized opportunity objects.
 * Single responsibility: data shape normalization.
 */

import { normalizeText, categoryLabel, isPlaceholderUrl, isGeneralHomepageUrl } from './utils.js';

// ---------------------------------------------------------------------------
// Label parser
// ---------------------------------------------------------------------------

/**
 * Extracts a single value from an issue's labels that matches a given prefix.
 * Example: prefix "category:" → returns "hackathon" from "category:hackathon".
 *
 * @param {object[]} labels - Array of GitHub label objects.
 * @param {string} prefix
 * @returns {string|null}
 */
function extractLabel(labels, prefix) {
  if (!Array.isArray(labels)) return null;
  const found = labels.find((lbl) => lbl.name && lbl.name.startsWith(prefix));
  if (!found) return null;
  return found.name.slice(prefix.length).trim() || null;
}

// ---------------------------------------------------------------------------
// Body field parser
// ---------------------------------------------------------------------------

/**
 * Parses structured key:value fields from a GitHub Issue body.
 *
 * Expected body format (one field per line):
 *   **Organizer:** Tech Corp
 *   **Deadline:** 2025-08-31
 *   **URL:** https://example.com
 *
 * Also handles GitHub's form-template markdown (### Section / field answer).
 *
 * @param {string} body - Raw issue body markdown.
 * @returns {object} Map of field names (lowercase, trimmed) to string values.
 */
function parseBody(body) {
  const fields = {};
  if (!body || typeof body !== 'string') return fields;

  const lines = body.split('\n');
  let currentKey = null;
  let buffer = [];

  for (const line of lines) {
    // Match both "**Key:** value" and "**Key**: value" patterns.
    const boldMatch = line.match(/^\*\*([^*]+?)\s*[:\-]?\*\*\s*[:\-]?\s*(.*)/);
    if (boldMatch) {
      if (currentKey && buffer.length > 0) {
        fields[currentKey] = buffer.join('\n').trim();
      }
      currentKey = normalizeFieldKey(boldMatch[1]);
      buffer = [boldMatch[2].trim()];
      continue;
    }

    // Match "### Section heading" (GitHub issue form section headers)
    const sectionMatch = line.match(/^###\s+(.*)/);
    if (sectionMatch) {
      if (currentKey && buffer.length > 0) {
        fields[currentKey] = buffer.join('\n').trim();
      }
      currentKey = normalizeFieldKey(sectionMatch[1]);
      buffer = [];
      continue;
    }

    // Match "- field: value" or "field: value" patterns
    const colonMatch = line.match(/^-?\s*([A-Za-z ]+):\s*(.*)/);
    if (colonMatch && !line.startsWith('http') && !line.startsWith('  ')) {
      if (currentKey && buffer.length > 0) {
        fields[currentKey] = buffer.join('\n').trim();
      }
      currentKey = normalizeFieldKey(colonMatch[1]);
      buffer = [colonMatch[2].trim()];
      continue;
    }

    // Continuation of a multi-line field
    if (currentKey && line.trim()) {
      buffer.push(line.trim());
    }
  }

  // Flush last field
  if (currentKey && buffer.length > 0) {
    fields[currentKey] = buffer.join('\n').trim();
  }

  return fields;
}

function normalizeFieldKey(key) {
  return String(key || '')
    .trim()
    .replace(/[:\-]+$/, '')
    .trim()
    .toLowerCase();
}

/**
 * Returns the first non-empty, non-placeholder value from a list of candidate
 * field name aliases (to handle slight variations in Issue formatting).
 *
 * @param {object} fields
 * @param {string[]} aliases
 * @param {string} fallback
 * @returns {string}
 */
function field(fields, aliases, fallback = 'Not specified') {
  for (const alias of aliases) {
    const val = fields[alias.toLowerCase()];
    if (val && val.trim() && val.trim() !== '_No response_' && val.trim() !== 'N/A') {
      return val.trim();
    }
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Opportunity normalizer
// ---------------------------------------------------------------------------

/**
 * Transforms a raw GitHub Issue object into a normalized opportunity object.
 *
 * This is the single entry point for all Issue→Opportunity conversion.
 * Handles missing or malformed fields gracefully — a bad field produces a
 * safe fallback instead of crashing the application.
 *
 * @param {object} issue - Raw GitHub Issues API response object.
 * @returns {object|null} Normalized opportunity object, or null if the issue
 *   should be skipped (e.g. it is a Pull Request).
 */
export function parseOpportunityIssue(issue) {
  // Guard: GitHub Issues endpoints also return Pull Requests.
  // Any issue that has a pull_request property must be excluded.
  if (issue.pull_request) return null;

  // Guard: skip issues without a number (should not happen in practice).
  if (!issue.number) return null;

  let bodyFields = {};
  try {
    bodyFields = parseBody(issue.body);
  } catch {
    // If body parsing fails entirely, continue with empty fields.
    bodyFields = {};
  }

  // Extract labels for category, format, funding, and region.
  const labels = Array.isArray(issue.labels) ? issue.labels : [];
  const rawCategory = extractLabel(labels, 'category:') || field(bodyFields, ['category', 'type'], '');
  const rawFormat   = extractLabel(labels, 'format:')   || field(bodyFields, ['format', 'event format'], '');
  const rawFunding  = extractLabel(labels, 'funding:')  || field(bodyFields, ['funding', 'funding type'], '');
  const rawRegion   = extractLabel(labels, 'region:')   || field(bodyFields, ['region'], '');

  // Normalize category: map "camp" and "technology camp" → "camp", etc.
  const category = normalizeCategory(rawCategory);
  const format   = normalizeFormat(rawFormat);
  const funding  = normalizeFunding(rawFunding);
  const region   = normalizeRegion(rawRegion);

  // Extract deadline — look for various field name variants.
  const deadlineRaw = field(bodyFields, [
    'application deadline', 'deadline', 'apply by', 'applications close',
  ], '');

  const deadline = parseDateField(deadlineRaw);

  // Extract image URL — validate it looks like a URL.
  const imageUrlRaw = field(bodyFields, ['image url', 'image', 'banner', 'logo url'], '');
  const imageUrl = isValidUrl(imageUrlRaw) ? imageUrlRaw : '';

  // Extract official source URL
  const officialSourceUrlRaw = field(bodyFields, [
    'official source url', 'official source', 'source url', 'source', 'official source website'
  ], '');
  const officialSourceUrl = isValidUrl(officialSourceUrlRaw) ? officialSourceUrlRaw : '';

  // Extract official registration URL
  const officialRegistrationUrlRaw = field(bodyFields, [
    'official registration url', 'official registration', 'registration url', 'registration', 'apply url', 'apply', 'official url', 'url', 'website', 'link'
  ], '');
  const officialRegistrationUrl = isValidUrl(officialRegistrationUrlRaw) ? officialRegistrationUrlRaw : '';

  const verifiedOn = field(bodyFields, ['verified on', 'verified date', 'verification date'], 'Not specified');

  // Detect if the opportunity is demo data
  const hasDemoLabel = labels.some((lbl) => lbl.name && lbl.name === 'data:demo');
  const isDemoUrl = isPlaceholderUrl(officialRegistrationUrl || officialSourceUrl);
  const isDemoType = field(bodyFields, ['data type', 'type'], '').toLowerCase().includes('demo');
  const isDemo = hasDemoLabel || isDemoUrl || isDemoType;

  // Detect if the opportunity is verified real data
  const hasVerifiedLabel = labels.some((lbl) => lbl.name && lbl.name === 'data:verified');
  const isVerified = hasVerifiedLabel &&
                     !!(officialSourceUrl && !isPlaceholderUrl(officialSourceUrl) && !isGeneralHomepageUrl(officialSourceUrl));

  const officialUrl = officialRegistrationUrl || officialSourceUrl;

  return {
    id: issue.number,
    issueNumber: issue.number,
    title: (issue.title || 'Untitled Opportunity').trim(),
    organizer: field(bodyFields, ['organizer', 'organization', 'hosted by', 'organizer / institution'], 'Unknown organizer'),
    category,
    categoryLabel: categoryLabel(category),
    format,
    funding,
    region,
    location: field(bodyFields, ['location', 'city', 'city / location', 'venue'], 'Not specified'),
    deadline,
    deadlineRaw,
    startDate: parseDateField(field(bodyFields, ['start date', 'starts', 'event start'], '')),
    endDate: parseDateField(field(bodyFields, ['end date', 'ends', 'event end'], '')),
    eligibility: field(bodyFields, ['eligibility', 'who can apply', 'eligible participants'], 'Not specified'),
    ageRequirement: field(bodyFields, ['age requirement', 'age', 'age limit', 'age restriction'], 'Not specified'),
    experience: field(bodyFields, ['experience', 'required experience', 'skill level', 'experience level'], 'Not specified'),
    officialUrl,
    officialRegistrationUrl,
    imageUrl,
    summary: extractSummary(issue.body, bodyFields),
    description: field(bodyFields, ['description', 'about', 'about this opportunity', 'details', 'overview'], 'See the official page for full details.'),
    benefits: field(bodyFields, ['benefits', 'prizes', 'benefits & prizes', 'what you get', 'rewards'], 'Not specified'),
    labels: labels.map((lbl) => lbl.name),
    issueUrl: issue.html_url || '',
    publishedAt: issue.created_at || '',
    isDemo,
    isVerified,
    officialSourceUrl,
    verifiedOn,
  };
}

// ---------------------------------------------------------------------------
// Internal normalization helpers
// ---------------------------------------------------------------------------

function normalizeCategory(raw) {
  const v = normalizeText(raw);
  if (!v) return 'other';
  if (v.includes('hackathon'))           return 'hackathon';
  if (v.includes('ai') && v.includes('camp')) return 'ai-camp';
  if (v.includes('camp'))               return 'camp';
  if (v.includes('competition'))        return 'competition';
  if (v.includes('startup'))            return 'startup-challenge';
  if (v.includes('bootcamp'))           return 'bootcamp';
  if (v.includes('workshop'))           return 'workshop';
  if (v.includes('conference'))         return 'conference';
  if (v.includes('youth'))              return 'youth-program';
  return v || 'other';
}

function normalizeFormat(raw) {
  const v = normalizeText(raw);
  if (!v) return 'not-specified';
  if (v.includes('hybrid'))             return 'hybrid';
  if (v.includes('in-person') || v.includes('in person') || v.includes('onsite')) return 'in-person';
  if (v.includes('online') || v.includes('remote') || v.includes('virtual'))      return 'online';
  return v || 'not-specified';
}

function normalizeFunding(raw) {
  const v = normalizeText(raw);
  if (!v) return 'not-specified';
  if (v.includes('fully'))              return 'fully-funded';
  if (v.includes('partial'))            return 'partially-funded';
  if (v.includes('paid'))               return 'paid';
  if (v.includes('free') || v.includes('no cost') || v.includes('complimentary')) return 'free';
  return v || 'not-specified';
}

function normalizeRegion(raw) {
  const v = normalizeText(raw);
  if (!v) return 'not-specified';
  if (v.includes('georgia'))            return 'georgia';
  if (v.includes('europe') || v.includes('eu')) return 'europe';
  if (v.includes('online') || v.includes('remote') || v.includes('virtual')) return 'online';
  if (v.includes('worldwide') || v.includes('global') || v.includes('international')) return 'worldwide';
  return v || 'not-specified';
}

/**
 * Attempts to parse a date string extracted from the issue body.
 * Returns an ISO date string (YYYY-MM-DD) or empty string if invalid.
 *
 * @param {string} raw
 * @returns {string}
 */
function parseDateField(raw) {
  if (!raw || raw === 'Not specified') return '';

  // Try direct Date parsing first
  const direct = new Date(raw);
  if (!isNaN(direct.getTime())) {
    return direct.toISOString().split('T')[0];
  }

  // Try common written formats: "31 July 2025", "July 31, 2025"
  const written = new Date(raw.replace(/(\d+)(st|nd|rd|th)/, '$1'));
  if (!isNaN(written.getTime())) {
    return written.toISOString().split('T')[0];
  }

  return '';
}

/**
 * Extracts a short summary from the issue body.
 * Prefers an explicit "summary" or "short description" field;
 * falls back to the first meaningful paragraph.
 *
 * @param {string} rawBody
 * @param {object} fields
 * @returns {string}
 */
function extractSummary(rawBody, fields) {
  const explicit = fields['summary'] || fields['short description'] || fields['short summary'];
  if (explicit && explicit.trim()) return explicit.trim().slice(0, 300);

  // Fall back: first non-empty, non-header line from the raw body
  if (!rawBody) return 'No description provided.';
  const lines = rawBody.split('\n');
  for (const line of lines) {
    const clean = line.replace(/^[#*\->\s]+/, '').trim();
    if (clean.length > 20 && !clean.startsWith('http') && !clean.includes(':')) {
      return clean.slice(0, 200);
    }
  }
  return 'See the official page for details.';
}

/**
 * Returns true if a string is a plausible HTTP/HTTPS URL.
 *
 * @param {string} str
 * @returns {boolean}
 */
function isValidUrl(str) {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('http://') || str.startsWith('https://');
}
