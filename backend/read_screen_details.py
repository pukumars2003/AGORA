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

# Screen 7: Voice assistant
voice_asset = manifest["d058ea31-1170-4513-be7c-41aa2e403406"]
raw_voice = base64.b64decode(voice_asset["data"])
voice_content = gzip.decompress(raw_voice).decode("utf-8")

# Extract visible texts
def get_clean_texts(html):
    texts = re.findall(r'>([^<]+)<', html)
    return [t.strip() for t in texts if t.strip() and not t.strip().startswith('{') and not t.strip().startswith('/*') and len(t.strip()) > 1]

print("=== SCREEN 6 (LANGUAGE SELECTION) TEXTS ===")
for t in get_clean_texts(content)[:35]:
    print(" ", t)

print("\n=== SCREEN 7 (VOICE ASSISTANT) TEXTS ===")
for t in get_clean_texts(voice_content)[:40]:
    print(" ", t)
