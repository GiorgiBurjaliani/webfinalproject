# OpportunityHub — Hackathons, Camps & Challenges

> **Discover opportunities. Build skills. Take the next step.**

OpportunityHub is a static, lightweight, and accessible front-end web application built for students and young professionals who want to discover tech events, hackathons, coding bootcamps, and career-building workshops.

---

## ◈ Project Features

1. **Opportunity Discovery (Index)**:
   - Search by keyword with a **350ms debounced input** to reduce API calls and interface stuttering.
   - Filter by **Category** (hackathons, camps, workshops, etc.), **Format** (online, hybrid, in-person), **Funding** (free, paid, fully-funded), and **Region**.
   - Sort by nearest deadline, latest deadline, title, or publication date.
   - Paginated dynamic rendering with a "Load More" button.
   - Client-side caching of API responses (5-minute TTL) to respect GitHub API rate limits.

2. **Opportunity Details**:
   - Access via custom route parameters (`?number={issue_number}`).
   - Comprehensive metadata dashboard showing location, eligibility, age requirements, and experience levels.
   - Safely renders details and benefits using secure DOM text elements to prevent cross-site scripting (XSS).
   - Local save/remove capability.

3. **Saved Opportunities & Application Tracker**:
   - Save cards for offline viewing (persisted via `localStorage`).
   - Track application stages dynamically with immediate UI status styling (`Interested`, `Planning to Apply`, `Applied`, `Accepted`, etc.).
   - Sort and manage saved opportunities with a "Clear all" confirmation flow.

4. **Suggest an Opportunity Form**:
   - Client-side form validation (email format, minimum/maximum lengths).
   - Form-level error summary and individual field error highlights for screen readers.
   - Auto-saves user input as a draft in `localStorage` to prevent data loss on accidental refresh.

---

## ◈ Technical Architecture & Modular Design

The application is written strictly in **semantic HTML5**, **vanilla CSS**, and **ES Modules JavaScript**. No third-party frameworks, build tools, or CSS libraries are used.

```
webfinalproject/
├── index.html        ← Opportunity discovery landing page
├── details.html      ← Detailed view for a single opportunity
├── saved.html        ← User saved opportunities and application tracker
├── submit.html       ← Accessible suggestion form
├── css/
│   └── style.css     ← Responsive BEM layout, color system, and UI utilities
└── js/
    ├── config.js     ← Central constants, API endpoints, and storage keys
    ├── utils.js      ← Pure utilities (formatters, sorters, createDebounce closure)
    ├── storage.js    ← Safe localStorage read/write wrappers (with try-catch)
    ├── parser.js     ← Normalizes raw GitHub Issue payloads into unified objects
    ├── api.js        ← GitHub Issues REST API fetch layer with rate-limit warnings
    ├── ui.js         ← Direct DOM node generators (no unsafe innerHTML)
    ├── main.js       ← Entry point for index.html
    ├── details.js    ← Entry point for details.html
    ├── saved.js      ← Entry point for saved.html
    └── submit.js     ← Entry point for submit.html
```

### Git Branching & Merge Strategy

Following strict academic guidelines, major feature integration (API access, parser, ui modules) was built on the `feature/opportunity-feed` branch, validated, committed in meaningful units, pushed to origin, and then merged cleanly back to `master`.

---

## ◈ Setup & Local Running

1. Clone the repository:
   ```bash
   git clone git@github.com:GiorgiBurjaliani/webfinalproject.git
   ```
2. Run any local web server in the directory. For example, using Python:
   ```bash
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your web browser.

---

## ◈ Data Architecture

Opportunities are sourced dynamically from GitHub Issues in this repository. To see the required issue template format and learn how to populate your feed, check out [DATA_SETUP.md](file:///c:/Users/G/Desktop/WebFinal/webfinalproject/DATA_SETUP.md).
