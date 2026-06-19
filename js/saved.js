import {
  getSavedOpportunities,
  removeSavedOpportunity,
  clearSavedOpportunities,
  getStatusForOpportunity,
  updateOpportunityStatus,
} from './storage.js';
import { formatDate, getDeadlineStatus, categoryLabel, fundingLabel, formatLabel, compareDeadlinesAsc, compareDeadlinesDesc } from './utils.js';
import { showStatusMessage, clearStatusMessage } from './ui.js';
import { checkAuth } from './auth.js';

// These are the statuses the user can choose for a saved opportunity.
const APPLICATION_STATUSES = [
  { value: 'interested',        label: 'Interested' },
  { value: 'planning-to-apply', label: 'Planning to Apply' },
  { value: 'applied',           label: 'Applied' },
  { value: 'accepted',          label: 'Accepted' },
  { value: 'not-selected',      label: 'Not Selected' },
  { value: 'completed',         label: 'Completed' },
];

const savedGrid    = document.getElementById('saved-grid');
const savedEmpty   = document.getElementById('saved-empty');
const savedCount   = document.getElementById('saved-count');
const savedStatus  = document.getElementById('saved-status');
const clearAllBtn  = document.getElementById('clear-all-btn');
const sortSelect   = document.getElementById('saved-sort-select');

// Shows how many opportunities are currently saved.
function updateSavedCount() {
  const count = getSavedOpportunities().length;
  if (savedCount) savedCount.textContent = count;
}

// Builds one card for the Saved page.
function createSavedCard(opp) {
  const currentStatus = getStatusForOpportunity(opp.id);

  const article = document.createElement('article');
  article.className = `saved-card status--${currentStatus}`;
  article.setAttribute('data-id', opp.id);

  // Category and data type badges are similar to the home page cards.
  const catBadge = document.createElement('span');
  catBadge.className = `opportunity-card__category opportunity-card__category--${opp.category}`;
  catBadge.textContent = opp.categoryLabel || categoryLabel(opp.category);

  let badgeEl = null;
  if (opp.isVerified) {
    badgeEl = document.createElement('span');
    badgeEl.className = 'badge badge--verified';
    badgeEl.textContent = 'Verified Opportunity';
    badgeEl.classList.add('badge--spaced');
  } else if (opp.isDemo) {
    badgeEl = document.createElement('span');
    badgeEl.className = 'badge badge--demo';
    badgeEl.textContent = 'Demo Opportunity';
    badgeEl.classList.add('badge--spaced');
  }

  const titleEl = document.createElement('h2');
  titleEl.className = 'saved-card__title';
  const titleLink = document.createElement('a');
  titleLink.href = `details.html?number=${opp.id}`;
  titleLink.className = 'saved-card__title-link';
  titleLink.textContent = opp.title;
  titleEl.appendChild(titleLink);

  const organizerEl = document.createElement('p');
  organizerEl.className = 'saved-card__organizer';
  organizerEl.textContent = opp.organizer;

  const metaEl = document.createElement('ul');
  metaEl.className = 'opportunity-card__meta';
  metaEl.setAttribute('aria-label', 'Opportunity details');

  const addMeta = (label, value) => {
    const li = document.createElement('li');
    li.className = 'opportunity-card__meta-item';
    const lbl = document.createElement('span');
    lbl.className = 'opportunity-card__meta-label';
    lbl.textContent = label + ': ';
    const val = document.createElement('span');
    val.className = 'opportunity-card__meta-value';
    val.textContent = value || 'Not specified';
    li.appendChild(lbl);
    li.appendChild(val);
    metaEl.appendChild(li);
  };

  addMeta('Format', formatLabel(opp.format));
  addMeta('Funding', fundingLabel(opp.funding));

  // Deadline with a small status badge.
  const deadlineRow = document.createElement('div');
  deadlineRow.className = 'opportunity-card__deadline-row';
  const dlLabel = document.createElement('span');
  dlLabel.className = 'opportunity-card__deadline-label';
  dlLabel.textContent = 'Deadline: ';
  const dlDate = document.createElement('span');
  dlDate.className = 'opportunity-card__deadline-date';
  dlDate.textContent = opp.deadline ? formatDate(opp.deadline) : 'No deadline listed';
  const { key, label } = getDeadlineStatus(opp.deadline);
  const dlBadge = document.createElement('span');
  dlBadge.className = `deadline-badge deadline-badge--${key}`;
  dlBadge.textContent = label;
  deadlineRow.appendChild(dlLabel);
  deadlineRow.appendChild(dlDate);
  deadlineRow.appendChild(dlBadge);

  // Dropdown where the user tracks their application progress.
  const statusWrap = document.createElement('div');
  statusWrap.className = 'saved-card__status-wrap';
  const statusLabel = document.createElement('label');
  statusLabel.className = 'saved-card__status-label';
  statusLabel.textContent = 'Application status: ';
  const statusId = `status-select-${opp.id}`;
  statusLabel.setAttribute('for', statusId);

  const statusSelect = document.createElement('select');
  statusSelect.id = statusId;
  statusSelect.className = 'saved-card__status-select';
  statusSelect.setAttribute('aria-label', `Application status for ${opp.title}`);

  for (const opt of APPLICATION_STATUSES) {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === currentStatus) option.selected = true;
    statusSelect.appendChild(option);
  }

  statusSelect.addEventListener('change', () => handleStatusChange(opp.id, statusSelect.value, article));

  statusWrap.appendChild(statusLabel);
  statusWrap.appendChild(statusSelect);

  // Main actions for the saved item.
  const actions = document.createElement('div');
  actions.className = 'opportunity-card__actions';

  const detailsLink = document.createElement('a');
  detailsLink.href = `details.html?number=${opp.id}`;
  detailsLink.className = 'btn btn--primary btn--sm';
  detailsLink.textContent = 'View Details';
  detailsLink.setAttribute('aria-label', `View details for ${opp.title}`);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn--danger btn--sm';
  removeBtn.textContent = 'Remove';
  removeBtn.setAttribute('aria-label', `Remove ${opp.title} from saved`);
  removeBtn.addEventListener('click', () => handleRemoveSaved(opp.id, opp.title));

  actions.appendChild(detailsLink);
  actions.appendChild(removeBtn);

  // Put the saved card together.
  article.appendChild(catBadge);
  if (badgeEl) {
    article.appendChild(badgeEl);
  }
  article.appendChild(titleEl);
  article.appendChild(organizerEl);
  article.appendChild(metaEl);
  article.appendChild(deadlineRow);
  article.appendChild(statusWrap);
  article.appendChild(actions);

  return article;
}

// Reads saved opportunities and shows them in the grid.
function renderSavedOpportunities() {
  if (!savedGrid) return;
  savedGrid.textContent = '';

  let opportunities = getSavedOpportunities();

  if (opportunities.length === 0) {
    if (savedEmpty) savedEmpty.hidden = false;
    if (clearAllBtn) clearAllBtn.disabled = true;
    updateSavedCount();
    return;
  }

  if (savedEmpty) savedEmpty.hidden = true;
  if (clearAllBtn) clearAllBtn.disabled = false;

  // Apply the selected sort option.
  const sortValue = sortSelect ? sortSelect.value : 'deadline-asc';
  switch (sortValue) {
    case 'deadline-asc':
      opportunities = opportunities.slice().sort(compareDeadlinesAsc);
      break;
    case 'deadline-desc':
      opportunities = opportunities.slice().sort(compareDeadlinesDesc);
      break;
    case 'title-asc':
      opportunities = opportunities.slice().sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'saved-order':
    default:
      break;
  }

  const fragment = document.createDocumentFragment();
  for (const opp of opportunities) {
    try {
      fragment.appendChild(createSavedCard(opp));
    } catch {
      // If one saved item is broken, still show the others.
    }
  }
  savedGrid.appendChild(fragment);
  updateSavedCount();
}

// Saves the new status and updates the card color right away.
function handleStatusChange(id, status, cardEl) {
  updateOpportunityStatus(id, status);

  if (cardEl) {
    // Remove the old status class before adding the new one.
    cardEl.className = cardEl.className.replace(/status--\S+/g, '').trim();
    cardEl.classList.add(`status--${status}`);
  }

  showStatusMessage(savedStatus, `Status updated to "${APPLICATION_STATUSES.find(s => s.value === status)?.label || status}".`, 'success');
  setTimeout(() => clearStatusMessage(savedStatus), 2500);
}

// Removes one opportunity from the saved list.
function handleRemoveSaved(id, title) {
  removeSavedOpportunity(id);

  // Remove the card from the page without refreshing.
  const cardEl = savedGrid.querySelector(`[data-id="${id}"]`);
  if (cardEl) cardEl.remove();

  updateSavedCount();

  // If nothing is left, show the empty message.
  const remaining = getSavedOpportunities();
  if (remaining.length === 0) {
    if (savedEmpty) savedEmpty.hidden = false;
    if (clearAllBtn) clearAllBtn.disabled = true;
  }

  showStatusMessage(savedStatus, `"${title}" removed from saved.`, 'info');
  setTimeout(() => clearStatusMessage(savedStatus), 2500);
}

// Clears everything after the browser confirmation.
function handleClearAll() {
  const cleared = clearSavedOpportunities();
  if (!cleared) return;
  renderSavedOpportunities();
  showStatusMessage(savedStatus, 'All saved opportunities have been cleared.', 'info');
  setTimeout(() => clearStatusMessage(savedStatus), 3000);
}

// Re-render when the saved sort option changes.
function handleSortChange() {
  renderSavedOpportunities();
}

function registerEventListeners() {
  if (clearAllBtn) clearAllBtn.addEventListener('click', handleClearAll);
  if (sortSelect)  sortSelect.addEventListener('change', handleSortChange);
}

// Starts the saved page.
function init() {
  checkAuth();
  registerEventListeners();
  renderSavedOpportunities();
}

init();
