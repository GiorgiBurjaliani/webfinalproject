import { normalizeText, categoryLabel, isPlaceholderUrl, isGeneralHomepageUrl } from './utils.js';

// Label and body parsing

function extractLabel(labels, prefix) {
  if (!Array.isArray(labels)) return null;
  const found = labels.find((lbl) => lbl.name && lbl.name.startsWith(prefix));
  if (!found) return null;
  return found.name.slice(prefix.length).trim() || null;
}

// Parses both bold fields and section headings from GitHub Issue bodies.
function parseBody(body) {
  const fields = {};
  if (!body || typeof body !== 'string') return fields;

  const lines = body.split('\n');
  let currentKey = null;
  let buffer = [];

  for (const line of lines) {
    // Supports both "**Key:** value" and "**Key**: value".
    const boldMatch = line.match(/^\*\*([^*]+?)\s*[:\-]?\*\*\s*[:\-]?\s*(.*)/);
    if (boldMatch) {
      if (currentKey && buffer.length > 0) {
        fields[currentKey] = buffer.join('\n').trim();
      }
      currentKey = normalizeFieldKey(boldMatch[1]);
      buffer = [boldMatch[2].trim()];
      continue;
    }

    const sectionMatch = line.match(/^###\s+(.*)/);
    if (sectionMatch) {
      if (currentKey && buffer.length > 0) {
        fields[currentKey] = buffer.join('\n').trim();
      }
      currentKey = normalizeFieldKey(sectionMatch[1]);
      buffer = [];
      continue;
    }

    const colonMatch = line.match(/^-?\s*([A-Za-z ]+):\s*(.*)/);
    if (colonMatch && !line.startsWith('http') && !line.startsWith('  ')) {
      if (currentKey && buffer.length > 0) {
        fields[currentKey] = buffer.join('\n').trim();
      }
      currentKey = normalizeFieldKey(colonMatch[1]);
      buffer = [colonMatch[2].trim()];
      continue;
    }

    if (currentKey && line.trim()) {
      buffer.push(line.trim());
    }
  }

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

// Lets the issue template use a few natural variations of the same field name.
function field(fields, aliases, fallback = 'Not specified') {
  for (const alias of aliases) {
    const val = fields[alias.toLowerCase()];
    if (val && val.trim() && val.trim() !== '_No response_' && val.trim() !== 'N/A') {
      return val.trim();
    }
  }
  return fallback;
}

// Opportunity normalizer

export function parseOpportunityIssue(issue) {
  if (issue.pull_request) return null;

  if (!issue.number) return null;

  let bodyFields = {};
  try {
    bodyFields = parseBody(issue.body);
  } catch {
    bodyFields = {};
  }

  const labels = Array.isArray(issue.labels) ? issue.labels : [];
  const rawCategory = extractLabel(labels, 'category:') || field(bodyFields, ['category', 'type'], '');
  const rawFormat   = extractLabel(labels, 'format:')   || field(bodyFields, ['format', 'event format'], '');
  const rawFunding  = extractLabel(labels, 'funding:')  || field(bodyFields, ['funding', 'funding type'], '');
  const rawRegion   = extractLabel(labels, 'region:')   || field(bodyFields, ['region'], '');

  const category = normalizeCategory(rawCategory);
  const format   = normalizeFormat(rawFormat);
  const funding  = normalizeFunding(rawFunding);
  const region   = normalizeRegion(rawRegion);

  const deadlineRaw = field(bodyFields, [
    'application deadline', 'deadline', 'apply by', 'applications close',
  ], '');

  const deadline = parseDateField(deadlineRaw);

  const imageUrlRaw = field(bodyFields, ['image url', 'image', 'banner', 'logo url'], '');
  const imageUrl = isValidUrl(imageUrlRaw) ? imageUrlRaw : '';

  const officialSourceUrlRaw = field(bodyFields, [
    'official source url', 'official source', 'source url', 'source', 'official source website'
  ], '');
  const officialSourceUrl = isValidUrl(officialSourceUrlRaw) ? officialSourceUrlRaw : '';

  const officialRegistrationUrlRaw = field(bodyFields, [
    'official registration url', 'official registration', 'registration url', 'registration', 'apply url', 'apply', 'official url', 'url', 'website', 'link'
  ], '');
  const officialRegistrationUrl = isValidUrl(officialRegistrationUrlRaw) ? officialRegistrationUrlRaw : '';

  const verifiedOn = field(bodyFields, ['verified on', 'verified date', 'verification date'], 'Not specified');

  const hasDemoLabel = labels.some((lbl) => lbl.name && lbl.name === 'data:demo');
  const isDemoUrl = isPlaceholderUrl(officialRegistrationUrl || officialSourceUrl);
  const isDemoType = field(bodyFields, ['data type', 'type'], '').toLowerCase().includes('demo');
  const isDemo = hasDemoLabel || isDemoUrl || isDemoType;

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

// Internal normalization helpers

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

function parseDateField(raw) {
  if (!raw || raw === 'Not specified') return '';

  const direct = new Date(raw);
  if (!isNaN(direct.getTime())) {
    return direct.toISOString().split('T')[0];
  }

  const written = new Date(raw.replace(/(\d+)(st|nd|rd|th)/, '$1'));
  if (!isNaN(written.getTime())) {
    return written.toISOString().split('T')[0];
  }

  return '';
}

function extractSummary(rawBody, fields) {
  const explicit = fields['summary'] || fields['short description'] || fields['short summary'];
  if (explicit && explicit.trim()) return explicit.trim().slice(0, 300);

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

function isValidUrl(str) {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('http://') || str.startsWith('https://');
}
