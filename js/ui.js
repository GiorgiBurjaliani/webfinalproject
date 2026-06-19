/**
 * ui.js
 * DOM-creation functions for OpportunityHub.
 * Every function creates elements with document.createElement — no innerHTML
 * is used for untrusted API content.
 */

import {
  formatDate,
  getDeadlineStatus,
  truncate,
  categoryLabel,
  fundingLabel,
  formatLabel,
  isPlaceholderUrl,
} from './utils.js';
import { isOpportunitySaved } from './storage.js';

// ---------------------------------------------------------------------------
// Status / feedback elements
// ---------------------------------------------------------------------------

/**
 * Shows a status message in a given container element.
 *
 * @param {HTMLElement} container - Element with role="status" and aria-live.
 * @param {string} text           - Message text to display.
 * @param {string} type           - 'error' | 'info' | 'success' | 'warning'
 */
export function showStatusMessage(container, text, type = 'info') {
  if (!container) return;
  container.textContent = '';
  container.className = `status-message status-message--${type}`;
  container.textContent = text;
  container.hidden = false;
}

/**
 * Hides and clears a status message container.
 *
 * @param {HTMLElement} container
 */
export function clearStatusMessage(container) {
  if (!container) return;
  container.hidden = true;
  container.textContent = '';
  container.className = 'status-message';
}

/**
 * Shows a loading spinner / text inside a container.
 *
 * @param {HTMLElement} container
 * @param {string} text
 */
export function showLoading(container, text = 'Loading opportunities…') {
  if (!container) return;
  container.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'loading-state';

  const spinner = document.createElement('span');
  spinner.className = 'loading-state__spinner';
  spinner.setAttribute('aria-hidden', 'true');

  const msg = document.createElement('p');
  msg.className = 'loading-state__text';
  msg.textContent = text;

  wrap.appendChild(spinner);
  wrap.appendChild(msg);
  container.appendChild(wrap);
}

/**
 * Shows an empty-state message inside a grid container.
 *
 * @param {HTMLElement} container
 * @param {string} heading
 * @param {string} body
 */
export function showEmptyState(container, heading = 'No opportunities found', body = 'Try adjusting your search or filters.') {
  if (!container) return;
  container.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'empty-state';
  wrap.setAttribute('role', 'status');

  const h = document.createElement('p');
  h.className = 'empty-state__heading';
  h.textContent = heading;

  const p = document.createElement('p');
  p.className = 'empty-state__text';
  p.textContent = body;

  wrap.appendChild(h);
  wrap.appendChild(p);
  container.appendChild(wrap);
}

// ---------------------------------------------------------------------------
// Opportunity card
// ---------------------------------------------------------------------------

/**
 * Creates a single opportunity card as a DOM element.
 * All content is set via textContent to prevent XSS.
 *
 * @param {object}   opportunity       - Normalized opportunity object.
 * @param {Function} onSaveToggle      - Callback(opportunity) called when save button is clicked.
 * @returns {HTMLElement} <article> element
 */
export function createOpportunityCard(opportunity, onSaveToggle) {
  const card = document.createElement('article');
  card.className = 'opportunity-card';
  card.setAttribute('data-id', opportunity.id);

  // --- Category badge ---
  // --- Category badge ---
  const catBadge = document.createElement('span');
  catBadge.className = `opportunity-card__category opportunity-card__category--${opportunity.category}`;
  catBadge.textContent = opportunity.categoryLabel || categoryLabel(opportunity.category);

  // --- Demo / Verified badge ---
  let badgeEl = null;
  if (opportunity.isVerified) {
    badgeEl = document.createElement('span');
    badgeEl.className = 'badge badge--verified';
    badgeEl.textContent = 'Verified Opportunity';
    badgeEl.style.marginLeft = '0.5rem';
  } else if (opportunity.isDemo) {
    badgeEl = document.createElement('span');
    badgeEl.className = 'badge badge--demo';
    badgeEl.textContent = 'Demo Opportunity';
    badgeEl.style.marginLeft = '0.5rem';
  }

  // --- Title ---
  const title = document.createElement('h2');
  title.className = 'opportunity-card__title';
  const titleLink = document.createElement('a');
  titleLink.className = 'opportunity-card__title-link';
  titleLink.href = `details.html?number=${opportunity.id}`;
  titleLink.textContent = opportunity.title;
  title.appendChild(titleLink);

  // --- Organizer ---
  const organizer = document.createElement('p');
  organizer.className = 'opportunity-card__organizer';
  organizer.textContent = opportunity.organizer;

  // --- Summary ---
  const summary = document.createElement('p');
  summary.className = 'opportunity-card__summary';
  summary.textContent = truncate(opportunity.summary, 140);

  // --- Meta row ---
  const meta = document.createElement('ul');
  meta.className = 'opportunity-card__meta';
  meta.setAttribute('aria-label', 'Opportunity details');

  meta.appendChild(createMetaItem('Format', formatLabel(opportunity.format)));
  meta.appendChild(createMetaItem('Funding', fundingLabel(opportunity.funding)));
  meta.appendChild(createMetaItem('Region', opportunity.region !== 'not-specified' ? opportunity.region : 'Not specified'));

  // --- Deadline ---
  const deadlineRow = document.createElement('div');
  deadlineRow.className = 'opportunity-card__deadline-row';

  const deadlineLabel = document.createElement('span');
  deadlineLabel.className = 'opportunity-card__deadline-label';
  deadlineLabel.textContent = 'Deadline: ';

  const deadlineDate = document.createElement('span');
  deadlineDate.className = 'opportunity-card__deadline-date';
  deadlineDate.textContent = opportunity.deadline ? formatDate(opportunity.deadline) : 'No deadline listed';

  const { key, label } = getDeadlineStatus(opportunity.deadline);
  const deadlineStatus = document.createElement('span');
  deadlineStatus.className = `deadline-badge deadline-badge--${key}`;
  deadlineStatus.textContent = label;
  deadlineStatus.setAttribute('aria-label', `Status: ${label}`);

  deadlineRow.appendChild(deadlineLabel);
  deadlineRow.appendChild(deadlineDate);
  deadlineRow.appendChild(deadlineStatus);

  // --- Actions ---
  const actions = document.createElement('div');
  actions.className = 'opportunity-card__actions';

  const detailsLink = document.createElement('a');
  detailsLink.className = 'btn btn--primary btn--sm';
  detailsLink.href = `details.html?number=${opportunity.id}`;
  detailsLink.textContent = 'View Details';
  detailsLink.setAttribute('aria-label', `View details for ${opportunity.title}`);

  const officialUrl = opportunity.officialRegistrationUrl || opportunity.officialSourceUrl || opportunity.officialUrl;
  let officialLink = null;
  if (officialUrl && !isPlaceholderUrl(officialUrl)) {
    officialLink = document.createElement('a');
    officialLink.className = 'btn btn--secondary btn--sm';
    officialLink.href = officialUrl;
    officialLink.target = '_blank';
    officialLink.rel = 'noopener noreferrer';
    officialLink.textContent = opportunity.officialRegistrationUrl ? 'Apply' : 'Official Source';
    officialLink.setAttribute('aria-label', `Open official link for ${opportunity.title}`);
  }

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn--secondary btn--sm';
  updateSaveButton(saveBtn, isOpportunitySaved(opportunity.id));
  saveBtn.setAttribute('aria-label',
    isOpportunitySaved(opportunity.id)
      ? `Remove ${opportunity.title} from saved`
      : `Save ${opportunity.title}`
  );

  saveBtn.addEventListener('click', () => {
    if (typeof onSaveToggle === 'function') {
      onSaveToggle(opportunity);
    }
    // Refresh button state after toggle
    const nowSaved = isOpportunitySaved(opportunity.id);
    updateSaveButton(saveBtn, nowSaved);
    saveBtn.setAttribute('aria-label',
      nowSaved
        ? `Remove ${opportunity.title} from saved`
        : `Save ${opportunity.title}`
    );
  });

  actions.appendChild(detailsLink);
  if (officialLink) {
    actions.appendChild(officialLink);
  }
  actions.appendChild(saveBtn);

  // --- Assemble card ---
  card.appendChild(catBadge);
  if (badgeEl) {
    card.appendChild(badgeEl);
  }
  card.appendChild(title);
  card.appendChild(organizer);
  card.appendChild(summary);
  card.appendChild(meta);
  card.appendChild(deadlineRow);
  card.appendChild(actions);

  return card;

}

/**
 * Creates a single <li> meta item for the card meta list.
 *
 * @param {string} label
 * @param {string} value
 * @returns {HTMLElement}
 */
function createMetaItem(label, value) {
  const li = document.createElement('li');
  li.className = 'opportunity-card__meta-item';

  const labelEl = document.createElement('span');
  labelEl.className = 'opportunity-card__meta-label';
  labelEl.textContent = label + ': ';

  const valueEl = document.createElement('span');
  valueEl.className = 'opportunity-card__meta-value';
  valueEl.textContent = value || 'Not specified';

  li.appendChild(labelEl);
  li.appendChild(valueEl);
  return li;
}

// ---------------------------------------------------------------------------
// Grid rendering
// ---------------------------------------------------------------------------

/**
 * Renders an array of opportunities into the grid container.
 * Appends cards rather than replacing — supports Load More.
 *
 * @param {HTMLElement} grid          - Target grid container element.
 * @param {object[]}    opportunities - Array of normalized opportunity objects.
 * @param {Function}    onSaveToggle  - Save toggle callback passed to each card.
 */
export function renderOpportunityGrid(grid, opportunities, onSaveToggle) {
  if (!grid) return;

  if (opportunities.length === 0) {
    showEmptyState(grid, 'No opportunities found', 'Try clearing your filters or check back later.');
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const opp of opportunities) {
    try {
      const card = createOpportunityCard(opp, onSaveToggle);
      fragment.appendChild(card);
    } catch {
      // One broken card must not prevent others from rendering.
    }
  }
  grid.appendChild(fragment);
}

// ---------------------------------------------------------------------------
// Save button helper
// ---------------------------------------------------------------------------

/**
 * Updates a save button's text and CSS class to reflect current saved state.
 *
 * @param {HTMLButtonElement} btn
 * @param {boolean}           saved
 */
export function updateSaveButton(btn, saved) {
  if (!btn) return;
  if (saved) {
    btn.textContent = 'Remove Saved';
    btn.classList.add('btn--saved');
  } else {
    btn.textContent = 'Save';
    btn.classList.remove('btn--saved');
  }
}

// ---------------------------------------------------------------------------
// Placeholder image helper
// ---------------------------------------------------------------------------

/**
 * Returns the path to a local placeholder SVG for a given category.
 *
 * @param {string} category
 * @returns {string}
 */
export function getPlaceholderImage(category) {
  const map = {
    hackathon:          'assets/placeholder-hackathon.svg',
    camp:               'assets/placeholder-camp.svg',
    'ai-camp':          'assets/placeholder-camp.svg',
    competition:        'assets/placeholder-competition.svg',
    bootcamp:           'assets/placeholder-bootcamp.svg',
    workshop:           'assets/placeholder-bootcamp.svg',
    conference:         'assets/placeholder-competition.svg',
    'startup-challenge':'assets/placeholder-hackathon.svg',
    'youth-program':    'assets/placeholder-camp.svg',
  };
  return map[category] || 'assets/placeholder-default.svg';
}
