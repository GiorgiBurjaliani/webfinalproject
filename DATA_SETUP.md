# Opportunity Data Setup Guide

OpportunityHub uses the **GitHub Issues REST API** as a read-only database. This means you can add, edit, or close opportunities in real time directly from your repository's GitHub Issues tab.

---

## ◈ How the Data Flow Works

1. **GitHub Issues**: You create an Issue on GitHub representing an opportunity.
2. **REST API Request**: The app calls the GitHub endpoint `https://api.github.com/repos/GiorgiBurjaliani/webfinalproject/issues?state=open`.
3. **Normalizer (`js/parser.js`)**: The app parses the Issue body text and labels using matching rules.
4. **Interactive Feed (`js/ui.js` / `js/main.js`)**: Cards are built and rendered dynamically.

---

## ◈ Required Labels

To make filters work correctly, assign the following labels to your GitHub Issues. They must use the exact format below:

| Label Group | Allowed Label Values |
| :--- | :--- |
| **Category** | `category:hackathon`, `category:camp`, `category:ai-camp`, `category:competition`, `category:startup-challenge`, `category:bootcamp`, `category:workshop`, `category:conference`, `category:youth-program` |
| **Format** | `format:online`, `format:in-person`, `format:hybrid` |
| **Funding** | `funding:free`, `funding:paid`, `funding:fully-funded`, `funding:partially-funded` |
| **Region** | `region:georgia`, `region:europe`, `region:online`, `region:worldwide` |

---

## ◈ Issue Body Format

When creating a new opportunity, paste the following template into the description of the GitHub Issue. Feel free to fill out or omit fields as needed.

```markdown
**Organizer:** Google Developer Groups Georgia
**Format:** Hybrid
**Funding:** Free
**Region:** Georgia
**City / Location:** Tbilisi, Georgia
**Application Deadline:** 2025-10-15
**Start Date:** 2025-11-01
**End Date:** 2025-11-03
**Official URL:** https://example.com/gdg-hackathon-2025
**Image URL:** https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800

### Eligibility
Open to university students and high-school seniors interested in web engineering and AI.

### Age Requirement
16 to 25 years old.

### Experience
No prior programming experience required. Mentorship is provided.

### Description
Join the largest student hackathon in the Caucasus region. Teams will have 48 hours to design, prototype, and pitch web applications that address community needs.

### Benefits
- Total prize pool of 10,000 GEL.
- Internship opportunities at leading Georgian tech firms.
- Free food, energy drinks, and cool developer merch.
```

---

## ◈ Important Parsing Rules

- **Field Headers**: The parser looks for bold lines (`**Field Name:** value`) or GitHub markdown section headers (`### Field Name`). Keep them spelled exactly as shown above.
- **URLs**: The `Official URL` and `Image URL` must begin with `http://` or `https://` to be loaded.
- **Dates**: Enter dates using standard ISO formats (e.g. `YYYY-MM-DD`). The app automatically formats them into reader-friendly layouts (e.g., `15 Oct 2025`).
- **Pull Requests**: Pull Requests also pass through the issues API. The parser automatically detects and filters them out.
- **State**: Only **open** issues are fetched. To remove an opportunity from the feed, simply close the issue on GitHub.
