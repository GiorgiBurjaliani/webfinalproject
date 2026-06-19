import urllib.request
import json
import re

url = "https://api.github.com/repos/GiorgiBurjaliani/webfinalproject/issues?state=all&per_page=100"
req = urllib.request.Request(
    url,
    headers={"User-Agent": "Mozilla/5.0", "Accept": "application/vnd.github+json"}
)

def extract_field(body, name):
    if not body:
        return ""
    m = re.search(rf"\*\*{name}:\*\*\s*(.*)", body, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return ""

try:
    with urllib.request.urlopen(req) as response:
        issues = json.loads(response.read().decode())
        print(f"Total issues fetched: {len(issues)}")
        for issue in sorted(issues, key=lambda x: x['number']):
            num = issue['number']
            labels = [l['name'] for l in issue.get('labels', [])]
            body = issue.get('body', '')
            source_url = extract_field(body, "Official Source URL") or extract_field(body, "Official URL")
            reg_url = extract_field(body, "Official Registration URL") or extract_field(body, "Official URL")
            print(f"#{num}: {issue['title']}")
            print(f"  Labels: {labels}")
            print(f"  Source URL: {source_url}")
            print(f"  Reg URL: {reg_url}")
            print("-" * 40)
except Exception as e:
    print(f"Error: {e}")
