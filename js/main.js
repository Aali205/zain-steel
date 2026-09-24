(function () {
  'use strict';

  var BASE = document.documentElement.getAttribute('data-base') || '';
  var STATIC = document.documentElement.hasAttribute('data-static');
  var I18N = window.ZS_I18N;
  var SITE = window.__SITE__ || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function url(p) { return p && p.charAt(0) === '/' ? BASE + p : p; }
  function api(name) { return STATIC ? BASE + '/api/' + name + '.json' : '/api/' + name; }
  function isAr() { return I18N.lang === 'ar'; }
  function pick(item, field) { return (isAr() && item[field + '_ar']) || item[field + '_en'] || ''; }
  function waLink(text) {
    var num = String(SITE.whatsapp || '').replace(/\D/g, '');
    return 'https://wa.me/' + num + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  var ARROW = '<svg viewBox="0 0 24 24"><use href="' + BASE + '/img/icons.svg#arrow"/></svg>';

  /* ---------------- header & menu ---------------- */
  var header = $('[data-header]');
  var onScroll = function () { header && header.classList.toggle('scrolled', window.scrollY > 24); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = $('[data-burger]');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    if (burger) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
  }
  if (burger) burger.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
  $$('[data-menu] a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------------- language ---------------- */
  $$('[data-lang-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () { I18N.setLang(isAr() ? 'en' : 'ar'); });
  });

  /* ---------------- socials ---------------- */
  $$('[data-social]').forEach(function (a) {
    var url = SITE[a.dataset.social];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; } else a.remove();
  });

  /* ---------------- reveal on scroll ---------------- */
  var revealObserver = 'IntersectionObserver' in window && !reduceMotion
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    : null;
  function observeReveal(root) {
    $$('.reveal:not(.in)', root).forEach(function (el) {
      if (revealObserver) revealObserver.observe(el); else el.classList.add('in');
    });
  }

  /* ---------------- counters ---------------- */
  function runCounter(el) {
    var target = Number(el.dataset.count), suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var start = performance.now(), dur = 1600;
    (function frame(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    })(start);
  }
  if ('IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); countObserver.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { countObserver.observe(el); });
  }

  /* ---------------- laser sparks ---------------- */
  function initSparks(canvas) {
    var section = canvas.closest('section');
    var img = section && $('.hero-bg img', section);
    if (!img || reduceMotion) return;
    var ctx = canvas.getContext('2d');
    var focus = (img.dataset.focus || '0.5,0.72').split(',').map(Number);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, fx = 0, fy = 0, particles = [], running = false, raf = 0, t = 0;

    function resize() {
      var rect = section.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      locate();
    }

    // Map the focus point of the photo (object-fit: cover, plus the slow zoom transform) to canvas pixels.
    function locate() {
      if (!img.naturalWidth) return;
      var sec = section.getBoundingClientRect();
      var box = img.getBoundingClientRect();
      var s = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight);
      var rw = img.naturalWidth * s, rh = img.naturalHeight * s;
      var pos = getComputedStyle(img).objectPosition.split(' ').map(function (v) { return parseFloat(v) / 100; });
      fx = box.left - sec.left + (box.width - rw) * (isNaN(pos[0]) ? 0.5 : pos[0]) + focus[0] * rw;
      fy = box.top - sec.top + (box.height - rh) * (isNaN(pos[1]) ? 0.5 : pos[1]) + focus[1] * rh;
    }

    function spawn(n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2;
        var sp = 2 + Math.random() * 7;
        particles.push({
          x: fx, y: fy, px: fx, py: fy,
          vx: Math.cos(a) * sp * (0.6 + Math.random()),
          vy: Math.sin(a) * sp * 0.55 - Math.random() * 3,
          life: 0, max: 26 + Math.random() * 46,
          w: 0.6 + Math.random() * 1.6
        });
      }
    }

    function frame() {
      t++;
      if (t % 6 === 0) locate();
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      var pulse = 0.75 + Math.sin(t * 0.25) * 0.15 + Math.random() * 0.1;
      var g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 60 * pulse);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.15, 'rgba(180,210,255,0.55)');
      g.addColorStop(0.45, 'rgba(255,150,60,0.18)');
      g.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(fx, fy, 60 * pulse, 0, Math.PI * 2); ctx.fill();

      spawn(4 + (Math.random() * 5 | 0));
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.px = p.x; p.py = p.y;
        p.vy += 0.22; p.vx *= 0.985;
        p.x += p.vx; p.y += p.vy;
        p.life++;
        var k = 1 - p.life / p.max;
        if (k <= 0) { particles.splice(i, 1); continue; }
        ctx.strokeStyle = 'rgba(255,' + (160 + 90 * k | 0) + ',' + (60 + 150 * k * k | 0) + ',' + k + ')';
        ctx.lineWidth = p.w * (0.5 + k);
        ctx.beginPath(); ctx.moveTo(p.px - p.vx * 1.5, p.py - p.vy * 1.5); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      if (particles.length > 500) particles.splice(0, particles.length - 500);
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    if (!img.complete) img.addEventListener('load', resize);
    window.addEventListener('resize', resize);
    new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(section);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  }
  $$('[data-sparks]').forEach(initSparks);

  /* ---------------- products ---------------- */
  var productGrid = $('[data-products]');
  var products = null;

  function renderProducts() {
    if (!productGrid || !products) return;
    if (!products.length) {
      productGrid.innerHTML = '<div class="empty-state">' + esc(I18N.t('prod.empty', 'Products will be added soon.')) + '</div>';
      return;
    }
    productGrid.innerHTML = products.map(function (p, i) {
      var name = pick(p, 'name');
      var msg = I18N.t('prod.waMsg', 'Hello Zain Steel, I would like to ask about: ') + name;
      return '<article class="product-card panel reveal" style="--d:' + (i % 3) * 0.08 + 's">' +
        '<div class="product-media"><img src="' + esc(url(p.image)) + '" alt="' + esc(name) + '" loading="lazy"></div>' +
        '<div class="product-body"><h3>' + esc(name) + '</h3><p>' + esc(pick(p, 'desc')) + '</p>' +
        '<div class="product-actions">' +
          '<a class="btn btn-wa" target="_blank" rel="noopener" href="' + esc(waLink(msg)) + '"><svg viewBox="0 0 24 24"><use href="' + BASE + '/img/icons.svg#wa"/></svg><span>' + esc(I18N.t('prod.wa', 'WhatsApp')) + '</span></a>' +
          '<a class="btn btn-primary" href="' + BASE + '/contact?product=' + encodeURIComponent(p.name_en) + '#quote"><span>' + esc(I18N.t('prod.quote', 'Get a Quote')) + '</span></a>' +
        '</div></div></article>';
    }).join('');
    observeReveal(productGrid);
  }

  function loadProducts() {
    return fetch(api('products')).then(function (r) { return r.json(); }).then(function (list) { products = list; return list; });
  }
  if (productGrid) loadProducts().then(renderProducts).catch(function () { productGrid.innerHTML = ''; });

  /* ---------------- gallery ---------------- */
  var projectGrid = $('[data-projects]');
  var gallery = null;
  var activeCat = 'all';
  var visible = [];

  function catName(id) {
    var c = gallery.categories.find(function (x) { return x.id === id; });
    return c ? pick(c, 'name') : '';
  }

  function renderFilters() {
    var bar = $('[data-filters]');
    var counts = {};
    gallery.projects.forEach(function (p) { counts[p.categoryId] = (counts[p.categoryId] || 0) + 1; });
    var btn = function (id, label, count) {
      return '<button type="button" role="tab" class="filter-btn' + (activeCat === id ? ' active' : '') + '" aria-selected="' + (activeCat === id) + '" data-cat="' + esc(id) + '">' +
        esc(label) + (count ? '<span class="count">' + count + '</span>' : '') + '</button>';
    };
    bar.innerHTML = btn('all', I18N.t('gal.all', 'All Projects'), gallery.projects.length) +
      gallery.categories.map(function (c) { return btn(c.id, pick(c, 'name'), counts[c.id] || 0); }).join('');

    var row = $('[data-cat-row]');
    row.innerHTML = gallery.categories.map(function (c) {
      return '<button type="button" class="cat-tile" data-cat="' + esc(c.id) + '"><svg class="icon"><use href="' + BASE + '/img/icons.svg#' + esc(c.icon || 'steel') + '"/></svg><span>' + esc(pick(c, 'name')) + '</span></button>';
    }).join('');
  }

  function renderProjects() {
    visible = gallery.projects.filter(function (p) { return activeCat === 'all' || p.categoryId === activeCat; });
    if (!visible.length) {
      projectGrid.innerHTML = '<div class="empty-state">' + esc(I18N.t('gal.empty', 'Projects for this section will be added soon.')) + '</div>';
      return;
    }
    projectGrid.innerHTML = visible.map(function (p, i) {
      var title = pick(p, 'title');
      return '<button type="button" class="project-card" style="animation-delay:' + Math.min(i, 8) * 0.05 + 's" data-index="' + i + '">' +
        '<img src="' + esc(url(p.image)) + '" alt="' + esc(title) + '" loading="lazy">' +
        '<span class="project-info"><span><span class="cat">' + esc(catName(p.categoryId)) + '</span><h3>' + esc(title) + '</h3>' +
        (pick(p, 'location') ? '<span class="loc"><svg viewBox="0 0 48 48"><use href="' + BASE + '/img/icons.svg#pin"/></svg>' + esc(pick(p, 'location')) + '</span>' : '') +
        '</span><span class="circle-arrow">' + ARROW + '</span></span></button>';
    }).join('');
  }

  function setCat(id, scroll) {
    activeCat = id;
    renderFilters();
    renderProjects();
    if (history.replaceState) history.replaceState(null, '', id === 'all' ? location.pathname : '#' + id);
    if (scroll) $('[data-filters]').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }

  if (projectGrid) {
    fetch(api('gallery')).then(function (r) { return r.json(); }).then(function (data) {
      gallery = data;
      var fromHash = location.hash.slice(1);
      if (gallery.categories.some(function (c) { return c.id === fromHash; })) activeCat = fromHash;
      renderFilters();
      renderProjects();
    });
    document.addEventListener('click', function (e) {
      var f = e.target.closest('[data-cat]');
      if (f) setCat(f.dataset.cat, f.classList.contains('cat-tile'));
      var card = e.target.closest('.project-card');
      if (card) openLightbox(Number(card.dataset.index));
    });
  }

  /* lightbox */
  var lb = $('[data-lightbox]'), lbIndex = 0, lastFocus = null;
  function showLb(i) {
    lbIndex = (i + visible.length) % visible.length;
    var p = visible[lbIndex];
    $('[data-lb-img]').src = url(p.image);
    $('[data-lb-img]').alt = pick(p, 'title');
    $('[data-lb-cat]').textContent = catName(p.categoryId);
    $('[data-lb-title]').textContent = pick(p, 'title');
  }
  function openLightbox(i) {
    if (!lb) return;
    lastFocus = document.activeElement;
    showLb(i);
    lb.classList.add('open');
    $('[data-lb-close]').focus();
  }
  function closeLightbox() { lb.classList.remove('open'); if (lastFocus) lastFocus.focus(); }
  if (lb) {
    $('[data-lb-close]').addEventListener('click', closeLightbox);
    $('[data-lb-prev]').addEventListener('click', function () { showLb(lbIndex + (isAr() ? 1 : -1)); });
    $('[data-lb-next]').addEventListener('click', function () { showLb(lbIndex + (isAr() ? -1 : 1)); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showLb(lbIndex + (isAr() ? -1 : 1));
      if (e.key === 'ArrowLeft') showLb(lbIndex + (isAr() ? 1 : -1));
    });
  }

  /* ---------------- contact forms ---------------- */
  var productSelect = $('[data-product-select]');
  var requestedProduct = new URLSearchParams(location.search).get('product');

  function fillProductSelect() {
    if (!productSelect || !products) return;
    var current = productSelect.value || requestedProduct || '';
    var services = [['Laser Cutting', 'svc.laser'], ['Bending', 'svc.bending'], ['Steel Trading', 'svc.trading'], ['Fabrication', 'svc.fabrication']];
    var first = productSelect.options[0].outerHTML;
    productSelect.innerHTML = first +
      '<optgroup label="' + esc(I18N.t('nav.products', 'Products')) + '">' +
      products.map(function (p) { return '<option value="' + esc(p.name_en) + '">' + esc(pick(p, 'name')) + '</option>'; }).join('') +
      '</optgroup><optgroup label="' + esc(I18N.t('nav.services', 'Services')) + '">' +
      services.map(function (s) { return '<option value="' + esc(s[0]) + '">' + esc(I18N.t(s[1], s[0])) + '</option>'; }).join('') +
      '</optgroup>';
    productSelect.value = current;
  }
  if (productSelect) loadProducts().then(fillProductSelect).catch(function () {});

  var drop = $('[data-dropzone]');
  if (drop) {
    var fileInput = $('input[type=file]', drop), fileName = $('[data-file-name]', drop), defaultName = fileName.textContent;
    fileInput.addEventListener('change', function () { fileName.textContent = fileInput.files[0] ? fileInput.files[0].name : defaultName; });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('drag'); }); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault();
      if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; fileInput.dispatchEvent(new Event('change')); }
    });
  }

  $$('[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = $('[data-status]', form);
      var btn = $('button[type=submit]', form);
      var label = $('span', btn);
      status.className = 'form-status';

      if (!form.checkValidity()) {
        status.textContent = I18N.t('f.required', 'Please fill in all required fields with a valid email address.');
        status.className = 'form-status err';
        var bad = $(':invalid', form);
        if (bad) bad.focus();
        return;
      }

      var isQuote = form.dataset.form === 'quote';

      // Static hosting (GitHub Pages) has no server: hand the message to WhatsApp or email instead.
      if (STATIC) {
        var data = Object.fromEntries(new FormData(form));
        if (isQuote) {
          var lines = ['Quote request — Zain Steel website', 'Name: ' + data.name];
          if (data.company) lines.push('Company: ' + data.company);
          lines.push('Email: ' + data.email, 'Phone: +974 ' + data.phone);
          if (data.product) lines.push('Product / service: ' + data.product);
          if (data.grade) lines.push('Material grade: ' + data.grade);
          lines.push('', data.message);
          window.open(waLink(lines.join('\n')), '_blank', 'noopener');
        } else {
          location.href = 'mailto:' + (SITE.email || '') + '?subject=' + encodeURIComponent(data.subject + ' — ' + data.name) +
            '&body=' + encodeURIComponent(data.message + '\n\n' + data.name + ' (' + data.email + ')');
        }
        status.textContent = isQuote
          ? I18N.t('f.okStaticQuote', 'WhatsApp is opening with your request — just press send.')
          : I18N.t('f.okStaticInq', 'Your email app is opening with your message — just press send.');
        status.className = 'form-status ok';
        return;
      }

      var opts = { method: 'POST' };
      if (isQuote) {
        var fd = new FormData(form);
        var phone = String(fd.get('phone') || '').trim();
        if (phone && phone.charAt(0) !== '+') fd.set('phone', '+974 ' + phone);
        opts.body = fd;
      } else {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(Object.fromEntries(new FormData(form)));
      }

      var original = label.innerHTML;
      btn.disabled = true;
      label.textContent = I18N.t('f.sending', 'Sending…');

      fetch(isQuote ? '/api/quote' : '/api/inquiry', opts)
        .then(function (r) { return r.json().then(function (body) { return { ok: r.ok, body: body }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.body.error);
          form.reset();
          if (drop) $('[data-file-name]', drop).textContent = 'PDF, DWG, DXF, JPG, PNG (max 10 MB)';
          status.textContent = isQuote
            ? I18N.t('f.okQuote', 'Thank you! Your quote request has been received. Our team will contact you shortly.')
            : I18N.t('f.okInq', 'Thank you! Your message has been received. We will get back to you soon.');
          status.className = 'form-status ok';
        })
        .catch(function (err) {
          status.textContent = isAr() ? I18N.t('f.err', '') : (err.message || 'Could not send. Please try again or contact us on WhatsApp.');
          status.className = 'form-status err';
        })
        .then(function () { btn.disabled = false; label.innerHTML = original; });
    });
  });

  /* ---------------- language changes ---------------- */
  document.addEventListener('langchange', function () {
    renderProducts();
    fillProductSelect();
    if (gallery) { renderFilters(); renderProjects(); }
  });

  I18N.apply();
  observeReveal(document);
})();
