#!/usr/bin/env python3
import json
import urllib.request
import urllib.error
import sys

# Demo opportunities used to populate the feed during testing.
# Each item gets the 'data:demo' label.
OPPORTUNITIES = [
    {
        "title": "Tbilisi AI Student Hackathon 2025",
        "labels": ["category:hackathon", "format:hybrid", "funding:free", "region:georgia", "data:demo"],
        "body": (
            "**Organizer:** Google Developer Group Tbilisi\n"
            "**Format:** Hybrid\n"
            "**Funding:** Free\n"
            "**Region:** Georgia\n"
            "**City / Location:** Tbilisi, Georgia\n"
            "**Application Deadline:** 2025-10-15\n"
            "**Start Date:** 2025-11-01\n"
            "**End Date:** 2025-11-03\n"
            "**Official URL:** https://example.com/gdg-hackathon-2025\n"
            "**Image URL:** https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800\n\n"
            "### Eligibility\n"
            "Open to university students and high-school seniors.\n\n"
            "### Age Requirement\n"
            "16 to 25 years old.\n\n"
            "### Experience\n"
            "No prior experience required. Mentorship is provided.\n\n"
            "### Description\n"
            "Join the largest student hackathon in the Caucasus region. Teams will have 48 hours to design and prototype web applications addressing local challenges.\n\n"
            "### Benefits\n"
            "- Total prize pool of 10,000 GEL.\n"
            "- Internship opportunities at top Georgian tech firms.\n"
            "- Free food, drinks, and developer merch."
        )
    },
    {
        "title": "Europe Summer Technology Camp 2025",
        "labels": ["category:camp", "format:in-person", "funding:fully-funded", "region:europe", "data:demo"],
        "body": (
            "**Organizer:** EU Commission for Youth & Tech\n"
            "**Format:** In-person\n"
            "**Funding:** Fully Funded\n"
            "**Region:** Europe\n"
            "**City / Location:** Berlin, Germany\n"
            "**Application Deadline:** 2025-07-01\n"
            "**Start Date:** 2025-08-10\n"
            "**End Date:** 2025-08-20\n"
            "**Official URL:** https://example.com/eu-summer-camp\n"
            "**Image URL:** https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800\n\n"
            "### Eligibility\n"
            "Residents of EU and Eastern Partnership countries.\n\n"
            "### Age Requirement\n"
            "18 to 30 years old.\n\n"
            "### Experience\n"
            "Basic coding knowledge recommended.\n\n"
            "### Description\n"
            "A 10-day immersive camp in Berlin focusing on cybersecurity, blockchain, and green tech.\n\n"
            "### Benefits\n"
            "- Flights, accommodation, and meals fully covered.\n"
            "- Certificate of participation and global networking."
        )
    },
    {
        "title": "Global Cyber Security Challenge",
        "labels": ["category:competition", "format:online", "funding:free", "region:worldwide", "data:demo"],
        "body": (
            "**Organizer:** MIT Cybersecurity Lab\n"
            "**Format:** Online\n"
            "**Funding:** Free\n"
            "**Region:** Worldwide\n"
            "**City / Location:** Online\n"
            "**Application Deadline:** 2025-09-30\n"
            "**Start Date:** 2025-10-10\n"
            "**End Date:** 2025-10-12\n"
            "**Official URL:** https://example.com/mit-cyber-challenge\n"
            "**Image URL:** https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800\n\n"
            "### Eligibility\n"
            "Anyone globally.\n\n"
            "### Age Requirement\n"
            "No age limit.\n\n"
            "### Experience\n"
            "Intermediate to advanced CTF experience recommended.\n\n"
            "### Description\n"
            "An online Capture-The-Flag (CTF) competition focusing on reverse engineering, web security, and cryptography.\n\n"
            "### Benefits\n"
            "- $15,000 total prize pool.\n"
            "- Recruitment opportunities at leading tech security firms."
        )
    },
    {
        "title": "Full-Stack Web Bootcamp 2025",
        "labels": ["category:bootcamp", "format:online", "funding:paid", "region:georgia", "data:demo"],
        "body": (
            "**Organizer:** Tech Academy Georgia\n"
            "**Format:** Online\n"
            "**Funding:** Paid\n"
            "**Region:** Georgia\n"
            "**City / Location:** Tbilisi, Georgia / Online\n"
            "**Application Deadline:** 2025-11-15\n"
            "**Start Date:** 2026-01-10\n"
            "**End Date:** 2026-06-15\n"
            "**Official URL:** https://example.com/tech-academy-bootcamp\n"
            "**Image URL:** https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800\n\n"
            "### Eligibility\n"
            "Georgian speakers looking to transition to software engineering.\n\n"
            "### Age Requirement\n"
            "18+ years old.\n\n"
            "### Experience\n"
            "No prior programming experience required.\n\n"
            "### Description\n"
            "An intensive 6-month bootcamp covering HTML, CSS, JavaScript, React, Node.js, and Databases.\n\n"
            "### Benefits\n"
            "- Interactive lessons and group projects.\n"
            "- Career consulting and job guarantee policy."
        )
    },
    {
        "title": "NASA Space Apps Challenge Tbilisi",
        "labels": ["category:hackathon", "format:in-person", "funding:free", "region:georgia", "data:demo"],
        "body": (
            "**Organizer:** NASA Space Apps Georgia\n"
            "**Format:** In-person\n"
            "**Funding:** Free\n"
            "**Region:** Georgia\n"
            "**City / Location:** Tbilisi, Georgia\n"
            "**Application Deadline:** 2025-10-01\n"
            "**Start Date:** 2025-10-04\n"
            "**End Date:** 2025-10-05\n"
            "**Official URL:** https://example.com/nasa-space-apps-tbilisi\n"
            "**Image URL:** https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800\n\n"
            "### Eligibility\n"
            "Coders, scientists, designers, storytellers, and builders.\n\n"
            "### Age Requirement\n"
            "All ages welcome.\n\n"
            "### Experience\n"
            "Beginners to advanced professionals.\n\n"
            "### Description\n"
            "Create solutions to challenges we face on Earth and in space using NASA's open-source data.\n\n"
            "### Benefits\n"
            "- Global recognition and prizes.\n"
            "- Certifications and mentorship."
        )
    },
    {
        "title": "AWS Cloud Practitioner Workshop",
        "labels": ["category:workshop", "format:online", "funding:free", "region:worldwide", "data:demo"],
        "body": (
            "**Organizer:** Amazon Web Services\n"
            "**Format:** Online\n"
            "**Funding:** Free\n"
            "**Region:** Worldwide\n"
            "**City / Location:** Online\n"
            "**Application Deadline:** 2025-08-25\n"
            "**Start Date:** 2025-08-28\n"
            "**End Date:** 2025-08-28\n"
            "**Official URL:** https://example.com/aws-practitioner-workshop\n"
            "**Image URL:** https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800\n\n"
            "### Eligibility\n"
            "Anyone interested in Cloud technologies.\n\n"
            "### Age Requirement\n"
            "16+ years old.\n\n"
            "### Experience\n"
            "No prior cloud experience required.\n\n"
            "### Description\n"
            "A 4-hour hands-on workshop guiding you through key AWS services and prepping for the certification.\n\n"
            "### Benefits\n"
            "- Free AWS certification voucher (50% off).\n"
            "- AWS training lab access."
        )
    },
    {
        "title": "Silicon Valley Startup Challenge",
        "labels": ["category:startup-challenge", "format:hybrid", "funding:partially-funded", "region:worldwide", "data:demo"],
        "body": (
            "**Organizer:** Y Combinator / TechStars Network\n"
            "**Format:** Hybrid\n"
            "**Funding:** Partially Funded\n"
            "**Region:** Worldwide\n"
            "**City / Location:** San Francisco, USA / Online\n"
            "**Application Deadline:** 2025-09-10\n"
            "**Start Date:** 2025-10-15\n"
            "**End Date:** 2025-11-20\n"
            "**Official URL:** https://example.com/sv-startup-challenge\n"
            "**Image URL:** https://images.unsplash.com/photo-1556761175-b813f53a362d?w=800\n\n"
            "### Eligibility\n"
            "Early-stage student startups and innovators.\n\n"
            "### Age Requirement\n"
            "18+ years old.\n\n"
            "### Experience\n"
            "Must have a working prototype or MVP.\n\n"
            "### Description\n"
            "A 5-week acceleration program culminating in a pitch day in front of top Silicon Valley investors.\n\n"
            "### Benefits\n"
            "- $50,000 funding opportunity.\n"
            "- Travel grants for the final pitch day in San Francisco."
        )
    },
    {
        "title": "EU Youth Leadership Summit 2025",
        "labels": ["category:youth-program", "format:in-person", "funding:fully-funded", "region:europe", "data:demo"],
        "body": (
            "**Organizer:** European Youth Forum\n"
            "**Format:** In-person\n"
            "**Funding:** Fully Funded\n"
            "**Region:** Europe\n"
            "**City / Location:** Strasbourg, France\n"
            "**Application Deadline:** 2025-06-30\n"
            "**Start Date:** 2025-09-05\n"
            "**End Date:** 2025-09-08\n"
            "**Official URL:** https://example.com/eu-youth-summit\n"
            "**Image URL:** https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800\n\n"
            "### Eligibility\n"
            "Citizens and residents of Council of Europe member states.\n\n"
            "### Age Requirement\n"
            "18 to 28 years old.\n\n"
            "### Experience\n"
            "Active involvement in local communities or NGOs.\n\n"
            "### Description\n"
            "A summit addressing policy-making, digital active citizenship, and democracy.\n\n"
            "### Benefits\n"
            "- Accommodation, travel costs, and visa fees fully covered.\n"
            "- Access to European Parliament networking sessions."
        )
    },
    {
        "title": "Caucasus Game Dev Competition",
        "labels": ["category:competition", "format:hybrid", "funding:free", "region:georgia", "data:demo"],
        "body": (
            "**Organizer:** Georgia Game Developers Association\n"
            "**Format:** Hybrid\n"
            "**Funding:** Free\n"
            "**Region:** Georgia\n"
            "**City / Location:** Tbilisi, Georgia / Online\n"
            "**Application Deadline:** 2025-12-01\n"
            "**Start Date:** 2025-12-15\n"
            "**End Date:** 2025-12-20\n"
            "**Official URL:** https://example.com/caucasus-game-dev\n"
            "**Image URL:** https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800\n\n"
            "### Eligibility\n"
            "Indie game developers and student teams from Georgia, Armenia, and Azerbaijan.\n\n"
            "### Age Requirement\n"
            "No limit.\n\n"
            "### Experience\n"
            "Any level (Unity, Unreal, Godot, etc.).\n\n"
            "### Description\n"
            "Showcase your indie game prototype, receive feedback, and pitch to publishers.\n\n"
            "### Benefits\n"
            "- 5,000 GEL grand prize.\n"
            "- Game dev licenses and hardware prizes."
        )
    },
    {
        "title": "Data Science & Machine Learning Camp",
        "labels": ["category:ai-camp", "format:hybrid", "funding:partially-funded", "region:georgia", "data:demo"],
        "body": (
            "**Organizer:** AI Georgia Association\n"
            "**Format:** Hybrid\n"
            "**Funding:** Partially Funded\n"
            "**Region:** Georgia\n"
            "**City / Location:** Tbilisi / Batumi, Georgia\n"
            "**Application Deadline:** 2025-08-01\n"
            "**Start Date:** 2025-09-01\n"
            "**End Date:** 2025-09-14\n"
            "**Official URL:** https://example.com/ai-georgia-camp\n"
            "**Image URL:** https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=800\n\n"
            "### Eligibility\n"
            "Students or graduates in STEM fields.\n\n"
            "### Age Requirement\n"
            "18+ years old.\n\n"
            "### Experience\n"
            "Basic Python and linear algebra background required.\n\n"
            "### Description\n"
            "A 2-week intensive camp on deep learning, NLP, computer vision, and neural network optimization.\n\n"
            "### Benefits\n"
            "- 70% tuition fee coverage scholarship.\n"
            "- Job interviews with Georgian fintech companies."
        )
    }
]

def main():
    print("====================================================")
    print("  OpportunityHub - Create 10 Demo GitHub Issues")
    print("====================================================")
    print("This script will create 10 real, structured tech opportunities")
    print("as Issues in your GitHub repository: GiorgiBurjaliani/webfinalproject.\n")
    
    print("How to get a GitHub Personal Access Token (PAT):")
    print("1. Go to https://github.com/settings/tokens")
    print("2. Click 'Generate new token' -> 'Generate new token (classic)'")
    print("3. Add a note (e.g. 'project-helper') and check the 'repo' scope checkbox")
    print("4. Click 'Generate token' at the bottom and copy the code.\n")
    
    token = input("Please enter your GitHub Personal Access Token (PAT): ").strip()
    if not token:
        print("Error: Access token cannot be empty.")
        sys.exit(1)
        
    owner = "GiorgiBurjaliani"
    repo = "webfinalproject"
    
    # 1. Fetch existing open issues to avoid duplicates
    print("\nFetching existing issues for duplicate check...")
    existing_titles = set()
    page = 1
    while True:
        list_url = f"https://api.github.com/repos/{owner}/{repo}/issues?state=all&per_page=100&page={page}"
        req = urllib.request.Request(list_url, method="GET")
        req.add_header("Authorization", f"token {token}")
        req.add_header("Accept", "application/vnd.github+json")
        req.add_header("User-Agent", "OpportunityHub-Setup-Script")
        try:
            with urllib.request.urlopen(req) as res:
                issues = json.loads(res.read().decode("utf-8"))
                if not issues:
                    break
                for issue in issues:
                    if "pull_request" not in issue:
                        existing_titles.add(issue["title"].strip().lower())
                if len(issues) < 100:
                    break
                page += 1
        except Exception as e:
            print(f"Warning: Could not fetch existing issues for duplicate check: {e}")
            break

    # 2. Create the data:demo label if it does not exist
    print("\nEnsuring 'data:demo' label exists in the repository...")
    label_url = f"https://api.github.com/repos/{owner}/{repo}/labels"
    label_payload = {
        "name": "data:demo",
        "color": "64748b",
        "description": "Educational demo data opportunity"
    }
    label_data = json.dumps(label_payload).encode("utf-8")
    req = urllib.request.Request(label_url, data=label_data, method="POST")
    req.add_header("Authorization", f"token {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "OpportunityHub-Setup-Script")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as res:
            print("-> Successfully created 'data:demo' label on GitHub.")
    except urllib.error.HTTPError as e:
        if e.code == 422:
            print("-> Label 'data:demo' already exists.")
        else:
            print(f"-> Warning: Could not ensure 'data:demo' label exists (HTTP {e.code})")
    except Exception as e:
        print(f"-> Warning: Could not ensure 'data:demo' label exists: {e}")

    # 3. Create opportunities
    url = f"https://api.github.com/repos/{owner}/{repo}/issues"
    success_count = 0
    
    for idx, opp in enumerate(OPPORTUNITIES, start=1):
        normalized_title = opp["title"].strip().lower()
        if normalized_title in existing_titles:
            print(f"\n[{idx}/10] Skipped: opportunity '{opp['title']}' already exists.")
            continue
            
        print(f"\n[{idx}/10] Creating issue: '{opp['title']}'...")
        
        payload = {
            "title": opp["title"],
            "body": opp["body"],
            "labels": opp["labels"]
        }
        
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, method="POST")
        req.add_header("Authorization", f"token {token}")
        req.add_header("Accept", "application/vnd.github+json")
        req.add_header("User-Agent", "OpportunityHub-Setup-Script")
        req.add_header("Content-Type", "application/json")
        
        try:
            with urllib.request.urlopen(req) as res:
                res_data = json.loads(res.read().decode("utf-8"))
                issue_num = res_data.get("number")
                print(f"-> SUCCESS! Created Issue #{issue_num}")
                success_count += 1
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8")
            print(f"-> FAILED (HTTP {e.code})")
            try:
                err_json = json.loads(err_msg)
                print(f"   Reason: {err_json.get('message')}")
            except:
                print(f"   Response: {err_msg[:200]}")
        except Exception as e:
            print(f"-> FAILED: {str(e)}")
            
    print("\n====================================================")
    print(f"Done! Successfully created {success_count} new issues.")
    print("Open http://localhost:8000/ to see them on your live feed!")
    print("====================================================")

if __name__ == "__main__":
    main()
