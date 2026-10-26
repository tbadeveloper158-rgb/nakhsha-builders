"""Regenerate the self-contained HTML export using only Python's standard library."""
import base64
import mimetypes
from pathlib import Path

root = Path(__file__).resolve().parents[1]
page = (root / 'index.html').read_text(encoding='utf-8')
for asset in sorted((root / 'assets').iterdir()):
    reference = 'assets/' + asset.name
    if reference not in page:
        continue
    mime = mimetypes.guess_type(asset.name)[0] or 'application/octet-stream'
    embedded = 'data:' + mime + ';base64,' + base64.b64encode(asset.read_bytes()).decode('ascii')
    page = page.replace(reference, embedded)
(root / 'standalone.html').write_text(page, encoding='utf-8')
print('Exported standalone.html with embedded assets.')
