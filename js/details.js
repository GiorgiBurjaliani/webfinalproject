/**
 * details.js
 * Entry point for details.html — Individual Opportunity Detail page.
 * Reads ?number= from URL, fetches the issue, renders all fields.
 */

import { fetchOpportunityByNumber } from './api.js';
import { saveOpportunity, removeSavedOpportunity, isOpportunitySaved } from './storage.js';
import { formatDate, getDeadlineStatus, fundingLabel, formatLabel, categoryLabel } from './utils.js';
import { showStatusMessage, clearStatusMessage, updateSaveButton, getPlaceholderImage } from './ui.js';

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const statusEl      = document.getElementById('details-status');
const contentEl     = document.getElementById('details-content');
const saveBtn       = document.getElementById('details-save-btn');
const officialLink  = document.getElementById('details-official-link');

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

/**
 * Sets the textContent of an element by ID. Safely skips missing elements.
 *
 * @param {string} id
 * @param {string} text
 */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || 'Not specified';
}

/**
 * Renders all opportunity fields into the detail page DOM.
 *
 * @param {object} opp - Normalized opportunity object.
 */
function renderOpportunityDetails(opp) {
  // Page title
  document.title = `${opp.title} — OpportunityHub`;

  // Header section
  setText('details-category', opp.categoryLabel || categoryLabel(opp.category));
  setText('details-format', formatLabel(opp.format));
  setText('details-funding', fundingLabel(opp.funding));
  setText('details-title', opp.title);
  setText('details-organizer', `Organized by: ${opp.organizer}`);

  // Deadline status badge
  const { key, label } = getDeadlineStatus(opp.deadline);
  const deadlineBadge = document.getElementById('details-deadline-status');
  if (deadlineBadge) {
    deadlineBadge.textContent = label;
    deadlineBadge.className = `deadline-badge deadline-badge--${key}`;
  }

  // Image — use placeholder when no valid image URL is provided
  const imgEl = document.getElementById('details-image');
  if (imgEl) {
    const src = opp.imageUrl || getPlaceholderImage(opp.category);
    imgEl.src = src;
    imgEl.alt = opp.imageUrl
      ? `${opp.title} — event banner`
      : `Placeholder graphic for ${opp.categoryLabel || opp.category} category`;

    // Handle broken external images by falling back to placeholder
    imgEl.addEventListener('error', () => {
      imgEl.src = getPlaceholderImage(opp.category);
      imgEl.alt = `Placeholder graphic for ${opp.categoryLabel || opp.category} category`;
    });
  }

  // Stat fields
  setText('details-region', opp.region !== 'not-specified' ? opp.region : 'Not specified');
  setText('details-location', opp.location);
  setText('details-deadline', opp.deadline ? formatDate(opp.deadline) : 'No deadline provided');
  setText('details-start', opp.startDate ? formatDate(opp.startDate) : 'Not specified');
  setText('details-end', opp.endDate ? formatDate(opp.endDate) : 'Not specified');
  setText('details-eligibility', opp.eligibility);
  setText('details-age', opp.ageRequirement);
  setText('details-experience', opp.experience);

  // Description and benefits — use textContent to prevent XSS
  const descEl = document.getElementById('details-description');
  if (descEl) descEl.textContent = opp.description || 'No description provided.';

  const benefitsEl = document.getElementById('details-benefits');
  if (benefitsEl) benefitsEl.textContent = opp.benefits || 'Not specified';

  // Official link — only show when a valid URL exists
  if (officialLink) {
    if (opp.officialUrl) {
      officialLink.href = opp.officialUrl;
      officialLink.hidden = false;
    } else {
      officialLink.hidden = true;
    }
  }

  // Save button initial state
  if (saveBtn) {
    updateSaveButton(saveBtn, isOpportunitySaved(opp.id));
    saveBtn.setAttribute('aria-label',
      isOpportunitySaved(opp.id)
        ? `Remove "${opp.title}" from saved`
        : `Save "${opp.title}"`
    );
  }

  // Show the content section
  if (contentEl) contentEl.hidden = false;
}

// ---------------------------------------------------------------------------
// Save / Remove toggle
// ---------------------------------------------------------------------------

/**
 * Handles the Save / Remove button click on the details page.
 * Closure captures `opportunity` from the outer loadAndRender function.
 *
 * @param {object} opportunity
 */
function handleDetailsSaveToggle(opportunity) {
  if (isOpportunitySaved(opportunity.id)) {
    removeSavedOpportunity(opportunity.id);
    updateSaveButton(saveBtn, false);
    saveBtn.setAttribute('aria-label', `Save "${opportunity.title}"`);
    showStatusMessage(statusEl, `"${opportunity.title}" removed from saved.`, 'info');
  } else {
    saveOpportunity(opportunity);
    updateSaveButton(saveBtn, true);
    saveBtn.setAttribute('aria-label', `Remove "${opportunity.title}" from saved`);
    showStatusMessage(statusEl, `"${opportunity.title}" saved!`, 'success');
  }
  setTimeout(() => clearStatusMessage(statusEl), 3000);
}

// ---------------------------------------------------------------------------
// Page load
// ---------------------------------------------------------------------------

/**
 * Reads the ?number= query parameter, validates it, fetches the opportunity,
 * and renders the full detail view.
 */
async function loadAndRender() {
  const params = new URLSearchParams(window.location.search);
  const numberParam = params.get('number');

  // Validate the parameter
  if (!numberParam || numberParam.trim() === '') {
    showStatusMessage(
      statusEl,
      'No opportunity number provided. Please go back and select an opportunity.',
      'error'
    );
    return;
  }

  const issueNumber = parseInt(numberParam, 10);
  if (isNaN(issueNumber) || issueNumber < 1) {
    showStatusMessage(
      statusEl,
      `Invalid opportunity number: "${numberParam}". Please go back and select a valid opportunity.`,
      'error'
    );
    return;
  }

  // Show loading state
  showStatusMessage(statusEl, 'Loading opportunity details…', 'info');

  try {
    const opportunity = await fetchOpportunityByNumber(issueNumber);
    clearStatusMessage(statusEl);
    renderOpportunityDetails(opportunity);

    // Register save button event — attach after opportunity is loaded
    if (saveBtn) {
      saveBtn.addEventListener('click', () => handleDetailsSaveToggle(opportunity));
    }

  } catch (error) {
    showStatusMessage(statusEl, error.message, 'error');
  }
}

loadAndRender();
