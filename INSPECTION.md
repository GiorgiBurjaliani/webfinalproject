# Template Inspection Report

Inspected lecturer template before building OpportunityHub.

## Existing files

- `.gitignore` — preserved unchanged
- `README.md` — rewritten in English for OpportunityHub
- `assets/.gitkeep` — preserved
- `css/style.css` — rewritten with BEM design system
- `js/api.js` — expanded to full GitHub API module
- `js/main.js` — expanded to opportunity discovery controller
- `js/saved.js` — expanded to saved opportunities controller
- `js/login.js` — repurposed as `js/submit.js` (no auth required)
- `index.html` — rewritten in English for opportunity discovery
- `saved.html` — rewritten in English for saved opportunities
- `login.html` — repurposed as `submit.html`

## Repository

- Remote: git@github.com:GiorgiBurjaliani/webfinalproject.git
- Branch: master
- Lecturer commit: 8621970 Initial commit (preserved)
- GitHub owner: GiorgiBurjaliani
- GitHub repo: webfinalproject

## Adaptation note

The lecturer template used login.html for a simple name-based auth flow.
OpportunityHub does not require authentication. That HTML page slot is
repurposed as submit.html (Suggest an Opportunity form). All other
template filenames and folder structure are preserved.
