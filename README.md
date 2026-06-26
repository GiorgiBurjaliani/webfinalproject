# OpportunityHub - Hackathons, Camps & Challenges

OpportunityHub is a static front-end web application for discovering student technology opportunities such as hackathons, camps, competitions, bootcamps, workshops, and conferences.

The project is built with semantic HTML5, external CSS, and modular vanilla JavaScript. It uses the GitHub Issues REST API as a simple read-only data source.

## Live Demo

You can access the deployed application here:
[OpportunityHub Live Demo](https://6a3dee55376d4f30639da8b3--steady-crepe-64acd0.netlify.app/login.html)


## Features

1. Opportunity discovery
   - Loads open opportunities from this repository's GitHub Issues API.
   - Search input uses a 350ms debounce to avoid unnecessary re-rendering.
   - Filters by category, format, funding, region, and data type.
   - Sorts by deadline, title, or publication date.
   - Shows loading, empty, and error states.
   - Uses a short localStorage cache to reduce GitHub API rate-limit pressure.

2. Opportunity details
   - Opens details with `details.html?number={issue_number}`.
   - Shows metadata such as organizer, location, deadline, eligibility, age requirement, and benefits.
   - Shows official source or application links when available.
   - Allows the user to save an opportunity.
   - Allows local "Apply / Register" tracking when no separate registration URL is provided.

3. Saved opportunities
   - Saves opportunities in `localStorage`.
   - Lets the user track application status, including `Interested`, `Planning to Apply`, `Applied`, `Accepted`, and more.
   - Supports sorting, removing one saved item, or clearing all saved items.

4. Suggest an opportunity
   - Includes a validated HTML form with text, email, date, URL, select, radio, checkbox, and textarea fields.
   - Uses JavaScript `preventDefault()` validation and visible feedback.
   - Auto-saves a draft in `localStorage`.

5. Simple login flow
   - Stores the user's name in `localStorage`.
   - Shows a greeting and logout button in the site header.

## Project Structure

```text
webfinalproject/
  index.html              Main opportunity discovery page
  details.html            Single opportunity detail page
  saved.html              Saved opportunities and application tracker
  submit.html             Suggest an opportunity form
  login.html              Simple local login page
  DATA_SETUP.md           Guide for creating GitHub Issue data
  css/
    style.css             Responsive BEM-style layout and UI styles
  js/
    api.js                GitHub Issues REST API fetch layer
    auth.js               Login state and header profile widget
    config.js             API endpoint constants, storage keys, demo data
    details.js            Entry point for details.html
    login.js              Entry point for login.html
    main.js               Entry point for index.html
    parser.js             Normalizes GitHub Issue payloads
    saved.js              Entry point for saved.html
    storage.js            Safe localStorage helpers
    submit.js             Entry point for submit.html
    ui.js                 DOM element builders
    utils.js              Formatting, sorting, URL, and debounce helpers
  assets/
    placeholder-*.svg     Local placeholder images
```

## API

The app fetches data from:

```text
https://api.github.com/repos/GiorgiBurjaliani/webfinalproject/issues
```

Only open Issues are shown. Pull requests are filtered out in `js/api.js` / `js/parser.js`.

## Local Running

Because the app uses ES modules, run it through a local web server instead of opening the HTML files directly with `file://`.

Example with Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/login.html
```

## Data Setup

Opportunities are stored as GitHub Issues in this repository. See [DATA_SETUP.md](DATA_SETUP.md) for the required issue format, labels, and example data.

## Git Workflow

The project history includes meaningful feature and fix commits, plus feature and fix branches merged back into `master`.
