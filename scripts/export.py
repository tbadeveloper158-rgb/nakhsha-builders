"""Rebuild the single-file warm architectural site; Python standard library only."""
import base64
import html
import json
import mimetypes
from pathlib import Path
root=Path(__file__).resolve().parents[1]
projects=json.loads((root/'project-data.json').read_text())['projects']
photography=json.loads((root/'project-media.json').read_text())['projects']
for p in projects:p['gallery']=photography[p['slug']]['gallery']
def uri(path):return 'data:'+(mimetypes.guess_type(path.name)[0] or 'application/octet-stream')+';base64,'+base64.b64encode(path.read_bytes()).decode()
paths={p['image'] for p in projects}
for p in projects:paths.update(g['path'] for g in p['gallery'])
bank={path:uri(root/path) for path in sorted(paths)}
rows=[]
for i,p in enumerate(projects):
 e=lambda value:html.escape(str(value),quote=True)
 rows.append(f'''<article class="project-row" data-index="{i}" aria-labelledby="project-{i}"><button class="project-image" data-project="{i}" aria-label="Explore {e(p['name'])}" aria-haspopup="dialog"><img src="{p['image']}" alt="{e(p['name'])} — published Nakhsha Builders project photograph" loading="lazy"><span class="image-index">PROJECT_0{i+1} / MYSURU</span><span class="image-view"><svg class="arrow" aria-hidden="true"><use href="#arrow"/></svg></span></button><div class="project-copy" data-reveal><div class="project-index" aria-hidden="true">0{i+1}</div><span class="eyebrow">{e(p['sector'])}</span><h3 class="display" id="project-{i}" data-words>{e(p['name'])}</h3><p>{e(p['description'])}</p><div class="project-tags"><span>{e(p['location'])}</span><span>{e(p['status'])}</span></div><button class="project-detail-link" data-project="{i}" aria-haspopup="dialog">Explore project <svg class="arrow" aria-hidden="true"><use href="#arrow"/></svg></button></div></article>''')
page=(root/'src/index.template.html').read_text()
replacements={'__MODEL_JS__':(root/'scripts/architectural-model.js').read_text(),'__SITE_CSS__':(root/'src/site.css').read_text(),'__CONTACT_CSS__':(root/'src/contact.css').read_text(),'__PROJECT_ROWS__':'\n'.join(rows),'__CONTOUR_JS__':(root/'scripts/contour-field.js').read_text(),'__DRAFTING_JS__':(root/'scripts/drafting-canvas.js').read_text(),'__SITE_JS__':(root/'src/site.js').read_text().replace('__PROJECT_DATA__',json.dumps(projects,ensure_ascii=False)),'__CONTACT_JS__':(root/'scripts/contact-form.js').read_text(),'__MEDIA_BANK__':json.dumps(bank,separators=(',',':'))}
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
print('Built scroll-directed volumetric 3D, official Nakhsha preloader, distinct photography and retained verified contact flow.')
