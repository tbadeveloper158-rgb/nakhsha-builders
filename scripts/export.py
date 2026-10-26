"""Assemble the reference-driven site and embed all local assets into one HTML file.
Run with Python 3. No package dependencies. The delivered index.html needs no build step.
"""
import base64
import html
import json
import mimetypes
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'project-data.json').read_text(encoding='utf-8'))['projects']
rows=[]
for i,p in enumerate(data):
 esc=lambda x:html.escape(str(x),quote=True)
 rows.append(f'''<article class="project-row" data-index="{i}" aria-labelledby="project-{i}"><button class="project-image" data-project="{i}" aria-label="Explore {esc(p['name'])}" aria-haspopup="dialog"><img src="{p['image']}" alt="{esc(p['name'])} — published Nakhsha Builders project photograph" loading="lazy"><span class="image-index">PROJECT_0{i+1} / MYSURU</span><span class="image-view"><svg class="arrow" aria-hidden="true"><use href="#arrow"/></svg></span></button><div class="project-copy" data-reveal><div class="project-index" aria-hidden="true">0{i+1}</div><span class="eyebrow">{esc(p['sector'])}</span><h3 class="display" id="project-{i}" data-words>{esc(p['name'])}</h3><p>{esc(p['description'])}</p><div class="project-tags"><span>{esc(p['location'])}</span><span>{esc(p['status'])}</span></div><button class="project-detail-link" data-project="{i}" aria-haspopup="dialog">Explore project <svg class="arrow" aria-hidden="true"><use href="#arrow"/></svg></button></div></article>''')
page=(root/'src/index.template.html').read_text(encoding='utf-8')
replacements={'__SITE_CSS__':(root/'src/site.css').read_text(),'__PROJECT_ROWS__':'\n'.join(rows),'__CONTOUR_JS__':(root/'scripts/contour-field.js').read_text(),'__DRAFTING_JS__':(root/'scripts/drafting-canvas.js').read_text(),'__SITE_JS__':(root/'src/site.js').read_text().replace('__PROJECT_DATA__',json.dumps(data,ensure_ascii=False))}
for marker,value in replacements.items():page=page.replace(marker,value)
# Keep the two reference libraries inside the HTML import map, so the delivered file
# also works offline. Vendor files were extracted from SHA512-verified npm packages.
module=(root/'vendor/three.module.min.js').read_text().replace('./three.core.min.js','three/core')
module_uri='data:text/javascript;base64,'+base64.b64encode(module.encode()).decode()
core_uri='data:text/javascript;base64,'+base64.b64encode((root/'vendor/three.core.min.js').read_bytes()).decode()
lenis_uri='data:text/javascript;base64,'+base64.b64encode((root/'vendor/lenis.mjs').read_bytes()).decode()
page=page.replace('"three":"https://cdn.jsdelivr.net/npm/three@0.185.0/build/three.module.js"','"three":'+json.dumps(module_uri)+',"three/core":'+json.dumps(core_uri))
page=page.replace('"lenis":"https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.mjs"','"lenis":'+json.dumps(lenis_uri))
# Embed the referenced local assets; modal images read their source from the embedded project images.
for asset in sorted((root/'assets').iterdir()):
 reference='assets/'+asset.name
 if reference not in page:continue
 mime=mimetypes.guess_type(asset.name)[0] or 'application/octet-stream'
 embedded='data:'+mime+';base64,'+base64.b64encode(asset.read_bytes()).decode('ascii')
 # JSON data retains readable provenance; only HTML/CSS URLs need embedding.
 page=page.replace('src="'+reference+'"','src="'+embedded+'"').replace("url('"+reference+"')","url('"+embedded+"')")
(root/'index.html').write_text(page,encoding='utf-8')
(root/'standalone.html').write_text(page,encoding='utf-8')
print('Built index.html and standalone.html with embedded local fonts/images; Three.js and Lenis are embedded through the import map.')
