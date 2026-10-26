"""Build the delivered single-file site. Python standard library only.
Authoring: src/*; published project data: project-data.json and project-media.json.
The backend is optional for viewing, required for verified direct consultation delivery.
"""
import base64
import html
import json
import mimetypes
from pathlib import Path
root=Path(__file__).resolve().parents[1]
projects=json.loads((root/'project-data.json').read_text())['projects']
photography=json.loads((root/'project-media.json').read_text())['projects']
showcase={'mysore-union':'assets/mysore-union.webp','cosmopolitan-club':'assets/project-gallery/cosmopolitan-club-1.webp','continental-inn':'assets/project-gallery/continental-inn-1.webp','iconic-resto-pub':'assets/project-gallery/iconic-resto-pub-3.webp','mica':'assets/project-gallery/mica-2.webp','rahul-cafe':'assets/project-gallery/rahul-cafe-2.webp'}
for p in projects:
 p['gallery']=photography[p['slug']]['gallery']
 p['showcase']=showcase[p['slug']]
def uri(path,mime=None):
 data=path.read_bytes()
 return 'data:'+(mime or mimetypes.guess_type(path.name)[0] or 'application/octet-stream')+';base64,'+base64.b64encode(data).decode()
paths={p['image'] for p in projects}|set(showcase.values())
for p in projects:paths.update(g['path'] for g in p['gallery'])
bank={path:uri(root/path) for path in sorted(paths)}
nav=[]
for i,p in enumerate(projects):
 nav.append(f'<button class="{"active" if i==0 else ""}" aria-current="{"true" if i==0 else "false"}" aria-label="Show {html.escape(p["name"])}"><img src="{p["showcase"]}" alt="" loading="lazy"><span><small>0{i+1}</small>{html.escape(p["name"])}</span></button>')
page=(root/'src/index.template.html').read_text()
replacements={'__SITE_CSS__':(root/'src/site.css').read_text(),'__PROJECT_NAV__':'\n'.join(nav),'__SITE_JS__':(root/'src/site.js').read_text().replace('__PROJECT_DATA__',json.dumps(projects,ensure_ascii=False)),'__CONTACT_JS__':(root/'scripts/contact-form.js').read_text(),'__MEDIA_BANK__':json.dumps(bank,separators=(',',':'))}
for marker,value in replacements.items():page=page.replace(marker,value)
for marker,name in [('__THREE_MODULE__','three.module.min.js'),('__THREE_CORE__','three.core.min.js'),('__LENIS_MODULE__','lenis.mjs')]:
 text=(root/'vendor'/name).read_text().replace('./three.core.min.js','three/core')
 page=page.replace(marker,'data:text/javascript;base64,'+base64.b64encode(text.encode()).decode())
for asset in (root/'assets').rglob('*'):
 if not asset.is_file():continue
 ref=str(asset.relative_to(root))
 if 'src="'+ref+'"' not in page and "url('"+ref+"')" not in page:continue
 embedded=bank.get(ref) or uri(asset)
 page=page.replace('src="'+ref+'"','src="'+embedded+'"').replace("url('"+ref+"')","url('"+embedded+"')")
for filename in ['index.html','standalone.html']:(root/filename).write_text(page)
print(f'Built cream/beige cinematic site: {len(bank)} embedded project photographs; optional server.py consultation bridge.')
