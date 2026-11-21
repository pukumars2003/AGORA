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

# Find JSX or HTML structure inside
for match in re.finditer(r'Choose your language[\s\S]{1,1500}', content):
    print("MATCH IN SCREEN 6:")
    print(match.group(0))

voice_asset = manifest["d058ea31-1170-4513-be7c-41aa2e403406"]
raw_voice = base64.b64decode(voice_asset["data"])
voice_content = gzip.decompress(raw_voice).decode("utf-8")
for match in re.finditer(r'Talk to your assistant[\s\S]{1,2500}', voice_content):
    print("\nMATCH IN SCREEN 7 (VOICE):")
    print(match.group(0))
