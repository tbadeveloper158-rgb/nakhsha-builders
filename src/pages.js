/* Published project pages: filtering, photo-led scroll motion and keyboard galleries.
   Navigation, the official intro and contact integration are supplied by shared.js. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const page = $('.pages');
  if (!page) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = !preference.matches;
  const clamp = (value, lower = 0, upper = 1) => Math.min(upper, Math.max(lower, value));
  const revealElements = $$('[data-page-reveal]');
  const revealAnimations = new WeakMap();
  if (motion && 'IntersectionObserver' in window && typeof Element.prototype.animate === 'function') {
    document.body.classList.add('pages-motion');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (!motion) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = '';
          observer.unobserve(entry.target);
          continue;
        }
        const animation = entry.target.animate([
          { opacity: 0, transform: 'translateY(28px)' },
          { opacity: 1, transform: 'translateY(0px)' }
        ], { duration: 1000, easing: 'cubic-bezier(.18,.68,.18,1)', fill: 'both' });
        revealAnimations.set(entry.target, animation);
        observer.unobserve(entry.target);
      }
    }, { threshold: .08, rootMargin: '0px 0px -20px' });
    const observeReveals = () => revealElements.forEach(element => observer.observe(element));
    if (document.documentElement.dataset.nakhshaReady === 'true' || !document.querySelector('[data-site-preloader],.site-preloader,.loader')) observeReveals();
    else addEventListener('nakhsha:ready', observeReveals, { once: true });
  }
  const photos = $$('.page-card-visual>img,.page-case-cover>img,.page-gallery-tile>img,.page-next>img');
  let scheduled = false;
  function paint() {
    scheduled = false;
    if (!motion) {
      photos.forEach(image => image.style.transform = '');
      return;
    }
    const height = innerHeight;
    for (const image of photos) {
      const box = image.parentElement.getBoundingClientRect();
      if (box.bottom < -50 || box.top > height + 50) continue;
      const progress = clamp((height - box.top) / (height + box.height));
      image.style.transform = `translateY(${(progress - .5) * 28}px) scale(1.025)`;
    }
  }
  function requestPaint() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(paint);
    }
  }
  addEventListener('scroll', requestPaint, { passive: true });
  addEventListener('resize', requestPaint);
  requestPaint();
  preference.addEventListener('change', event => {
    motion = !event.matches;
    if (!motion) {
      document.body.classList.remove('pages-motion');
      revealElements.forEach(element => {
        revealAnimations.get(element)?.finish();
        element.style.opacity = '1';
        element.style.transform = '';
      });
    }
    requestPaint();
  });
  const filters = $$('[data-page-filter]');
  const cards = $$('.page-project-card');
  filters.forEach(button => button.addEventListener('click', () => {
    const selected = button.dataset.pageFilter;
    cards.forEach(card => card.hidden = selected !== 'all' && card.dataset.category !== selected);
    const visibleCards = cards.filter(card => !card.hidden);
    const count = visibleCards.length;
    const grid = $('.page-project-grid');
    grid?.classList.toggle('is-filtered', selected !== 'all');
    cards.forEach(card => card.classList.toggle('is-first-visible', card === visibleCards[0]));
    const result = $('.page-result-count');
    if (result) result.textContent = `${count} selected project${count === 1 ? '' : 's'}`;
    filters.forEach(filter => {
      const current = filter === button;
      filter.classList.toggle('active', current);
      filter.setAttribute('aria-pressed', String(current));
    });
    requestPaint();
    window.dispatchEvent(new Event('resize'));
  }));

  const tiles = $$('[data-gallery-open]');
  const sources = tiles.map(tile => tile.querySelector('[data-gallery-image]')).filter(Boolean);
  if (!sources.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'page-gallery-dialog';
  dialog.setAttribute('aria-label', 'Project photography');
  dialog.setAttribute('data-lenis-prevent', '');
  dialog.innerHTML = '<div class="page-gallery-view"><button class="page-gallery-close" type="button" aria-label="Close project gallery">Close <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19"/></svg></button><img class="page-gallery-full" alt=""><button class="page-gallery-previous" type="button" aria-label="Previous photograph"><svg viewBox="0 0 24 18" aria-hidden="true"><path d="M22 9H3m6-6L3 9l6 6"/></svg></button><button class="page-gallery-next" type="button" aria-label="Next photograph"><svg viewBox="0 0 24 18" aria-hidden="true"><path d="M2 9h19m-6-6 6 6-6 6"/></svg></button></div><div class="page-gallery-bottom"><span class="page-gallery-caption"></span><span class="page-gallery-count" aria-live="polite"></span></div><div class="page-gallery-thumbs" aria-label="Choose photograph"></div>';
  document.body.append(dialog);
  const full = dialog.querySelector('.page-gallery-full');
  const caption = dialog.querySelector('.page-gallery-caption');
  const counter = dialog.querySelector('.page-gallery-count');
  const thumbs = dialog.querySelector('.page-gallery-thumbs');
  let current = 0;
  let oldOverflow = '';
  function show(index) {
    current = (index + sources.length) % sources.length;
    full.src = sources[current].currentSrc || sources[current].src;
    full.alt = sources[current].alt;
    caption.textContent = sources[current].alt;
    counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(sources.length).padStart(2, '0')}`;
    [...thumbs.children].forEach((button, position) => {
      button.classList.toggle('active', position === current);
      button.setAttribute('aria-current', position === current ? 'true' : 'false');
    });
    if (motion) full.animate([{ opacity: .3, transform: 'scale(1.025)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' });
  }
  sources.forEach((image, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `View photograph ${index + 1}`);
    const thumbnail = document.createElement('img');
    thumbnail.src = image.currentSrc || image.src;
    thumbnail.alt = '';
    button.append(thumbnail);
    button.addEventListener('click', () => show(index));
    thumbs.append(button);
  });
  tiles.forEach((tile, index) => tile.addEventListener('click', () => {
    show(index);
    oldOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    window.dispatchEvent(new CustomEvent('nakhsha:modal-open'));
    dialog.querySelector('.page-gallery-close').focus();
  }));
  dialog.querySelector('.page-gallery-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.page-gallery-previous').addEventListener('click', () => show(current - 1));
  dialog.querySelector('.page-gallery-next').addEventListener('click', () => show(current + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
  });
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = oldOverflow;
    window.dispatchEvent(new CustomEvent('nakhsha:modal-close'));
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  let touchX = 0, touchY = 0;
  dialog.querySelector('.page-gallery-view').addEventListener('touchstart', event => {
    touchX = event.touches[0].clientX;
    touchY = event.touches[0].clientY;
  }, { passive: true });
  dialog.querySelector('.page-gallery-view').addEventListener('touchend', event => {
    const dx = event.changedTouches[0].clientX - touchX, dy = event.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
