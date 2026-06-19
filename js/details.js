// Script for the opportunity details page.
// It reads the opportunity number from the URL and fills the page with that data.

import { fetchOpportunityByNumber } from './api.js';
import { saveOpportunity, removeSavedOpportunity, isOpportunitySaved, updateOpportunityStatus } from './storage.js';
import { formatDate, getDeadlineStatus, fundingLabel, formatLabel, categoryLabel, isPlaceholderUrl, isGeneralHomepageUrl } from './utils.js';
import { showStatusMessage, clearStatusMessage, updateSaveButton, getPlaceholderImage } from './ui.js';
import { DEMO_OPPORTUNITIES } from './config.js';
import { checkAuth } from './auth.js';


// DOM references

// Main elements that are changed on this page.
const statusEl          = document.getElementById('details-status');
const contentEl         = document.getElementById('details-content');
const saveBtn           = document.getElementById('details-save-btn');
const sourceLink        = document.getElementById('details-source-link');
const registerLink      = document.getElementById('details-register-link');

// Small helpers

// Small helper so I do not repeat document.getElementById many times.
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || 'Not specified';
}

// Makes URLs easier to compare, because the same link can be written differently.
function normalizeUrlForCompare(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url.trim());
    parsed.hash = '';
    if (parsed.pathname !== '/') {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }
    return parsed.toString();
  } catch {
    return url.trim().replace(/\/+$/, '');
  }
}

// Render details

// Fills all fields on the details page.
function renderOpportunityDetails(opp) {
  document.title = `${opp.title} - OpportunityHub`;

  // Main heading information.
  setText('details-category', opp.categoryLabel || categoryLabel(opp.category));
  setText('details-format', formatLabel(opp.format));
  setText('details-funding', fundingLabel(opp.funding));
  setText('details-title', opp.title);
  setText('details-organizer', `Organized by: ${opp.organizer}`);

  // Remove the old notice before adding a new one.
  const existingNotice = document.getElementById('details-demo-notice-msg');
  if (existingNotice) {
    existingNotice.remove();
  }
  // Verified opportunities get a source notice near the title.
  if (opp.isVerified) {
    const notice = document.createElement('div');
    notice.id = 'details-demo-notice-msg';
    notice.className = 'details-verified-notice';
    
    const textSpan = document.createElement('span');
    textSpan.textContent = `Opportunity information verified from the organizer's official source on ${opp.verifiedOn || 'recent date'}. Always check the official page before applying. `;
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
    // Demo opportunities get a warning so users know they are examples.
    const notice = document.createElement('div');
    notice.id = 'details-demo-notice-msg';
    notice.className = 'details-demo-notice';
    notice.textContent = 'This is a sample opportunity created for educational demonstration. Dates, organizer details, and registration links may not represent an active real-world event.';
    
    const titleEl = document.getElementById('details-title');
    if (titleEl && titleEl.parentNode) {
      titleEl.parentNode.insertBefore(notice, titleEl.nextSibling);
    }
  }

  // Deadline badge changes color based on the deadline status.
  const { key, label } = getDeadlineStatus(opp.deadline);
  const deadlineBadge = document.getElementById('details-deadline-status');
  if (deadlineBadge) {
    deadlineBadge.textContent = label;
    deadlineBadge.className = `deadline-badge deadline-badge--${key}`;
  }

  // Use a local placeholder if the opportunity does not have a real image.
  const imgEl = document.getElementById('details-image');
  if (imgEl) {
    const src = opp.imageUrl || getPlaceholderImage(opp.category);
    imgEl.src = src;
    imgEl.alt = opp.imageUrl
      ? `${opp.title} - event banner`
      : `Placeholder graphic for ${opp.categoryLabel || opp.category} category`;

    // If the external image fails, show the local placeholder instead.
    imgEl.addEventListener('error', () => {
      imgEl.src = getPlaceholderImage(opp.category);
      imgEl.alt = `Placeholder graphic for ${opp.categoryLabel || opp.category} category`;
    });
  }

  // Basic information section.
  setText('details-region', opp.region !== 'not-specified' ? opp.region : 'Not specified');
  setText('details-location', opp.location);
  setText('details-deadline', opp.deadline ? formatDate(opp.deadline) : 'No deadline provided');
  setText('details-start', opp.startDate ? formatDate(opp.startDate) : 'Not specified');
  setText('details-end', opp.endDate ? formatDate(opp.endDate) : 'Not specified');
  setText('details-eligibility', opp.eligibility);
  setText('details-age', opp.ageRequirement);
  setText('details-experience', opp.experience);

  // textContent is used here so the description is displayed as plain text.
  const descEl = document.getElementById('details-description');
  if (descEl) descEl.textContent = opp.description || 'No description provided.';

  const benefitsEl = document.getElementById('details-benefits');
  if (benefitsEl) benefitsEl.textContent = opp.benefits || 'Not specified';

  // Work out which official buttons should be visible.
  const sourceUrl = opp.officialSourceUrl || opp.officialUrl;
  const registrationUrl = opp.officialRegistrationUrl || opp.officialUrl || opp.officialSourceUrl;
  const hasSourceUrl = sourceUrl && !isPlaceholderUrl(sourceUrl) && !isGeneralHomepageUrl(sourceUrl);
  const hasRegistrationUrl = registrationUrl && !isPlaceholderUrl(registrationUrl);
  const linksAreSame = normalizeUrlForCompare(sourceUrl) === normalizeUrlForCompare(registrationUrl);

  if (sourceLink) {
    if (hasSourceUrl) {
      sourceLink.href = sourceUrl;
      sourceLink.hidden = false;
    } else {
      sourceLink.hidden = true;
    }
  }

  if (registerLink) {
    registerLink.onclick = null;

    // Real registration links open in a new tab.
    if (hasRegistrationUrl && !linksAreSame) {
      registerLink.href = registrationUrl;
      registerLink.target = '_blank';
      registerLink.rel = 'noopener noreferrer';
      registerLink.hidden = false;
    } else {
      // If there is no real link, the button only marks it as applied locally.
      registerLink.href = '#';
      registerLink.removeAttribute('target');
      registerLink.removeAttribute('rel');
      registerLink.textContent = 'Apply / Register';
      registerLink.hidden = false;
      registerLink.onclick = (event) => {
        event.preventDefault();
        handleLocalRegistration(opp);
      };
    }
  }

  // Make the save button match the current saved state.
  if (saveBtn) {
    updateSaveButton(saveBtn, isOpportunitySaved(opp.id));
    saveBtn.setAttribute('aria-label',
      isOpportunitySaved(opp.id)
        ? `Remove "${opp.title}" from saved`
        : `Save "${opp.title}"`
    );
  }

  // Show the page content after the data is ready.
  if (contentEl) contentEl.hidden = false;
}

// Save and apply actions

// Handles the Save / Remove button on the details page.
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

// This is used when the opportunity does not have a real registration link.
function handleLocalRegistration(opportunity) {
  saveOpportunity(opportunity);
  updateOpportunityStatus(opportunity.id, 'applied');

  if (saveBtn) {
    updateSaveButton(saveBtn, true);
    saveBtn.setAttribute('aria-label', `Remove "${opportunity.title}" from saved`);
  }

  showStatusMessage(
    statusEl,
    `"${opportunity.title}" was saved and marked as applied.`,
    'success'
  );
  showRegistrationPopup(opportunity.title);
  setTimeout(() => clearStatusMessage(statusEl), 3000);
}

// A small temporary popup after the local apply action.
function showRegistrationPopup(title) {
  const existingPopup = document.getElementById('registration-success-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement('div');
  popup.id = 'registration-success-popup';
  popup.className = 'registration-popup';
  popup.setAttribute('role', 'alert');

  const message = document.createElement('p');
  message.className = 'registration-popup__message';
  message.textContent = `Successfully registered for "${title}".`;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'registration-popup__close';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => popup.remove());

  popup.appendChild(message);
  popup.appendChild(closeBtn);
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 3500);
}

// Page loading

// Main loading function for this page.
async function loadAndRender() {
  checkAuth();

  // The URL should look like details.html?number=123.
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

  showStatusMessage(statusEl, 'Loading opportunity details...', 'info');

  // First check demo data, because it is stored locally.
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
    // If it is not demo data, load it from GitHub.
    const opportunity = await fetchOpportunityByNumber(issueNumber);
    clearStatusMessage(statusEl);
    renderOpportunityDetails(opportunity);

    // Add the save click after the opportunity is loaded.
    if (saveBtn) {
      saveBtn.addEventListener('click', () => handleDetailsSaveToggle(opportunity));
    }

  } catch (error) {
    showStatusMessage(statusEl, error.message, 'error');
  }

}

loadAndRender();
