/**
 * main.js
 * Entry point for index.html — Opportunity Discovery page.
 * Coordinates API, filters, sorting, pagination, and dynamic card rendering.
 * Uses a debounced search input to optimize performance.
 */


import { fetchOpportunities } from './api.js';
import { renderOpportunityGrid, showLoading, showEmptyState, showStatusMessage, clearStatusMessage } from './ui.js';
import { saveOpportunity, removeSavedOpportunity, isOpportunitySaved, saveLastFilters, getLastFilters } from './storage.js';
import { createDebounce, normalizeText, compareDeadlinesAsc, compareDeadlinesDesc } from './utils.js';
import { DEMO_OPPORTUNITIES } from './config.js';


// ---------------------------------------------------------------------------
// Application State
// ---------------------------------------------------------------------------

/**
 * Central state object for the discovery page.
 * Must not contain DOM elements.
 */
const state = {
  /** All opportunities fetched from the API across all pages. */
  opportunities: [],

  /** Opportunities after applying current filters and sort. */
  filteredOpportunities: [],

  /** Current active filter values. */
  filters: {
    search: '',
    category: 'all',
    format: 'all',
    funding: 'all',
    region: 'all',
    datatype: 'all',
    sort: 'deadline-asc',
  },

  /** Current API page number (1-based). */
  currentPage: 1,

  /** Whether a fetch is currently in progress. */
  isLoading: false,

  /** Whether more results may be available from the API. */
  hasMore: true,
};

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const grid          = document.getElementById('opportunity-grid');
const statusMsg     = document.getElementById('status-message');
const demoDataNotice = document.getElementById('demo-data-notice');
const loadMoreBtn   = document.getElementById('load-more-btn');
const loadMoreWrap  = document.getElementById('load-more-container');
const searchInput   = document.getElementById('search-input');
const categorySelect = document.getElementById('category-select');
const formatSelect  = document.getElementById('format-select');
const fundingSelect = document.getElementById('funding-select');
const regionSelect  = document.getElementById('region-select');
const datatypeSelect = document.getElementById('datatype-select');
const sortSelect    = document.getElementById('sort-select');
const resetBtn      = document.getElementById('reset-filters-btn');

// ---------------------------------------------------------------------------
// Filter & Sort logic
// ---------------------------------------------------------------------------

/**
 * Applies current state.filters to state.opportunities,
 * writes the result to state.filteredOpportunities.
 */
function tieBreaker(a, b) {
  const aScore = a.isVerified ? 2 : (a.isDemo ? 0 : 1);
  const bScore = b.isVerified ? 2 : (b.isDemo ? 0 : 1);
  return bScore - aScore;
}

function applyFilters() {
  const { search, category, format, funding, region, datatype, sort } = state.filters;
  const searchTerm = normalizeText(search);

  let result = state.opportunities.filter((opp) => {
    // Search: match against title, organizer, summary, description
    if (searchTerm.length >= 2) {
      const haystack = normalizeText(
        `${opp.title} ${opp.organizer} ${opp.summary} ${opp.description}`
      );
      if (!haystack.includes(searchTerm)) return false;
    }

    // Category filter
    if (category !== 'all' && opp.category !== category) return false;

    // Format filter
    if (format !== 'all' && opp.format !== format) return false;

    // Funding filter
    if (funding !== 'all' && opp.funding !== funding) return false;

    // Region filter
    if (region !== 'all' && opp.region !== region) return false;

    // Datatype filter
    if (datatype !== 'all') {
      if (datatype === 'verified' && !opp.isVerified) return false;
      if (datatype === 'demo' && !opp.isDemo) return false;
    }

    return true;
  });

  // Sort
  switch (sort) {
    case 'deadline-asc':
      result = result.slice().sort((a, b) => {
        const diff = compareDeadlinesAsc(a, b);
        if (diff !== 0) return diff;
        return tieBreaker(a, b);
      });
      break;
    case 'deadline-desc':
      result = result.slice().sort((a, b) => {
        const diff = compareDeadlinesDesc(a, b);
        if (diff !== 0) return diff;
        return tieBreaker(a, b);
      });
      break;
    case 'recent':
      result = result.slice().sort((a, b) => {
        const diff = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        if (diff !== 0) return diff;
        return tieBreaker(a, b);
      });
      break;
    case 'title-asc':
      result = result.slice().sort((a, b) => {
        const diff = a.title.localeCompare(b.title);
        if (diff !== 0) return diff;
        return tieBreaker(a, b);
      });
      break;
    default:
      result = result.slice().sort(tieBreaker);
      break;
  }

  state.filteredOpportunities = result;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * Clears the grid and renders filteredOpportunities.
 * Called after every filter/sort change.
 */
function renderGrid() {
  if (!grid) return;

  // Toggle global demo notice visibility based on loaded opportunities
  if (demoDataNotice) {
    const hasDemo = state.opportunities.some((opp) => opp.isDemo);
    demoDataNotice.hidden = !hasDemo;
  }

  grid.textContent = '';

  if (state.filteredOpportunities.length === 0) {
    if (state.opportunities.length === 0) {
      showEmptyState(
        grid,
        'No opportunities yet',
        'No open opportunities are available right now. Check back soon, or suggest one using the Suggest page.'
      );
      
      const emptyDiv = grid.querySelector('.empty-state');
      if (emptyDiv) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn--primary';
        btn.style.marginTop = '1.5rem';
        btn.textContent = 'Load Demo Opportunities (Testing)';
        btn.addEventListener('click', () => {
          state.opportunities = [...DEMO_OPPORTUNITIES];
          applyFilters();
          renderGrid();
        });
        emptyDiv.appendChild(btn);
      }
    } else {
      showEmptyState(
        grid,
        'No results match your filters',
        'Try broadening your search or resetting the filters.'
      );
    }
    return;
  }


  renderOpportunityGrid(grid, state.filteredOpportunities, handleSaveToggle);
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

/**
 * Fetches the next page of opportunities from the API and appends them to state.
 * Shows loading/error states appropriately.
 */
async function loadOpportunities() {
  if (state.isLoading) return;
  state.isLoading = true;

  clearStatusMessage(statusMsg);

  if (state.currentPage === 1) {
    grid.textContent = '';
    showLoading(grid);
  } else {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading…';
  }

  try {
    const { opportunities, hasMore } = await fetchOpportunities(state.currentPage);

    // De-duplicate by ID before appending (prevents Load More duplicates)
    const existingIds = new Set(state.opportunities.map((o) => o.id));
    const newOpps = opportunities.filter((o) => !existingIds.has(o.id));

    state.opportunities = [...state.opportunities, ...newOpps];
    state.hasMore = hasMore;
    state.currentPage += 1;

    applyFilters();
    renderGrid();

    // Show/hide Load More button
    if (state.hasMore) {
      loadMoreWrap.hidden = false;
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Load more opportunities';
    } else {
      loadMoreWrap.hidden = true;
    }

    // If the API returned items but filters reduced them to 0, still inform user
    if (state.opportunities.length === 0) {
      showStatusMessage(statusMsg, 'No open opportunities found in this repository. You can add demo opportunities via GitHub Issues — see DATA_SETUP.md.', 'info');
    }

  } catch (error) {
    grid.textContent = '';
    showEmptyState(
      grid,
      'Could not load opportunities',
      error.message
    );
    showStatusMessage(statusMsg, error.message, 'error');

    // Re-enable Load More so user can retry
    if (state.currentPage > 1) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Retry';
    }
  } finally {
    state.isLoading = false;
  }
}

// ---------------------------------------------------------------------------
// Save/Remove toggle
// ---------------------------------------------------------------------------

/**
 * Handles the Save / Remove Saved button click on any opportunity card.
 *
 * @param {object} opportunity - Normalized opportunity object.
 */
function handleSaveToggle(opportunity) {
  if (isOpportunitySaved(opportunity.id)) {
    removeSavedOpportunity(opportunity.id);
    showStatusMessage(statusMsg, `"${opportunity.title}" removed from saved.`, 'info');
  } else {
    const saved = saveOpportunity(opportunity);
    if (saved) {
      showStatusMessage(statusMsg, `"${opportunity.title}" saved!`, 'success');
    }
  }

  // Auto-hide message after 3 seconds
  setTimeout(() => clearStatusMessage(statusMsg), 3000);
}

// ---------------------------------------------------------------------------
// Filter change handlers (each has one clear responsibility)
// ---------------------------------------------------------------------------

/**
 * Reads all filter select values into state.filters and re-renders.
 * Called on every filter change event.
 */
function handleFilterChange() {
  state.filters.category = categorySelect ? categorySelect.value : 'all';
  state.filters.format   = formatSelect   ? formatSelect.value   : 'all';
  state.filters.funding  = fundingSelect  ? fundingSelect.value  : 'all';
  state.filters.region   = regionSelect   ? regionSelect.value   : 'all';
  state.filters.datatype = datatypeSelect ? datatypeSelect.value : 'all';
  state.filters.sort     = sortSelect     ? sortSelect.value     : 'deadline-asc';

  applyFilters();
  renderGrid();
  saveLastFilters(state.filters);
}

/**
 * Handles search input changes — debounced to avoid re-filtering on every keystroke.
 * This is the inner function returned by createDebounce().
 */
const handleSearchInput = createDebounce((event) => {
  state.filters.search = event.target ? event.target.value : '';
  applyFilters();
  renderGrid();
  saveLastFilters(state.filters);
}, 350);

/**
 * Resets all filters to default values and re-renders.
 */
function handleResetFilters() {
  state.filters = {
    search:   '',
    category: 'all',
    format:   'all',
    funding:  'all',
    region:   'all',
    datatype: 'all',
    sort:     'deadline-asc',
  };

  if (searchInput)   searchInput.value   = '';
  if (categorySelect) categorySelect.value = 'all';
  if (formatSelect)   formatSelect.value  = 'all';
  if (fundingSelect)  fundingSelect.value = 'all';
  if (regionSelect)   regionSelect.value  = 'all';
  if (datatypeSelect) datatypeSelect.value = 'all';
  if (sortSelect)     sortSelect.value    = 'deadline-asc';

  applyFilters();
  renderGrid();
  saveLastFilters(state.filters);
}

/**
 * Handles the Load More button click — loads the next API page.
 */
function handleLoadMore() {
  if (!state.hasMore || state.isLoading) return;
  loadOpportunities();
}

// ---------------------------------------------------------------------------
// Restore last-used filters from localStorage
// ---------------------------------------------------------------------------

/**
 * Restores filter select elements and state.filters from the last saved session.
 */
function restoreLastFilters() {
  const saved = getLastFilters();
  if (!saved || typeof saved !== 'object') return;

  if (saved.search   && searchInput)    { searchInput.value    = saved.search;   state.filters.search   = saved.search;   }
  if (saved.category && categorySelect) { categorySelect.value = saved.category; state.filters.category = saved.category; }
  if (saved.format   && formatSelect)   { formatSelect.value   = saved.format;   state.filters.format   = saved.format;   }
  if (saved.funding  && fundingSelect)  { fundingSelect.value  = saved.funding;  state.filters.funding  = saved.funding;  }
  if (saved.region   && regionSelect)   { regionSelect.value   = saved.region;   state.filters.region   = saved.region;   }
  if (saved.datatype && datatypeSelect) { datatypeSelect.value = saved.datatype; state.filters.datatype = saved.datatype; }
  if (saved.sort     && sortSelect)     { sortSelect.value     = saved.sort;     state.filters.sort     = saved.sort;     }
}

// ---------------------------------------------------------------------------
// Event listener registration
// ---------------------------------------------------------------------------

function registerEventListeners() {
  if (searchInput)    searchInput.addEventListener('input', handleSearchInput);
  if (categorySelect) categorySelect.addEventListener('change', handleFilterChange);
  if (formatSelect)   formatSelect.addEventListener('change', handleFilterChange);
  if (fundingSelect)  fundingSelect.addEventListener('change', handleFilterChange);
  if (regionSelect)   regionSelect.addEventListener('change', handleFilterChange);
  if (datatypeSelect) datatypeSelect.addEventListener('change', handleFilterChange);
  if (sortSelect)     sortSelect.addEventListener('change', handleFilterChange);
  if (resetBtn)       resetBtn.addEventListener('click', handleResetFilters);
  if (loadMoreBtn)    loadMoreBtn.addEventListener('click', handleLoadMore);
}

// ---------------------------------------------------------------------------
// Page initialization
// ---------------------------------------------------------------------------

function init() {
  restoreLastFilters();
  registerEventListeners();
  loadOpportunities();
}

init();
