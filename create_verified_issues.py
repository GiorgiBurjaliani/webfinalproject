#!/usr/bin/env python3
import json
import urllib.request
import urllib.error
import sys
import os
import re

# 6 verified real-world opportunities to create
OPPORTUNITIES = [
    {
        "title": "MLH Global Hack Week: Season Launch",
        "organizer": "Major League Hacking",
        "labels": ["category:hackathon", "format:online", "funding:free", "region:worldwide", "data:verified", "source:official"],
        "source_url": "https://ghw.mlh.com/events/season-launch",
        "reg_url": "https://events.mlh.com/events/14284-global-hack-week-season-launch",
        "body": (
            "**Organizer:** Major League Hacking\n"
            "**Category:** Hackathon\n"
            "**Format:** Online\n"
            "**Funding:** Free\n"
            "**Region:** Worldwide\n"
            "**Location:** Online\n"
            "**Application Deadline:** Not specified by the organizer\n"
            "**Start Date:** 2026-07-10\n"
            "**End Date:** 2026-07-16\n"
            "**Eligibility:** Open to participants worldwide\n"
            "**Age Requirement:** Not specified\n"
            "**Experience Required:** Not specified\n"
            "**Official Registration URL:** https://events.mlh.com/events/14284-global-hack-week-season-launch\n"
            "**Official Source URL:** https://ghw.mlh.com/events/season-launch\n"
            "**Verified On:** 2026-06-20\n"
            "**Data Type:** Verified\n\n"
            "### Summary\n"
            "MLH Global Hack Week: Season Launch is a week-long online event marking the launch of the new MLH season, featuring hackathons, workshops, and community events.\n\n"
            "### Description\n"
            "This online event serves as the launchpad for Major League Hacking's new season. Participants can engage in various programming challenges, attend technical workshops, and collaborate with peers worldwide on software projects.\n\n"
            "### Benefits\n"
            "Access to workshops, community-led activities, and digital badges/rewards for completing challenges."
        )
    },
    {
        "title": "Reddit’s Games with a Hook Hackathon",
        "organizer": "Reddit",
        "labels": ["category:hackathon", "format:online", "funding:free", "region:worldwide", "data:verified", "source:official"],
        "source_url": "https://redditgameswithahook.devpost.com/",
        "reg_url": "https://redditgameswithahook.devpost.com/",
        "body": (
            "**Organizer:** Reddit\n"
            "**Category:** Hackathon\n"
            "**Format:** Online\n"
            "**Funding:** Free\n"
            "**Region:** Worldwide\n"
            "**Location:** Online\n"
            "**Application Deadline:** 2026-07-15\n"
            "**Start Date:** 2026-06-17\n"
            "**End Date:** 2026-07-15\n"
            "**Eligibility:** Not specified\n"
            "**Age Requirement:** Not specified\n"
            "**Experience Required:** Not specified\n"
            "**Official Registration URL:** https://redditgameswithahook.devpost.com/\n"
            "**Official Source URL:** https://redditgameswithahook.devpost.com/\n"
            "**Verified On:** 2026-06-20\n"
            "**Data Type:** Verified\n\n"
            "### Summary\n"
            "Reddit's Games with a Hook Hackathon, partnered with Phaser, is an online game development competition where participants build interactive games using Reddit's developer platform.\n\n"
            "### Description\n"
            "This hackathon invites developers to build games utilizing Reddit's Devvit platform and the Phaser game engine. Participants create unique, interactive experiences integrated into the Reddit community ecosystem.\n\n"
            "### Benefits\n"
            "Prizes and recognition from Reddit and Phaser for outstanding game submissions."
        )
    },
    {
        "title": "ARC Prize 2026 — ARC-AGI-2 Competition",
        "organizer": "ARC Prize Foundation",
        "labels": ["category:competition", "format:online", "funding:free", "region:worldwide", "data:verified", "source:official"],
        "source_url": "https://arcprize.org/competitions/2026/arc-agi-2",
        "reg_url": "https://www.kaggle.com/competitions/arc-prize-2026-arc-agi-2",
        "body": (
            "**Organizer:** ARC Prize Foundation\n"
            "**Category:** Competition\n"
            "**Format:** Online\n"
            "**Funding:** Free\n"
            "**Region:** Worldwide\n"
            "**Location:** Online\n"
            "**Application Deadline:** 2026-11-02\n"
            "**Start Date:** 2026-03-25\n"
            "**End Date:** 2026-11-02\n"
            "**Eligibility:** Not specified\n"
            "**Age Requirement:** Not specified\n"
            "**Experience Required:** Not specified\n"
            "**Official Registration URL:** https://www.kaggle.com/competitions/arc-prize-2026-arc-agi-2\n"
            "**Official Source URL:** https://arcprize.org/competitions/2026/arc-agi-2\n"
            "**Verified On:** 2026-06-20\n"
            "**Data Type:** Verified\n\n"
            "### Summary\n"
            "ARC Prize 2026 - ARC-AGI-2 Competition is an online machine learning challenge hosted on Kaggle focused on abstract reasoning and artificial general intelligence.\n\n"
            "### Description\n"
            "This contest tasks participants with developing algorithms that solve abstract reasoning puzzles. It aims to advance research in artificial general intelligence by testing program synthesis capabilities on novel tasks.\n\n"
            "### Benefits\n"
            "Cash prizes for top-ranking models and contribution to artificial general intelligence research."
        )
    },
    {
        "title": "Social Shifters Global Innovation Challenge 2026",
        "organizer": "Social Shifters",
        "labels": ["category:startup-challenge", "format:online", "funding:free", "region:worldwide", "data:verified", "source:official"],
        "source_url": "https://www.socialshifters.co/global-innovation-challenge/",
        "reg_url": "https://globalinnovationchallenge.awardsplatform.com/",
        "body": (
            "**Organizer:** Social Shifters\n"
            "**Category:** Startup Challenge\n"
            "**Format:** Online\n"
            "**Funding:** Free\n"
            "**Region:** Worldwide\n"
            "**Location:** Online\n"
            "**Application Deadline:** 2026-08-31\n"
            "**Start Date:** 2026-06-01\n"
            "**End Date:** Not specified by the organizer\n"
            "**Eligibility:** Youth-led impact projects and startups led by founders aged 18–30\n"
            "**Age Requirement:** 18–30 years old\n"
            "**Experience Required:** Not specified\n"
            "**Official Registration URL:** https://globalinnovationchallenge.awardsplatform.com/\n"
            "**Official Source URL:** https://www.socialshifters.co/global-innovation-challenge/\n"
            "**Verified On:** 2026-06-20\n"
            "**Data Type:** Verified\n\n"
            "### Summary\n"
            "Social Shifters Global Innovation Challenge 2026 is an online competition for young founders developing projects to solve social and environmental issues.\n\n"
            "### Description\n"
            "This global program supports youth-led startups and projects that address climate change, inequality, or other community issues. It offers training and incubation resources to help teams scale their social impact.\n\n"
            "### Benefits\n"
            "Grant awards of up to USD 15,000 and specialized founder support."
        )
    },
    {
        "title": "EU Agri-Hackathon 2026",
        "organizer": "European Commission — Directorate-General for Agriculture and Rural Development",
        "labels": ["category:hackathon", "format:in-person", "funding:free", "region:europe", "data:verified", "source:official"],
        "source_url": "https://agriculture.ec.europa.eu/overview-vision-agriculture-food/digitalisation/eu-agri-hackathon_en",
        "reg_url": "https://ec.europa.eu/eusurvey/runner/c3d3ee12-5d96-ff9e-5b4a-9b183a9f2b69",
        "body": (
            "**Organizer:** European Commission — Directorate-General for Agriculture and Rural Development\n"
            "**Category:** Hackathon\n"
            "**Format:** In-person\n"
            "**Funding:** Free\n"
            "**Region:** Europe\n"
            "**Location:** Not specified in the structured record; use the official page for current venue information\n"
            "**Application Deadline:** 2026-08-31\n"
            "**Start Date:** 2026-10-16\n"
            "**End Date:** 2026-10-18\n"
            "**Eligibility:** EU citizens aged 18 or older who are sufficiently fluent in English\n"
            "**Age Requirement:** 18 or older\n"
            "**Experience Required:** Not specified\n"
            "**Official Registration URL:** https://ec.europa.eu/eusurvey/runner/c3d3ee12-5d96-ff9e-5b4a-9b183a9f2b69\n"
            "**Official Source URL:** https://agriculture.ec.europa.eu/overview-vision-agriculture-food/digitalisation/eu-agri-hackathon_en\n"
            "**Verified On:** 2026-06-20\n"
            "**Data Type:** Verified\n\n"
            "### Summary\n"
            "EU Agri-Hackathon 2026 is an in-person hackathon organized by the European Commission focusing on digital solutions and innovation for agriculture and rural development.\n\n"
            "### Description\n"
            "This physical event gathers developers, researchers, and agriculture experts to build technology prototypes that address digital needs in European farming and rural communities.\n\n"
            "### Benefits\n"
            "Collaboration with EU policy makers and certificate of participation."
        )
    },
    {
        "title": "The GIB 2026 Startup Challenge",
        "organizer": "Social Nest Foundation",
        "labels": ["category:startup-challenge", "format:in-person", "funding:free", "region:europe", "data:verified", "source:official"],
        "source_url": "https://thegapinbetween.com/startup-challenge",
        "reg_url": "https://www.f6s.com/the-gib-2026-startup-challenge/apply",
        "body": (
            "**Organizer:** Social Nest Foundation\n"
            "**Category:** Startup Challenge\n"
            "**Format:** In-person\n"
            "**Funding:** Free\n"
            "**Region:** Europe\n"
            "**Location:** Valencia, Spain\n"
            "**Application Deadline:** 2026-07-21\n"
            "**Start Date:** 2026-10-20\n"
            "**End Date:** 2026-10-20\n"
            "**Eligibility:** Impact-driven startups with validated products or market traction\n"
            "**Age Requirement:** Not specified\n"
            "**Experience Required:** Not specified\n"
            "**Official Registration URL:** https://www.f6s.com/the-gib-2026-startup-challenge/apply\n"
            "**Official Source URL:** https://thegapinbetween.com/startup-challenge\n"
            "**Verified On:** 2026-06-20\n"
            "**Data Type:** Verified\n\n"
            "### Summary\n"
            "The GIB 2026 Startup Challenge is an in-person challenge in Valencia, Spain, for impact-driven startups with market traction.\n\n"
            "### Description\n"
            "Hosted by the Social Nest Foundation, this event highlights startups building solutions for environmental sustainability, social inclusion, and ethical technologies. Selected founders pitch to international investors.\n\n"
            "### Benefits\n"
            "EUR 10,000 prize and access to an international impact-innovation ecosystem."
        )
    }
]

def normalize(val):
    if not val:
        return ""
    return re.sub(r"[^\w\s]", "", val.strip().lower())

def extract_field(body, name):
    if not body:
        return ""
    m = re.search(rf"\*\*{name}:\*\*\s*(.*)", body, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return ""

def main():
    owner = "GiorgiBurjaliani"
    repo = "webfinalproject"
    
    # Check for authentication token in environment
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    auth_available = "Yes" if token else "No"
    
    print("=" * 60)
    print("  GITHUB ISSUES VERIFICATION & CREATION TOOL")
    print("=" * 60)
    print(f"Repository Owner: {owner}")
    print(f"Repository Name:  {repo}")
    print(f"Authentication Available: {auth_available}")
    print("=" * 60)
    
    # 1. Fetch existing open issues
    print("Fetching existing open issues from GitHub...")
    existing_issues = []
    page = 1
    while True:
        list_url = f"https://api.github.com/repos/{owner}/{repo}/issues?state=open&per_page=100&page={page}"
        req = urllib.request.Request(list_url, method="GET")
        req.add_header("Accept", "application/vnd.github+json")
        req.add_header("User-Agent", "OpportunityHub-Creation-Script")
        if token:
            req.add_header("Authorization", f"token {token}")
        try:
            with urllib.request.urlopen(req) as res:
                issues = json.loads(res.read().decode("utf-8"))
                if not issues:
                    break
                # Filter out PRs
                for issue in issues:
                    if "pull_request" not in issue:
                        existing_issues.append(issue)
                if len(issues) < 100:
                    break
                page += 1
        except Exception as e:
            print(f"Warning: Could not fetch existing open issues: {e}")
            break

    print(f"Found {len(existing_issues)} open issues on GitHub.")
    print("-" * 60)
    
    # Identify old verified issues (11-20) to close in write mode
    old_verified_to_close = [iss for iss in existing_issues if 11 <= iss["number"] <= 20]
    
    # Filter open issues to only consider demo issues (1-10) and newly created issues (>20) for duplicate checks
    dup_check_issues = [iss for iss in existing_issues if not (11 <= iss["number"] <= 20)]
    
    # Prepare preview rows
    preview_rows = []
    to_create = []
    
    for opp in OPPORTUNITIES:
        title = opp["title"]
        src_url = opp["source_url"]
        reg_url = opp["reg_url"]
        
        # Check duplicate
        is_dup = False
        norm_title = normalize(title)
        for ex in dup_check_issues:
            ex_title = normalize(ex["title"])
            ex_body = ex.get("body", "")
            ex_src = extract_field(ex_body, "Official Source URL") or extract_field(ex_body, "Official URL")
            ex_reg = extract_field(ex_body, "Official Registration URL") or extract_field(ex_body, "Official URL")
            
            if norm_title == ex_title or (normalize(src_url) == normalize(ex_src) and normalize(reg_url) == normalize(ex_reg)):
                is_dup = True
                break
        
        if is_dup:
            status = "Skipped: verified opportunity already exists."
        else:
            status = "Ready to Create"
            to_create.append(opp)
            
        preview_rows.append({
            "title": title,
            "source_url": src_url,
            "reg_url": reg_url,
            "organizer": opp["organizer"],
            "status": status
        })
        
    # Print preview
    print("\nFINAL CREATION PREVIEW (6 ROWS):\n")
    for idx, row in enumerate(preview_rows, 1):
        print(f"{idx}. Title:      {row['title']}")
        print(f"   Organizer:  {row['organizer']}")
        print(f"   Source URL: {row['source_url']}")
        print(f"   Reg URL:    {row['reg_url']}")
        print(f"   Status:     {row['status']}")
        print("-" * 50)
        
    write_mode = "--write" in sys.argv
    
    if not write_mode:
        print("\n[Dry Run] To perform actual creation, set the GITHUB_TOKEN environment variable")
        print("and run with the --write flag.")
        print("Example:")
        print("  $env:GITHUB_TOKEN=\"ghp_xxxx\"")
        print("  python create_verified_issues.py --write")
        sys.exit(0)
        
    if not token:
        print("\nError: Authentication token not available. Please set GITHUB_TOKEN environment variable.")
        sys.exit(1)
        
    # Write mode - Close old issues 11-20
    if old_verified_to_close:
        print(f"\nClosing {len(old_verified_to_close)} outdated verified issues (11-20)...")
        for iss in old_verified_to_close:
            num = iss["number"]
            print(f"Closing Issue #{num}: '{iss['title']}'...")
            close_url = f"https://api.github.com/repos/{owner}/{repo}/issues/{num}"
            payload = {"state": "closed"}
            data_bytes = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(close_url, data=data_bytes, method="PATCH")
            req.add_header("Authorization", f"token {token}")
            req.add_header("Accept", "application/vnd.github+json")
            req.add_header("User-Agent", "OpportunityHub-Creation-Script")
            req.add_header("Content-Type", "application/json")
            try:
                with urllib.request.urlopen(req) as res:
                    print(f"-> Successfully closed Issue #{num}")
            except Exception as e:
                print(f"-> Failed to close Issue #{num}: {e}")
                
    # Write mode - perform creation
    print(f"\nWriting to GitHub... ({len(to_create)} issues to create)")
    create_url = f"https://api.github.com/repos/{owner}/{repo}/issues"
    
    for opp in to_create:
        print(f"\nCreating issue: '{opp['title']}'...")
        payload = {
            "title": opp["title"],
            "body": opp["body"],
            "labels": opp["labels"]
        }
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(create_url, data=data_bytes, method="POST")
        req.add_header("Authorization", f"token {token}")
        req.add_header("Accept", "application/vnd.github+json")
        req.add_header("User-Agent", "OpportunityHub-Creation-Script")
        req.add_header("Content-Type", "application/json")
        
        try:
            with urllib.request.urlopen(req) as res:
                res_data = json.loads(res.read().decode("utf-8"))
                issue_num = res_data.get("number")
                print(f"-> SUCCESS! Created Issue #{issue_num}")
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

if __name__ == "__main__":
    main()
