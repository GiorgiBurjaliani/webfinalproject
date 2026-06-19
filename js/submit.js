import { saveSuggestionDraft, getSuggestionDraft, clearSuggestionDraft, addSubmittedSuggestion } from './storage.js';
import { showStatusMessage, clearStatusMessage } from './ui.js';
import { checkAuth } from './auth.js';

const form          = document.getElementById('suggestion-form');
const submitStatus  = document.getElementById('submit-status');
const successPanel  = document.getElementById('submit-success');
const anotherBtn    = document.getElementById('submit-another-btn');
const errorSummary  = document.getElementById('form-error-summary');
const errorList     = document.getElementById('form-error-list');

// Form fields that are used for validation and draft saving.
const fieldTitle       = document.getElementById('field-title');
const fieldOrganizer   = document.getElementById('field-organizer');
const fieldEmail       = document.getElementById('field-email');
const fieldCategory    = document.getElementById('field-category');
const fieldFunding     = document.getElementById('field-funding');
const fieldDeadline    = document.getElementById('field-deadline');
const fieldUrl         = document.getElementById('field-url');
const fieldDescription = document.getElementById('field-description');

// Shows an error under one form field.
function showFieldError(fieldId, errorId, message) {
  const fieldEl = document.getElementById(fieldId);
  const errorEl = document.getElementById(errorId);
  if (fieldEl) {
    fieldEl.classList.add('form-field__input--error');
    fieldEl.setAttribute('aria-describedby', errorId);
  }
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }
}

// Clears the error for one form field.
function clearFieldError(fieldId, errorId) {
  const fieldEl = document.getElementById(fieldId);
  const errorEl = document.getElementById(errorId);
  if (fieldEl) {
    fieldEl.classList.remove('form-field__input--error');
    fieldEl.removeAttribute('aria-describedby');
  }
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

// Clears every validation message before checking the form again.
function clearAllErrors() {
  const errorIds = [
    ['field-title', 'field-title-error'],
    ['field-organizer', 'field-organizer-error'],
    ['field-email', 'field-email-error'],
    ['field-category', 'field-category-error'],
    ['field-funding', 'field-funding-error'],
    ['field-deadline', 'field-deadline-error'],
    ['field-url', 'field-url-error'],
    ['field-description', 'field-description-error'],
  ];
  for (const [fId, eId] of errorIds) {
    clearFieldError(fId, eId);
  }
  if (errorSummary) errorSummary.hidden = true;
  if (errorList) errorList.textContent = '';
}

// Shows all validation errors together at the top of the form.
function showErrorSummary(messages) {
  if (!errorSummary || !errorList) return;
  errorList.textContent = '';
  for (const msg of messages) {
    const li = document.createElement('li');
    li.textContent = msg;
    errorList.appendChild(li);
  }
  errorSummary.hidden = false;
  // Move focus to the summary so keyboard users notice the errors too.
  errorSummary.focus();
}

// Reads all form values and puts them into one object.
function readFormData() {
  const formatRadio = form.querySelector('input[name="format"]:checked');
  const checkedBenefits = Array.from(form.querySelectorAll('input[name="benefits"]:checked'))
    .map((cb) => cb.value);

  return {
    title:       fieldTitle       ? fieldTitle.value.trim()       : '',
    organizer:   fieldOrganizer   ? fieldOrganizer.value.trim()   : '',
    email:       fieldEmail       ? fieldEmail.value.trim()       : '',
    category:    fieldCategory    ? fieldCategory.value           : '',
    format:      formatRadio      ? formatRadio.value             : '',
    funding:     fieldFunding     ? fieldFunding.value            : '',
    deadline:    fieldDeadline    ? fieldDeadline.value           : '',
    url:         fieldUrl         ? fieldUrl.value.trim()         : '',
    location:    (document.getElementById('field-location') || {}).value?.trim() || '',
    description: fieldDescription ? fieldDescription.value.trim() : '',
    benefits:    checkedBenefits,
  };
}

// Returns field-level errors that can be shown in the form and summary.
function validateFormData(data) {
  const errors = [];

  if (!data.title || data.title.length < 5) {
    errors.push({ fieldId: 'field-title', errorId: 'field-title-error', message: 'Title must be at least 5 characters.' });
  }
  if (data.title.length > 120) {
    errors.push({ fieldId: 'field-title', errorId: 'field-title-error', message: 'Title must be 120 characters or fewer.' });
  }

  if (!data.organizer || data.organizer.length < 2) {
    errors.push({ fieldId: 'field-organizer', errorId: 'field-organizer-error', message: 'Organizer name must be at least 2 characters.' });
  }

  if (!data.email) {
    errors.push({ fieldId: 'field-email', errorId: 'field-email-error', message: 'Email address is required.' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ fieldId: 'field-email', errorId: 'field-email-error', message: 'Please enter a valid email address.' });
  }

  if (!data.category) {
    errors.push({ fieldId: 'field-category', errorId: 'field-category-error', message: 'Please select a category.' });
  }

  if (!data.format) {
    errors.push({ fieldId: null, errorId: 'field-format-error', message: 'Please select an event format.' });
  }

  if (!data.funding) {
    errors.push({ fieldId: 'field-funding', errorId: 'field-funding-error', message: 'Please select a funding type.' });
  }

  if (data.deadline) {
    const deadlineDate = new Date(data.deadline);
    if (isNaN(deadlineDate.getTime())) {
      errors.push({ fieldId: 'field-deadline', errorId: 'field-deadline-error', message: 'Please enter a valid date.' });
    } else if (deadlineDate < new Date()) {
      errors.push({ fieldId: 'field-deadline', errorId: 'field-deadline-error', message: 'The deadline cannot be in the past.' });
    }
  }

  if (!data.url) {
    errors.push({ fieldId: 'field-url', errorId: 'field-url-error', message: 'Official URL is required.' });
  } else if (!data.url.startsWith('http://') && !data.url.startsWith('https://')) {
    errors.push({ fieldId: 'field-url', errorId: 'field-url-error', message: 'URL must start with http:// or https://' });
  }

  if (!data.description || data.description.length < 30) {
    errors.push({ fieldId: 'field-description', errorId: 'field-description-error', message: 'Description must be at least 30 characters.' });
  }

  return errors;
}

// Drafts protect the user from losing form text on refresh.
function handleDraftSave() {
  const data = readFormData();
  saveSuggestionDraft(data);
}

// Restores the draft if the user comes back to the form later.
function restoreDraft() {
  const draft = getSuggestionDraft();
  if (!draft) return;

  if (fieldTitle && draft.title)             fieldTitle.value       = draft.title;
  if (fieldOrganizer && draft.organizer)     fieldOrganizer.value   = draft.organizer;
  if (fieldEmail && draft.email)             fieldEmail.value       = draft.email;
  if (fieldCategory && draft.category)       fieldCategory.value    = draft.category;
  if (fieldFunding && draft.funding)         fieldFunding.value     = draft.funding;
  if (fieldDeadline && draft.deadline)       fieldDeadline.value    = draft.deadline;
  if (fieldUrl && draft.url)                 fieldUrl.value         = draft.url;
  if (fieldDescription && draft.description) fieldDescription.value = draft.description;

  const locationField = document.getElementById('field-location');
  if (locationField && draft.location) locationField.value = draft.location;

  if (draft.format) {
    const radio = form.querySelector(`input[name="format"][value="${draft.format}"]`);
    if (radio) radio.checked = true;
  }

  if (Array.isArray(draft.benefits)) {
    for (const val of draft.benefits) {
      const cb = form.querySelector(`input[name="benefits"][value="${val}"]`);
      if (cb) cb.checked = true;
    }
  }
}

// Handles the final submit button.
function handleSubmit(event) {
  event.preventDefault(); // Keep the page from reloading.
  clearAllErrors();
  clearStatusMessage(submitStatus);

  const data = readFormData();
  const errors = validateFormData(data);

  if (errors.length > 0) {
    // Show errors next to the exact fields.
    for (const err of errors) {
      if (err.fieldId) {
        showFieldError(err.fieldId, err.errorId, err.message);
      } else if (err.errorId) {
        const el = document.getElementById(err.errorId);
        if (el) { el.textContent = err.message; el.hidden = false; }
      }
    }
    // Also show all errors together.
    showErrorSummary(errors.map((e) => e.message));
    return;
  }

  // If everything is valid, save the suggestion locally.
  addSubmittedSuggestion(data);
  clearSuggestionDraft();

  // Hide the form and show the success message.
  if (form)           form.hidden = true;
  if (successPanel)   successPanel.hidden = false;
}

// Lets the user submit another suggestion after success.
function handleSuggestAnother() {
  if (form)          { form.hidden = false; form.reset(); }
  if (successPanel)  successPanel.hidden = true;
  clearAllErrors();
  clearStatusMessage(submitStatus);
}

// Clears the saved draft when the form is reset.
function handleFormReset() {
  clearAllErrors();
  clearSuggestionDraft();
  clearStatusMessage(submitStatus);
}

// Connects the form events to the functions above.
function registerEventListeners() {
  if (form) {
    form.addEventListener('submit', handleSubmit);
    form.addEventListener('reset', handleFormReset);
    // Save draft on any input or dropdown change.
    form.addEventListener('input', handleDraftSave);
    form.addEventListener('change', handleDraftSave);
  }
  if (anotherBtn) {
    anotherBtn.addEventListener('click', handleSuggestAnother);
  }
}

// Starts the submit page.
function init() {
  checkAuth();
  restoreDraft();
  registerEventListeners();
}

init();
