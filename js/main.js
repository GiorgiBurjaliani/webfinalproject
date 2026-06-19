// Main script for the home page.
// Here I load opportunities, filter them, sort them, and render the cards.

import { fetchOpportunities } from './api.js';
import { renderOpportunityGrid, showLoading, showEmptyState, showStatusMessage, clearStatusMessage } from './ui.js';
import { saveOpportunity, removeSavedOpportunity, isOpportunitySaved, saveLastFilters, getLastFilters } from './storage.js';
import { createDebounce, normalizeText, compareDeadlinesAsc, compareDeadlinesDesc } from './utils.js';
import { DEMO_OPPORTUNITIES } from './config.js';
import { checkAuth } from './auth.js';

// Application state

// I keep the current page data here so the filters and rendering can use it.
const state = {
  // All opportunities loaded so far.
  opportunities: [],

  // Same data after search, filters, and sorting.
  filteredOpportunities: [],

  // Default filter values.
  filters: {
    search: '',
    category: 'all',
    format: 'all',
    funding: 'all',
    region: 'all',
    datatype: 'all',
    sort: 'deadline-asc',
  },

  // GitHub pages start from 1.
  currentPage: 1,

  // This stops the app from starting two loads at the same time.
  isLoading: false,

  // Used to decide if the Load More button should show.
  hasMore: true,
};

// DOM references

// Main elements from the page.
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

// Filter and sort

// Verified opportunities are shown first when other sorting values are equal.
function tieBreaker(a, b) {
  const aScore = a.isVerified ? 2 : (a.isDemo ? 0 : 1);
  const bScore = b.isVerified ? 2 : (b.isDemo ? 0 : 1);
  return bScore - aScore;
}

function applyFilters() {
  const { search, category, format, funding, region, datatype, sort } = state.filters;
  const searchTerm = normalizeText(search);

  let result = state.opportunities.filter((opp) => {
    // Search checks the main text fields of an opportunity.
    if (searchTerm.length >= 2) {
      const haystack = normalizeText(
        `${opp.title} ${opp.organizer} ${opp.summary} ${opp.description}`
      );
      if (!haystack.includes(searchTerm)) return false;
    }

    // Each dropdown removes items that do not match the selected value.
    if (category !== 'all' && opp.category !== category) return false;
    if (format !== 'all' && opp.format !== format) return false;
    if (funding !== 'all' && opp.funding !== funding) return false;
    if (region !== 'all' && opp.region !== region) return false;

    // This one separates verified, demo, and GitHub issue data.
    if (datatype !== 'all') {
      if (datatype === 'verified' && !opp.isVerified) return false;
      if (datatype === 'demo' && !opp.isDemo) return false;
    }

    return true;
  });

  // Sort changes the order but not the actual saved data.
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

// Render

// Redraws the cards after loading, filtering, or sorting.
function renderGrid() {
  if (!grid) return;

  // Show the demo notice only when demo data is actually visible in the app.
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
        btn.className = 'btn btn--primary empty-state__action';
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

// Data loading

// Loads the next group of opportunities from GitHub.
async function loadOpportunities() {
  if (state.isLoading) return;
  state.isLoading = true;

  clearStatusMessage(statusMsg);

  if (state.currentPage === 1) {
    grid.textContent = '';
    showLoading(grid);
  } else {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading...';
  }

  try {
    const { opportunities, hasMore } = await fetchOpportunities(state.currentPage);

    // Avoid adding the same card twice after pressing Load More.
    const existingIds = new Set(state.opportunities.map((o) => o.id));
    const newOpps = opportunities.filter((o) => !existingIds.has(o.id));

    state.opportunities = [...state.opportunities, ...newOpps];
    state.hasMore = hasMore;
    state.currentPage += 1;

    applyFilters();
    renderGrid();

    // If there are more GitHub results, keep the Load More button.
    if (state.hasMore) {
      loadMoreWrap.hidden = false;
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Load more opportunities';
    } else {
      loadMoreWrap.hidden = true;
    }

    // If nothing loaded at all, tell the user what happened.
    if (state.opportunities.length === 0) {
      showStatusMessage(statusMsg, 'No open opportunities found in this repository. You can add demo opportunities via GitHub Issues - see DATA_SETUP.md.', 'info');
    }

  } catch (error) {
    grid.textContent = '';
    showEmptyState(
      grid,
      'Could not load opportunities',
      error.message
    );
    showStatusMessage(statusMsg, error.message, 'error');

    // Let the user try again if loading failed on a later page.
    if (state.currentPage > 1) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Retry';
    }
  } finally {
    state.isLoading = false;
  }
}

// Save button

// Saves or removes one opportunity when the card button is clicked.
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

  // Hide the small message after a few seconds.
  setTimeout(() => clearStatusMessage(statusMsg), 3000);
}

// Filter controls

// Reads the current dropdown values and applies them.
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

// Debounce means the search waits a little while the user is typing.
const handleSearchInput = createDebounce((event) => {
  state.filters.search = event.target ? event.target.value : '';
  applyFilters();
  renderGrid();
  saveLastFilters(state.filters);
}, 350);

// Puts all filters back to their starting values.
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

// Loads another GitHub page when possible.
function handleLoadMore() {
  if (!state.hasMore || state.isLoading) return;
  loadOpportunities();
}

// Saved filter settings

// Brings back the user's last filter choices from localStorage.
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

// Register events and init

// Connects buttons and inputs to their functions.
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

// Starts the page after all functions are ready.
function init() {
  checkAuth();
  restoreLastFilters();
  registerEventListeners();
  loadOpportunities();
}

init();
