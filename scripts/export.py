"""Build the self-contained Nakhsha pages with Python's standard library."""
import base64
import html
import json
import mimetypes
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PROJECTS = json.loads((ROOT / 'project-data.json').read_text())['projects']
PHOTOGRAPHY = json.loads((ROOT / 'project-media.json').read_text())['projects']
for project in PROJECTS:
    project['gallery'] = PHOTOGRAPHY[project['slug']]['gallery']


def read(path):
    return (ROOT / path).read_text()


def escape(value):
    return html.escape(str(value), quote=True)


def uri(path):
    mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()


ASSETS = {str(path.relative_to(ROOT)): path for path in (ROOT / 'assets').rglob('*') if path.is_file()}
EMBEDDED = {}


def embedded(ref):
    if ref not in EMBEDDED:
        EMBEDDED[ref] = uri(ASSETS[ref])
    return EMBEDDED[ref]


def header(active):
    return read('src/shared-header.html').replace(
        f'data-nav-page="{active}"', f'data-nav-page="{active}" aria-current="page"')


ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 20 4M4 4h16v16"/></svg>'
SYMBOL = '<svg width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true"><defs><symbol id="arrow" viewBox="0 0 24 18"><path d="M2 9h19M15 3l6 6-6 6"/></symbol></defs></svg>'
NOSCRIPT = '''<noscript><style>.builders-loader{display:none!important}.pages [data-page-reveal]{opacity:1!important;transform:none!important}[data-nakhsha-contact]{display:none!important}</style><p style="padding:24px;background:#EFE7DE;color:#6B5032">To discuss your project, <a href="tel:+919606966266">call +91 96069 66266</a> or <a href="mailto:eo@nakhsha.in">email eo@nakhsha.in</a>.</p></noscript>'''


def write_page(path, page, replacements):
    for marker, value in replacements.items():
        page = page.replace(marker, value)
    unresolved = re.findall(r'__[A-Z_]+__', page)
    if unresolved:
        raise ValueError(f'Unresolved markers in {path}: {unresolved}')
    # Pages carry their own visual assets. Relative links also work beneath a
    # GitHub Pages repository prefix, including directly opened case studies.
    for ref in ASSETS:
        if 'src="' + ref + '"' in page or "url('" + ref + "')" in page:
            asset = embedded(ref)
            page = page.replace('src="' + ref + '"', 'src="' + asset + '"')
            page = page.replace("url('" + ref + "')", "url('" + asset + "')")
    depth = len(Path(path).parent.parts)
    prefix = '../' * depth if depth else './'
    page = re.sub(r'href="/(?!/)([^"]*)"', lambda match: 'href="' + prefix + match[1] + '"', page)
    page = page.replace('</body>', NOSCRIPT + '</body>')
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(page)
    print(f'Built {path} ({target.stat().st_size / 1024 / 1024:.2f} MB)')
    return page


def home_rows():
    rows = []
    for i, p in enumerate(PROJECTS):
        url = '/projects/' + p['slug'] + '/'
        rows.append(f'''<article class="project-row" data-index="{i}" aria-labelledby="project-{i}"><a class="project-image" href="{url}" aria-label="Explore {escape(p['name'])}"><img src="{p['image']}" alt="{escape(p['name'])} — published Nakhsha Builders project photograph" loading="lazy"><span class="image-index">PROJECT_0{i+1} / MYSURU</span><span class="image-view"><svg class="arrow" aria-hidden="true"><use href="#arrow"/></svg></span></a><div class="project-copy" data-reveal><div class="project-index" aria-hidden="true">0{i+1}</div><span class="eyebrow">{escape(p['sector'])}</span><h3 class="display" id="project-{i}" data-words>{escape(p['name'])}</h3><p>{escape(p['description'])}</p><div class="project-tags"><span>{escape(p['location'])}</span><span>{escape(p['status'])}</span></div><a class="project-detail-link" href="{url}">Explore project <svg class="arrow" aria-hidden="true"><use href="#arrow"/></svg></a></div></article>''')
    return '\n'.join(rows)


photo_paths = {p['image'] for p in PROJECTS}
for project in PROJECTS:
    photo_paths.update(g['path'] for g in project['gallery'])
bank = {path: embedded(path) for path in sorted(photo_paths)}
home_replacements = {
    '__HEADER__': header('home'),
    '__PRELOADER__': read('src/shared-preloader.html'),
    '__MENU__': read('src/shared-menu.html'),
    '__SHARED_CSS__': read('src/shared.css'),
    '__SHARED_JS__': read('src/shared.js'),
    '__MODEL_JS__': read('scripts/architectural-model.js'),
    '__SITE_CSS__': read('src/site.css'),
    '__CONTACT_CSS__': read('src/contact.css'),
    '__PROJECT_ROWS__': home_rows(),
    '__CONTOUR_JS__': read('scripts/contour-field.js'),
    '__DRAFTING_JS__': read('scripts/drafting-canvas.js'),
    '__SITE_JS__': read('src/site.js').replace('__PROJECT_DATA__', json.dumps(PROJECTS, ensure_ascii=False)),
    '__CONTACT_JS__': read('scripts/contact-form.js'),
    '__MEDIA_BANK__': json.dumps(bank, separators=(',', ':')),
}
for marker, name in [('__THREE_MODULE__', 'three.module.min.js'), ('__THREE_CORE__', 'three.core.min.js'), ('__LENIS_MODULE__', 'lenis.mjs')]:
    module = read('vendor/' + name).replace('./three.core.min.js', 'three/core')
    home_replacements[marker] = 'data:text/javascript;base64,' + base64.b64encode(module.encode()).decode()
home = write_page('index.html', read('src/index.template.html'), home_replacements)
(ROOT / 'standalone.html').write_text(home)


def inner_page(path, template, active, title, description, extra_css='', replacements=None):
    styles = '\n'.join(read(p) for p in ['src/site.css', 'src/contact.css', 'src/shared.css', 'src/pages.css'])
    if extra_css:
        styles += '\n' + read(extra_css)
    head = f'''<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#F5F1EA"><meta name="description" content="{escape(description)}"><title>{escape(title)} — Nakhsha Builders</title><style>{styles}</style>'''
    scripts = read('src/shared-menu.html') + '<script type="application/json" id="project-directory">' + json.dumps([{'slug': p['slug'], 'name': p['name']} for p in PROJECTS]) + '</script>'
    if active == 'contact':
        scripts += '<script>' + read('scripts/contact-form.js') + '</script>'
    scripts += '<script>' + read('src/shared.js') + '</script><script>' + read('src/pages.js') + '</script>'
    values = {'__PAGE_HEAD__': head, '__HEADER__': SYMBOL + header(active), '__PRELOADER__': read('src/shared-preloader.html'), '__FOOTER__': read('src/shared-footer.html'), '__PAGE_SCRIPTS__': scripts}
    values.update(replacements or {})
    page = read(template).replace('class="inner-page', f'data-page="{active}" class="inner-page')
    return write_page(path, page, values)


cards = []
for i, p in enumerate(PROJECTS):
    category = 'institutional' if 'institution' in p['sector'].lower() else 'hospitality'
    url = '/projects/' + p['slug'] + '/'
    cards.append(f'''<article class="page-project-card" data-category="{category}"><a class="page-card-visual" href="{url}" aria-label="Explore {escape(p['name'])}"><img src="{p['image']}" alt="{escape(p['name'])} — published Nakhsha Builders project photograph" loading="{'eager' if i == 0 else 'lazy'}"><span class="page-card-index">{i+1:02d} / 06</span><span class="page-card-open">Explore project {ARROW}</span></a><div class="page-card-caption"><div><span class="page-eyebrow">{escape(p['sector'])}</span><h2><a href="{url}">{escape(p['name'])}</a></h2></div><span class="page-card-place">{escape(p['location'])}</span></div></article>''')
inner_page('projects/index.html', 'src/projects.template.html', 'projects', 'Our projects', 'Explore Nakhsha Builders’ commercial, hospitality and institutional projects in Mysuru.', replacements={'__PROJECT_CARDS__': '\n'.join(cards)})
inner_page('contact/index.html', 'src/contact-page.template.html', 'contact', 'Contact', 'Discuss your commercial construction project with Nakhsha Builders in Mysuru.', 'src/contact-page.css')
inner_page('about/index.html', 'src/about.template.html', 'about', 'About us', 'Meet Nakhsha Builders and discover our approach to commercial construction in Mysuru.', 'src/about.css')

for i, project in enumerate(PROJECTS):
    next_project = PROJECTS[(i + 1) % len(PROJECTS)]
    pictures = [{'path': project['image'], 'alt': project['name'] + ' — published project photograph'}, *project['gallery']]
    gallery = '\n'.join(f'''<button type="button" class="page-gallery-tile" data-gallery-open="{j}" aria-label="View {escape(photo['alt'])}"><img data-gallery-image src="{photo['path']}" alt="{escape(photo['alt'])}" loading="lazy"><span>View photograph {j+1:02d}</span></button>''' for j, photo in enumerate(pictures))
    film = f'''<a class="page-action" href="{escape(project['videoUrl'])}" target="_blank" rel="noopener noreferrer">Watch project film {ARROW}</a>''' if project['videoUrl'] else ''
    values = {'__PROJECT_' + key.upper() + '__': escape(project[key]) for key in ['name', 'sector', 'location', 'description', 'detail', 'status', 'scope', 'source', 'slug']}
    values.update({'__PROJECT_HERO__': project['image'], '__PROJECT_AREA__': escape(project['area']) if re.search(r'\d', project['area']) else 'Not published', '__PROJECT_GALLERY__': gallery, '__PROJECT_FILM__': film, '__NEXT_PROJECT_NAME__': escape(next_project['name']), '__NEXT_PROJECT_URL__': '/projects/' + next_project['slug'] + '/', '__NEXT_PROJECT_IMAGE__': next_project['image']})
    inner_page('projects/' + project['slug'] + '/index.html', 'src/project-detail.template.html', 'projects', project['name'], project['description'], replacements=values)

print('Built 10 linked pages and a standalone home copy; all local visual assets embedded.')
