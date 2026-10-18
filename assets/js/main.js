/* =========================================================
   Youssef El Harchaoui — Architecture Portfolio
   Vanilla JS, no dependencies. Shared by every page:
   each feature only runs when its markup is present.
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  /* ---------------------------------------------------------
     i18n — English lives in the HTML; French is in i18n-fr.js
     --------------------------------------------------------- */
  const FR = window.I18N_FR || {};
  const CURSOR_FR = { Zoom: 'Zoom', View: 'Voir', Drag: 'Glisser', Open: 'Ouvrir', Write: 'Écrire', Get: 'PDF', Go: 'Voir' };
  const EN = {};
  let lang = 'en';

  $$('[data-i18n],[data-i18n-html]').forEach(el => {
    const k = el.dataset.i18n || el.dataset.i18nHtml;
    if (!(k in EN)) EN[k] = el.dataset.i18nHtml ? el.innerHTML : el.textContent;
  });

  function applyLang(l) {
    lang = l;
    const dict = l === 'fr' ? FR : EN;
    document.documentElement.lang = l;
    // only touch text that actually changes (the HTML already ships in English)
    $$('[data-i18n]').forEach(el => { const v = dict[el.dataset.i18n]; if (v != null && el.textContent !== v) el.textContent = v; });
    $$('[data-i18n-html]').forEach(el => { const v = dict[el.dataset.i18nHtml]; if (v != null && el.innerHTML !== v) el.innerHTML = v; });
    $$('[data-i18n-aria]').forEach(el => {
      const k = el.dataset.i18nAria;
      if (!(k in EN)) EN[k] = el.getAttribute('aria-label');
      const v = dict[k]; if (v != null) el.setAttribute('aria-label', v.replace(/\s*↑$/, ''));
    });
    $$('.lang span').forEach(s => s.classList.toggle('is-on', s.dataset.l === l));
    splitChars();
    splitWords();
    updatePills();
    heroLabel();
    store.set('lang', l);
  }
  $$('.lang').forEach(b => b.addEventListener('click', () => applyLang(lang === 'en' ? 'fr' : 'en')));

  /* ---------------------------------------------------------
     Text splitting
     --------------------------------------------------------- */
  function splitChars() {
    $$('.split').forEach((el, k) => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      let i = 0;
      words.forEach((w, wi) => {
        // each word stays unbreakable so letters never wrap mid-word
        const word = document.createElement('span');
        word.className = 'wd';
        [...w].forEach(c => {
          const s = document.createElement('span');
          s.className = 'ch';
          s.textContent = c;
          s.style.transitionDelay = (0.15 + k * 0.12 + i++ * 0.04) + 's';
          word.appendChild(s);
        });
        el.appendChild(word);
        if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
    });
  }

  function splitWords() {
    $$('.scrub').forEach(el => {
      const t = el.textContent.trim();
      el.innerHTML = t.split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
      el._on = -1;
    });
    scrubs = $$('.scrub');
    onScroll();
  }

  /* ---------------------------------------------------------
     Loader (home page only) — other pages reveal straight away
     --------------------------------------------------------- */
  const loader = $('.loader');
  function revealPage() {
    document.body.classList.add('is-loaded');
    setTimeout(() => {
      document.body.classList.remove('is-loading');
      if (loader) loader.style.visibility = 'hidden';
      startHero();
    }, loader && !reduce ? 900 : 0);
  }
  if (loader) {
    const countEl = $('#loaderCount');
    const bar = $('.loader__bar span');
    const heroImg = $('.hero__slide img');
    let loaded = false;
    new Promise(r => {
      if (!heroImg || heroImg.complete) r(); else { heroImg.addEventListener('load', r); heroImg.addEventListener('error', r); }
      setTimeout(r, 4000);
    }).then(() => (loaded = true));
    const t0 = performance.now();
    const minDur = reduce ? 200 : 1100;
    (function tick(now) {
      const p = clamp((now - t0) / minDur, 0, loaded ? 1 : 0.9);
      const n = Math.round((1 - Math.pow(1 - p, 3)) * 100);
      if (countEl) countEl.textContent = n;
      bar.style.width = n + '%';
      if (p < 1) requestAnimationFrame(tick); else revealPage();
    })(t0);
  } else {
    requestAnimationFrame(() => requestAnimationFrame(revealPage));
  }

  /* ---------------------------------------------------------
     Hero slideshow (any page with several slides)
     --------------------------------------------------------- */
  const slides = $$('.hero__slide');
  const bars = $$('.hero__bars i');
  const idx = $('.hero__idx');
  const now = $('.hero__now');
  let cur = 0;
  function heroLabel() {
    if (!now || !slides.length) return;
    const s = slides[cur];
    now.textContent = (lang === 'fr' && s.dataset.labelFr) || s.dataset.label || '';
    now.href = s.dataset.href || '#';
  }
  function showSlide(i) {
    if (!slides.length) return;
    slides[cur].classList.remove('is-active');
    cur = i;
    slides[cur].classList.add('is-active');
    bars.forEach((b, j) => { b.classList.toggle('is-done', j < cur); b.classList.remove('is-active'); });
    if (bars[cur]) { void bars[cur].offsetWidth; bars[cur].classList.add('is-active'); }
    if (idx) idx.textContent = String(cur + 1).padStart(2, '0');
    heroLabel();
  }
  function startHero() {
    if (!slides.length) return;
    showSlide(0);
    if (reduce || slides.length < 2) return;
    setInterval(() => showSlide((cur + 1) % slides.length), 6000);
  }

  /* ---------------------------------------------------------
     Cursor
     --------------------------------------------------------- */
  const cursor = $('.cursor');
  const cLabel = $('.cursor__label');
  if (finePointer && cursor) {
    let mx = -100, my = -100, cx = -100, cy = -100;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cursor.classList.add('is-on'); }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
    // the follower only animates while it is catching up with the pointer
    let running = false;
    const loop = () => {
      cx += (mx - cx) * 0.22; cy += (my - cy) * 0.22;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      running = Math.abs(mx - cx) + Math.abs(my - cy) > 0.3;
      if (running) requestAnimationFrame(loop);
    };
    addEventListener('mousemove', () => { if (!running) { running = true; requestAnimationFrame(loop); } }, { passive: true });
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t && !t.closest('.lb')) {
        const k = t.dataset.cursor;
        cLabel.textContent = lang === 'fr' ? (CURSOR_FR[k] || k) : k;
        cursor.classList.add('is-big'); cursor.classList.remove('is-hover');
      } else {
        cursor.classList.remove('is-big');
        cursor.classList.toggle('is-hover', !!e.target.closest('a, button, summary, .swatch, [data-tab]'));
      }
    });
  }

  /* ---------------------------------------------------------
     Scroll-driven: progress bar, header theme, nav state, word scrub, horizontal scroll
     --------------------------------------------------------- */
  const prog = $('.progress span');
  const header = $('.header');
  const toTop = $('.to-top');
  const sections = $$('[data-section]');
  const navLinks = $$('.nav a');
  const hs = $('.hscroll');
  const hsTrack = $('.hscroll__track');
  let hsDist = 0, lastY = 0;

  function layoutHScroll() {
    if (!hs) return;
    if (innerWidth <= 900) { hs.style.height = ''; hsTrack.style.transform = ''; hsDist = 0; return; }
    hsDist = Math.max(0, hsTrack.scrollWidth - innerWidth);
    hs.style.height = (innerHeight + hsDist) + 'px';
  }

  const darkBlocks = $$('.hero, .cover, .dark');
  let scrubs = [];
  const state = { nav: null, dark: null, solid: null, top: null };

  // One pass per frame: read every measurement first, then write, so the
  // browser never has to recompute layout in the middle of the frame.
  function onScroll() {
    const y = scrollY, vh = innerHeight;
    const body = document.body, menuOpen = body.classList.contains('menu-open');

    /* ---- read ---- */
    const max = document.documentElement.scrollHeight - vh;
    const dark = darkBlocks.some(el => { const r = el.getBoundingClientRect(); return r.top <= 40 && r.bottom >= 40; });
    let active = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= vh * 0.45) active = s;
    const scrubRects = scrubs.map(el => el.getBoundingClientRect());
    const hsTop = hsDist ? hs.getBoundingClientRect().top : 0;

    /* ---- write ---- */
    if (prog) prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    const dy = y - lastY;
    if (header && Math.abs(dy) > 6) {
      header.classList.toggle('is-hidden', dy > 0 && y > vh * 0.8 && !menuOpen);
      lastY = y;
    }
    const isDark = dark && !menuOpen, solid = y > 24, top = y > vh * 0.9;
    if (isDark !== state.dark) { body.classList.toggle('on-dark', isDark); state.dark = isDark; }
    if (header && solid !== state.solid) { header.classList.toggle('is-solid', solid); state.solid = solid; }
    if (toTop && top !== state.top) { toTop.classList.toggle('is-on', top); state.top = top; }
    if (active) {
      const nav = active.dataset.nav || body.dataset.nav || '';
      if (nav !== state.nav) { navLinks.forEach(a => a.classList.toggle('is-current', !!nav && a.dataset.nav === nav)); state.nav = nav; }
    }
    scrubs.forEach((el, k) => {
      const r = scrubRects[k];
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
      const words = el.children, on = Math.round(p * words.length);
      if (on === el._on) return;
      el._on = on;
      for (let i = 0; i < words.length; i++) words[i].classList.toggle('on', i < on);
    });
    if (hsDist) hsTrack.style.transform = `translate3d(${-clamp(-hsTop / hsDist, 0, 1) * hsDist}px,0,0)`;
  }
  let ticking = false;
  addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });
  addEventListener('resize', () => { layoutHScroll(); onScroll(); updatePills(); });
  addEventListener('load', () => { layoutHScroll(); onScroll(); });

  /* ---------------------------------------------------------
     Reveal on view + counters
     --------------------------------------------------------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .reveal-img').forEach(el => io.observe(el));

  $$('.stats, .refs__grid, .boards__row, .accordion, .pillars__list, .pindex, .xp, .facts, .gal').forEach(g =>
    $$(':scope > .reveal, :scope > .reveal-img', g).forEach((el, i) => (el.style.transitionDelay = Math.min(i, 6) * 0.08 + 's')));

  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, to = +el.dataset.count, d = reduce ? 1 : 1600, s = performance.now();
      (function f(n) {
        const p = clamp((n - s) / d, 0, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 4)) * to);
        if (p < 1) requestAnimationFrame(f);
      })(s);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------------------------------------------------------
     Steppers (concept diagrams)
     --------------------------------------------------------- */
  $$('[data-stepper]').forEach(st => {
    const items = $$('.stepper__steps li', st);
    const focus = $('.stepper__focus', st);
    const DUR = 4500;
    let i = -1, timer, paused = false;
    function go(n) {
      i = n;
      st.classList.remove('is-all');
      items.forEach((li, j) => li.classList.toggle('is-active', j === i));
      const li = items[i]; li.classList.remove('is-active'); void li.offsetWidth; li.classList.add('is-active');
      const [x, y, w, h] = li.dataset.region.split(',').map(Number);
      Object.assign(focus.style, { left: x + '%', top: y + '%', width: w + '%', height: h + '%' });
    }
    function next() {
      if (i === items.length - 1) {
        st.classList.add('is-all');
        items.forEach(li => li.classList.remove('is-active'));
        i = -1;
        timer = setTimeout(next, 2200);
        return;
      }
      go(i + 1);
      timer = setTimeout(next, DUR);
    }
    st.style.setProperty('--dur', DUR + 'ms');
    items.forEach((li, j) => li.addEventListener('click', () => {
      clearTimeout(timer); paused = true; st.classList.add('is-paused'); go(j);
      timer = setTimeout(() => { paused = false; st.classList.remove('is-paused'); next(); }, 9000);
    }));
    new IntersectionObserver(([e]) => {
      clearTimeout(timer);
      if (e.isIntersecting && !paused) { if (i < 0) go(0); timer = setTimeout(next, DUR); }
    }, { threshold: 0.4 }).observe(st);
    go(0);
  });

  /* ---------------------------------------------------------
     Scenario timeline (Lixus visit) — auto-plays while visible
     --------------------------------------------------------- */
  $$('[data-timeline]').forEach(tl => {
    const stops = $$('.tl__stop', tl);
    const frames = $$('.tl__frame', tl);
    const fill = $('.tl__fill', tl);
    const DUR = 5200;
    let i = 0, timer, visible = false, paused = false;
    function go(n) {
      i = n;
      stops.forEach((s, j) => { s.classList.toggle('is-active', j === i); s.classList.toggle('is-past', j < i); s.setAttribute('aria-selected', j === i); });
      frames.forEach((f, j) => f.classList.toggle('is-active', j === i));
      if (fill) fill.style.transform = `scaleX(${stops.length > 1 ? i / (stops.length - 1) : 1})`;
    }
    function loop() { clearTimeout(timer); if (visible && !paused && !reduce) timer = setTimeout(() => { go((i + 1) % stops.length); loop(); }, DUR); }
    stops.forEach((s, j) => s.addEventListener('click', () => {
      paused = true; go(j); clearTimeout(timer);
      timer = setTimeout(() => { paused = false; loop(); }, 12000);
    }));
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; loop(); }, { threshold: 0.35 }).observe(tl);
    go(0);
  });

  /* ---------------------------------------------------------
     Project index — floating preview follows the cursor
     --------------------------------------------------------- */
  $$('[data-pindex]').forEach(list => {
    const prev = $('.pindex__preview', list);
    if (!prev || !finePointer) return;
    const imgs = {};
    $$('.prow', list).forEach(row => {
      const src = row.dataset.img;
      if (!imgs[src]) {
        const im = document.createElement('img');
        im.src = src; im.alt = ''; im.loading = 'lazy';
        prev.appendChild(im); imgs[src] = im;
      }
      row.addEventListener('mouseenter', () => {
        Object.values(imgs).forEach(im => im.classList.toggle('is-on', im === imgs[src]));
        list.classList.add('is-hover');
      });
    });
    list.addEventListener('mouseleave', () => list.classList.remove('is-hover'));
    let tx = 0, ty = 0, px = 0, py = 0, raf;
    list.addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(function f() {
        px += (tx - px) * 0.16; py += (ty - py) * 0.16;
        prev.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) rotate(${clamp((tx - px) * 0.05, -6, 6)}deg)`;
        raf = Math.abs(tx - px) + Math.abs(ty - py) > 0.5 ? requestAnimationFrame(f) : 0;
      });
    });
  });

  /* ---------------------------------------------------------
     Magnifier lens
     --------------------------------------------------------- */
  $$('[data-lens]').forEach(wrap => {
    const img = $('img', wrap), lens = $('.lens', wrap), Z = 2.6;
    if (!finePointer || !lens) return;
    wrap.addEventListener('mouseenter', () => {
      lens.style.backgroundImage = `url("${img.dataset.full || img.currentSrc || img.src}")`;
      wrap.classList.add('is-lens');
    });
    wrap.addEventListener('mouseleave', () => wrap.classList.remove('is-lens'));
    wrap.addEventListener('mousemove', e => {
      const r = img.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top, L = lens.offsetWidth / 2;
      lens.style.left = (x - L) + 'px';
      lens.style.top = (y - L) + 'px';
      lens.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
      lens.style.backgroundPosition = `${-(x * Z - L)}px ${-(y * Z - L)}px`;
    });
  });

  /* ---------------------------------------------------------
     Tabs with sliding pill
     --------------------------------------------------------- */
  const pills = [];
  $$('[data-tabs]').forEach(tabs => {
    const name = tabs.dataset.tabs;
    const panelBox = $(`[data-panels="${name}"]`);
    if (!panelBox) return;
    const panels = [...panelBox.children];
    const btns = $$('button', tabs);
    const pill = document.createElement('span');
    pill.className = 'tabs__pill';
    tabs.prepend(pill);
    const place = () => {
      const b = btns.find(b => b.getAttribute('aria-selected') === 'true');
      if (!b || !b.offsetWidth) return;
      pill.style.left = b.offsetLeft + 'px';
      pill.style.top = b.offsetTop + 'px';
      pill.style.width = b.offsetWidth + 'px';
      pill.style.height = b.offsetHeight + 'px';
    };
    pills.push(place);
    btns.forEach((b, i) => b.addEventListener('click', () => {
      btns.forEach(x => x.setAttribute('aria-selected', x === b));
      panels.forEach((p, j) => p.classList.toggle('is-active', i === j));
      place();
    }));
  });
  function updatePills() { pills.forEach(f => f()); }
  document.fonts && document.fonts.ready.then(updatePills);

  /* ---------------------------------------------------------
     Colour swatches (click to copy)
     --------------------------------------------------------- */
  const toast = $('.toast');
  let toastT;
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg; toast.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('is-on'), 1800);
  }
  $$('.swatches').forEach(box => {
    box.dataset.colors.split(',').forEach(hex => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'swatch'; b.style.background = hex; b.dataset.hex = hex;
      b.setAttribute('aria-label', 'Copy ' + hex);
      b.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(hex); say((lang === 'fr' ? 'Copié ' : 'Copied ') + hex); }
        catch { say(hex); }
      });
      box.appendChild(b);
    });
  });
  $$('[data-copy]').forEach(b => b.addEventListener('click', async e => {
    e.preventDefault();
    try { await navigator.clipboard.writeText(b.dataset.copy); say((lang === 'fr' ? 'Copié : ' : 'Copied: ') + b.dataset.copy); }
    catch { location.href = b.href; }
  }));

  /* ---------------------------------------------------------
     Drag-to-scroll strips
     --------------------------------------------------------- */
  $$('[data-drag]').forEach(el => {
    let down = false, sx = 0, sl = 0, moved = 0;
    el.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; sx = e.clientX; sl = el.scrollLeft;
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) el.classList.add('is-drag');
      el.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => { down = false; setTimeout(() => el.classList.remove('is-drag'), 0); });
    // swallow the click that ends a drag so it doesn't open the lightbox
    el.addEventListener('click', e => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); } }, true);
  });

  /* discourage right-click saving of renders (a deterrent, not protection) */
  document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('img[data-zoom], .lb__img')) e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });

  /* ---------------------------------------------------------
     Lightbox with zoom + pan
     --------------------------------------------------------- */
  const lb = $('.lb');
  if (lb) {
    const stage = $('.lb__stage'), lbImg = $('.lb__img');
    const lbCap = $('.lb__cap'), lbCount = $('.lb__count');
    let list = [], li = 0, S = 1, TX = 0, TY = 0, lastFocus;
    const apply = () => (lbImg.style.transform = `translate3d(${TX}px,${TY}px,0) scale(${S})`);
    const reset = () => { S = 1; TX = 0; TY = 0; apply(); };

    const openLB = el => {
      const g = el.dataset.group;
      list = g ? $$(`[data-zoom][data-group="${g}"]`) : [el];
      li = list.indexOf(el);
      lb.classList.toggle('is-single', list.length < 2);
      lastFocus = document.activeElement;
      lb.hidden = false;
      requestAnimationFrame(() => lb.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      show();
      $('.lb__close').focus();
    };
    const show = () => {
      const el = list[li];
      lbImg.style.opacity = 0;
      reset();
      const src = el.dataset.full || el.currentSrc || el.src;
      const im = new Image();
      im.onload = () => { lbImg.src = src; lbImg.alt = el.alt; lbImg.style.opacity = 1; };
      im.src = src;
      lbCap.textContent = el.alt;
      lbCount.textContent = list.length > 1 ? `${String(li + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}` : '';
    };
    const closeLB = () => {
      lb.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(() => { lb.hidden = true; lbImg.src = ''; }, 350);
      lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
    };
    const step = d => { if (list.length > 1) { li = (li + d + list.length) % list.length; show(); } };

    document.addEventListener('click', e => {
      const t = e.target.closest('[data-zoom]');
      if (t && !lb.contains(t)) { e.preventDefault(); openLB(t); }
    });
    $('.lb__close').addEventListener('click', closeLB);
    $('.lb__prev').addEventListener('click', () => step(-1));
    $('.lb__next').addEventListener('click', () => step(1));
    addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLB();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === '+' || e.key === '=') zoomAt(1.4, 0, 0);
      if (e.key === '-') zoomAt(1 / 1.4, 0, 0);
    });

    function zoomAt(f, cx, cy) {
      const ns = clamp(S * f, 1, 6);
      const k = ns / S;
      TX = cx - (cx - TX) * k;
      TY = cy - (cy - TY) * k;
      S = ns;
      if (S === 1) { TX = 0; TY = 0; }
      apply();
    }
    const rel = (x, y) => {
      const r = stage.getBoundingClientRect();
      return [x - r.left - r.width / 2, y - r.top - r.height / 2];
    };
    stage.addEventListener('wheel', e => {
      e.preventDefault();
      lbImg.classList.add('no-ease');
      const [cx, cy] = rel(e.clientX, e.clientY);
      zoomAt(Math.exp(-e.deltaY * 0.0018), cx, cy);
      clearTimeout(stage._w); stage._w = setTimeout(() => lbImg.classList.remove('no-ease'), 120);
    }, { passive: false });
    stage.addEventListener('dblclick', e => {
      const [cx, cy] = rel(e.clientX, e.clientY);
      if (S > 1) reset(); else zoomAt(2.5, cx, cy);
    });
    stage.addEventListener('click', e => { if (e.target === stage && S === 1) closeLB(); });

    const ptrs = new Map();
    let pinch0 = 0, startX = 0, swipe = 0;
    stage.addEventListener('pointerdown', e => {
      stage.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      stage.classList.add('is-drag');
      startX = e.clientX; swipe = 0;
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); }
    });
    stage.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return;
      const prev = ptrs.get(e.pointerId);
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const [cx, cy] = rel((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        if (pinch0) zoomAt(d / pinch0, cx, cy);
        pinch0 = d;
      } else if (S > 1) {
        TX += e.clientX - prev[0]; TY += e.clientY - prev[1]; apply();
      } else {
        swipe = e.clientX - startX;
      }
    });
    const end = e => {
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch0 = 0;
      if (!ptrs.size) {
        stage.classList.remove('is-drag');
        if (S === 1 && Math.abs(swipe) > 70) step(swipe < 0 ? 1 : -1);
        swipe = 0;
      }
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
  }

  /* ---------------------------------------------------------
     Mobile menu
     --------------------------------------------------------- */
  const menuBtn = $('.menu-btn');
  function toggleMenu(open) {
    document.body.classList.toggle('menu-open', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open);
    const mn = $('.mobile-nav');
    if (mn) mn.setAttribute('aria-hidden', !open);
  }
  if (menuBtn) menuBtn.addEventListener('click', () => toggleMenu(!document.body.classList.contains('menu-open')));
  $$('.mobile-nav a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) toggleMenu(false); });

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  $$('.js-year').forEach(el => (el.textContent = new Date().getFullYear()));
  const saved = store.get('lang');
  applyLang(saved || ((navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en'));
  layoutHScroll();
  onScroll();
})();
