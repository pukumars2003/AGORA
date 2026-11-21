import re
import json
import base64
import gzip

with open(r'd:\Prj\AGORA\Swasthya Sahayak – App Screens.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

m = re.search(r'<script type="__bundler/manifest">([\s\S]*?)</script>', text)
manifest = json.loads(m.group(1))

# Screen 6: 74c5afb8-ab54-48c5-8f72-245aa973232f
lang_asset = manifest["74c5afb8-ab54-48c5-8f72-245aa973232f"]
raw = base64.b64decode(lang_asset["data"])
content = gzip.decompress(raw).decode("utf-8")

# Extract the JSX/React component in screen 6
scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', content)
for i, s in enumerate(scripts):
    if "Choose your language" in s or "languages" in s.lower() or "hindi" in s.lower():
        print(f"--- Script {i} in Screen 6 ---")
        print(s[:2000])
