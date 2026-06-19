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

// ---------------------------------------------------------------------------
// Demo data for fallback/testing when GitHub issues list is empty
// ---------------------------------------------------------------------------

export const DEMO_OPPORTUNITIES = [
  {
    id: 1001,
    issueNumber: 1001,
    title: 'Tbilisi AI Student Hackathon 2025',
    organizer: 'Google Developer Group Tbilisi',
    category: 'hackathon',
    categoryLabel: 'Hackathon',
    format: 'hybrid',
    funding: 'free',
    region: 'georgia',
    location: 'Tbilisi, Georgia',
    deadline: '2025-10-15',
    deadlineRaw: '2025-10-15',
    startDate: '2025-11-01',
    endDate: '2025-11-03',
    eligibility: 'University students and high-school seniors',
    ageRequirement: '16 to 25 years old',
    experience: 'No prior experience required',
    officialUrl: 'https://example.com/gdg-hackathon-2025',
    imageUrl: '',
    summary: 'Join the largest student hackathon in the Caucasus region. Teams will have 48 hours to design and prototype web apps that solve community needs.',
    description: 'Join the largest student hackathon in the Caucasus region. Teams will have 48 hours to design, prototype, and pitch web applications that address community needs.\n\nMentorship is provided by industry experts.',
    benefits: 'Total prize pool of 10,000 GEL and internship offers.',
    labels: ['category:hackathon', 'format:hybrid', 'funding:free', 'region:georgia', 'data:demo'],
    publishedAt: new Date().toISOString(),
    isDemo: true,
  },
  {
    id: 1002,
    issueNumber: 1002,
    title: 'Europe Summer Technology Camp 2025',
    organizer: 'EU Commission for Youth & Tech',
    category: 'camp',
    categoryLabel: 'Technology Camp',
    format: 'in-person',
    funding: 'fully-funded',
    region: 'europe',
    location: 'Berlin, Germany',
    deadline: '2025-07-01',
    deadlineRaw: '2025-07-01',
    startDate: '2025-08-10',
    endDate: '2025-08-20',
    eligibility: 'Residents of EU and Eastern Partnership countries',
    ageRequirement: '18 to 30 years old',
    experience: 'Basic knowledge of any coding language',
    officialUrl: 'https://example.com/eu-summer-camp',
    imageUrl: '',
    summary: 'A 10-day immersive camp in Berlin focusing on cybersecurity, blockchain, and green tech. Travel and lodging are fully covered.',
    description: 'A 10-day immersive camp in Berlin focusing on cybersecurity, blockchain, and green tech. Participants will engage in workshops, network with European tech leaders, and build sustainable projects.',
    benefits: 'Fully covered flights, accommodation, meals, and participation certificate.',
    labels: ['category:camp', 'format:in-person', 'funding:fully-funded', 'region:europe', 'data:demo'],
    publishedAt: new Date().toISOString(),
    isDemo: true,
  },
  {
    id: 1003,
    issueNumber: 1003,
    title: 'Global Cyber Security Challenge',
    organizer: 'MIT Cybersecurity Lab',
    category: 'competition',
    categoryLabel: 'Competition',
    format: 'online',
    funding: 'free',
    region: 'worldwide',
    location: 'Online',
    deadline: '2025-09-30',
    deadlineRaw: '2025-09-30',
    startDate: '2025-10-10',
    endDate: '2025-10-12',
    eligibility: 'Anyone globally',
    ageRequirement: 'No limit',
    experience: 'Intermediate to advanced CTF experience recommended',
    officialUrl: 'https://example.com/mit-cyber-challenge',
    imageUrl: '',
    summary: 'An online capture-the-flag (CTF) competition. Compete individually or in teams of up to 4 to solve security puzzles and win cash prizes.',
    description: 'An online capture-the-flag (CTF) competition. Compete individually or in teams of up to 4 to solve security puzzles, cryptographic challenges, and reverse-engineering tasks.',
    benefits: '$15,000 prize pool, digital badges, and recruitment fast-track.',
    labels: ['category:competition', 'format:online', 'funding:free', 'region:worldwide', 'data:demo'],
    publishedAt: new Date().toISOString(),
    isDemo: true,
  },
  {
    id: 1004,
    issueNumber: 1004,
    title: 'Full-Stack Web Bootcamp 2025',
    organizer: 'Tech Academy Georgia',
    category: 'bootcamp',
    categoryLabel: 'Bootcamp',
    format: 'online',
    funding: 'paid',
    region: 'georgia',
    location: 'Tbilisi, Georgia / Online',
    deadline: '2025-11-15',
    deadlineRaw: '2025-11-15',
    startDate: '2026-01-10',
    endDate: '2026-06-15',
    eligibility: 'Georgian speakers looking to change careers',
    ageRequirement: '18+ years old',
    experience: 'None',
    officialUrl: 'https://example.com/tech-academy-bootcamp',
    imageUrl: '',
    summary: 'A comprehensive 6-month bootcamp covering HTML, CSS, JavaScript, React, Node.js, and SQL. Career mentoring and interview prep included.',
    description: 'A comprehensive 6-month bootcamp covering HTML, CSS, JavaScript, React, Node.js, and SQL. Features live online lectures, code reviews, and structured projects.',
    benefits: 'Job guarantee or money-back policy. Portfolio review and career consulting.',
    labels: ['category:bootcamp', 'format:online', 'funding:paid', 'region:georgia', 'data:demo'],
    publishedAt: new Date().toISOString(),
    isDemo: true,
  }
];

