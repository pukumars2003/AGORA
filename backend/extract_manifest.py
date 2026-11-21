import re
import json
import base64
import gzip

with open(r'd:\Prj\AGORA\Swasthya Sahayak – App Screens.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Extract the manifest script
m = re.search(r'<script type="__bundler/manifest">([\s\S]*?)</script>', text)
if m:
    manifest = json.loads(m.group(1))
    for k, v in manifest.items():
        data = base64.b64decode(v["data"])
        if v.get("compressed"):
            try:
                data = gzip.decompress(data)
            except Exception as e:
                pass
        content = data.decode("utf-8", errors="ignore")
        print(f"Asset {k} ({v.get('mime')}): {len(content)} chars")
        # Search for screen texts in content
        titles = re.findall(r'<[^>]*>([^<]{3,80})<', content)
        screen_texts = [t.strip() for t in titles if any(w in t.lower() for w in ['login', 'language', 'voice', 'patient', 'doctor', 'select', 'swasthya', 'hindi', 'kannada', 'telugu'])]
        print("  Found screen titles/text:", screen_texts[:20])

t_match = re.search(r'<script type="__bundler/template">([\s\S]*?)</script>', text)
if t_match:
    template = json.loads(t_match.group(1))
    print(f"Template length: {len(template)}")
    # Find text in template
    t_titles = re.findall(r'<[^>]*>([^<]{3,80})<', template)
    print("  Template titles:", [t.strip() for t in t_titles if t.strip()][:30])
