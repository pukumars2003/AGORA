with open('screen5.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'>([^<]{4,100})<', text)
unique = list(dict.fromkeys([m.strip() for m in matches if m.strip()]))
print('Found texts:')
for t in unique[:40]:
    print(' -', t)
