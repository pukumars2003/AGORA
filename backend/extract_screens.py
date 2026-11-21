import re
import json

with open(r'd:\Prj\AGORA\Swasthya Sahayak – App Screens.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Look for titles, screen names, or headings in the bundled html
# Find text inside JSON or scripts
print("File length:", len(text))
snippets = set()
for match in re.finditer(r'>([^<]{3,60})<', text):
    s = match.group(1).strip()
    if s and not s.startswith('{') and not s.startswith('/*') and not s.startswith('function'):
        snippets.add(s)

print("Unique HTML tag contents found:", len(snippets))
for s in sorted(list(snippets))[:40]:
    print("  *", s)
