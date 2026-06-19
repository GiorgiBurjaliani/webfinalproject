/**
 * details.js
 * Entry point for details.html — Individual Opportunity Detail page.
 * Reads ?number= from URL, fetches the issue, renders all fields.
 */

import { fetchOpportunityByNumber } from './api.js';
import { saveOpportunity, removeSavedOpportunity, isOpportunitySaved } from './storage.js';
import { formatDate, getDeadlineStatus, fundingLabel, formatLabel, categoryLabel, isPlaceholderUrl } from './utils.js';
import { showStatusMessage, clearStatusMessage, updateSaveButton, getPlaceholderImage } from './ui.js';
import { DEMO_OPPORTUNITIES } from './config.js';
import { checkAuth } from './auth.js';


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

  // Handle details notices (demo or verified) near the title
  const existingNotice = document.getElementById('details-demo-notice-msg');
  if (existingNotice) {
    existingNotice.remove();
  }
  if (opp.isVerified) {
    const notice = document.createElement('div');
    notice.id = 'details-demo-notice-msg';
    notice.className = 'details-verified-notice';
    
    const textSpan = document.createElement('span');
    textSpan.textContent = `Opportunity information verified from the organizer’s official source on ${opp.verifiedOn || 'recent date'}. Always check the official page before applying. `;
    notice.appendChild(textSpan);

    if (opp.officialSourceUrl) {
      const sourceLink = document.createElement('a');
      sourceLink.href = opp.officialSourceUrl;
      sourceLink.target = '_blank';
      sourceLink.rel = 'noopener noreferrer';
      sourceLink.textContent = 'View Official Source';
      notice.appendChild(sourceLink);
    }

    const titleEl = document.getElementById('details-title');
    if (titleEl && titleEl.parentNode) {
      titleEl.parentNode.insertBefore(notice, titleEl.nextSibling);
    }
  } else if (opp.isDemo) {
    const notice = document.createElement('div');
    notice.id = 'details-demo-notice-msg';
    notice.className = 'details-demo-notice';
    notice.textContent = 'This is a sample opportunity created for educational demonstration. Dates, organizer details, and registration links may not represent an active real-world event.';
    
    const titleEl = document.getElementById('details-title');
    if (titleEl && titleEl.parentNode) {
      titleEl.parentNode.insertBefore(notice, titleEl.nextSibling);
    }
  }

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

  // Official link / placeholder message logic
  const existingPlaceholderMsg = document.getElementById('details-placeholder-msg');
  if (existingPlaceholderMsg) {
    existingPlaceholderMsg.remove();
  }

  if (officialLink) {
    if (opp.officialUrl && !isPlaceholderUrl(opp.officialUrl)) {
      officialLink.href = opp.officialUrl;
      officialLink.hidden = false;
    } else {
      officialLink.hidden = true;
      // Add non-clickable text
      const placeholderMsg = document.createElement('div');
      placeholderMsg.id = 'details-placeholder-msg';
      placeholderMsg.className = 'placeholder-link-message';
      placeholderMsg.textContent = 'Official registration link unavailable for this demo record.';
      officialLink.parentNode.insertBefore(placeholderMsg, officialLink);
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
  checkAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const numberParam = urlParams.get('number');
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

  // Check if it is a local demo opportunity
  const demoOpp = DEMO_OPPORTUNITIES.find((opp) => opp.id === issueNumber);
  if (demoOpp) {
    clearStatusMessage(statusEl);
    renderOpportunityDetails(demoOpp);
    if (saveBtn) {
      saveBtn.addEventListener('click', () => handleDetailsSaveToggle(demoOpp));
    }
    return;
  }

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
