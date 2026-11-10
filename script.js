/* ==========================================================================
   Centro Podológico CDMX — script.js
   Sin dependencias externas: todo es JavaScript nativo.
   Regla de oro: el contenido es visible por defecto; el JS solo lo mejora y
   cada efecto tiene un respaldo para que nunca quede una sección vacía.
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- Configuración ----------
     Número de WhatsApp en formato internacional sin signos: 52 + 10 dígitos.
     Es la ÚNICA fuente de verdad: todos los botones y el formulario la leen.
     Si se deja vacío, los botones y el envío de WhatsApp se ocultan solos. */
  const WHATSAPP_NUMBER = '525515048488';

  const root = document.documentElement;
  root.classList.add('js');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isDesktop = () => matchMedia('(min-width: 960px)').matches;
  const safe = (fn) => { try { fn(); } catch (err) { console.warn('[landing]', err); } };

  /* ==========================================================================
     1. Revelados al hacer scroll (con respaldo por geometría)
     ========================================================================== */
  const pending = new Set();
  let revealObserver = null;

  function reveal(el) {
    el.classList.add('in');
    pending.delete(el);
    if (revealObserver) revealObserver.unobserve(el);
  }

  // Respaldo: revela todo lo que ya esté dentro de la ventana, aunque el observador falle.
  function revealPass() {
    const vh = innerHeight || 800;
    pending.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) reveal(el);
    });
  }

  function initReveal() {
    const els = $$('[data-reveal]');
    $$('[data-stagger]').forEach((box) => {
      $$(':scope > [data-reveal]', box).forEach((el, i) => el.style.setProperty('--d', (i * 0.08).toFixed(2) + 's'));
    });
    $$('.bento .pillar').forEach((el, i) => el.style.setProperty('--d', ((i % 2) * 0.12).toFixed(2) + 's'));

    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    els.forEach((el) => pending.add(el));
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) reveal(en.target); });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => revealObserver.observe(el));
  }

  /* ==========================================================================
     2. Cargador (desaparece solo en menos de 2.5 s; hay respaldo en CSS)
     ========================================================================== */
  function initLoader() {
    const loader = $('#loader');
    const pct = $('#pct');
    if (!loader) { root.classList.add('is-loaded'); return; }

    const DUR = reduce ? 450 : 1250;
    const MAX = reduce ? 600 : 1500;
    const t0 = performance.now();
    let finished = false;

    const paint = (p) => {
      loader.style.setProperty('--p', p);
      if (pct) pct.textContent = String(p);
    };
    paint(0);

    const finish = () => {
      if (finished) return;
      finished = true;
      paint(100);
      root.classList.add('is-loaded');
      loader.classList.add('is-out');
      loader.setAttribute('aria-hidden', 'true');
      revealPass();
      setTimeout(() => { loader.classList.add('is-gone'); revealPass(); }, 800);
    };

    const tick = (now) => {
      if (finished) return;
      const t = now - t0;
      const e = clamp(t / DUR);
      paint(Math.round(100 * (1 - Math.pow(1 - e, 2.2))));
      if (t >= MAX || (e >= 1 && document.readyState === 'complete')) finish();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // Si la pestaña está en segundo plano, requestAnimationFrame se pausa: este temporizador lo cubre.
    setTimeout(finish, MAX + 100);
  }

  /* ==========================================================================
     3. Menú móvil
     ========================================================================== */
  function initMenu() {
    const burger = $('#burger');
    const menu = $('#menu');
    if (!burger || !menu) return;
    const set = (open) => {
      root.classList.toggle('is-menu', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.setAttribute('aria-hidden', String(!open));
    };
    burger.addEventListener('click', () => set(!root.classList.contains('is-menu')));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) set(false); });
  }

  /* ==========================================================================
     4. WhatsApp: botones, formulario y botón flotante
     ========================================================================== */
  const waURL = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

  function openWhatsApp(url) {
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function initWhatsApp() {
    const hasNumber = /^\d{10,15}$/.test(WHATSAPP_NUMBER);
    const form = $('#form');

    if (!hasNumber) {
      // Sin número: se ocultan con elegancia los botones y el envío (el CSS hace el resto).
      root.classList.add('no-wa');
      $$('[data-wa-display]').forEach((el) => { const li = el.closest('li'); if (li) li.style.display = 'none'; });
      if (form) form.hidden = true;
      return;
    }

    const d = WHATSAPP_NUMBER.slice(-10);
    const pretty = `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`;
    $$('[data-wa-display]').forEach((el) => { el.textContent = pretty; });

    $$('[data-wa]').forEach((a) => {
      if (a.classList.contains('hdr__cta')) return; // el botón del encabezado lleva al formulario
      a.href = waURL(a.dataset.waMsg || 'Hola, quiero agendar una visita podológica a domicilio.');
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });

    if (form) {
      const msg = $('#formMsg');
      const nombre = $('#f-nombre');
      const zona = $('#f-zona');
      [nombre, zona].forEach((i) => i.addEventListener('input', () => i.classList.remove('is-bad')));

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const vNombre = String(fd.get('nombre') || '').trim();
        const vZona = String(fd.get('zona') || '').trim();
        const bad = [];
        nombre.classList.toggle('is-bad', !vNombre); if (!vNombre) bad.push(nombre);
        zona.classList.toggle('is-bad', !vZona); if (!vZona) bad.push(zona);
        if (bad.length) {
          msg.style.color = '#b03a2e';
          msg.textContent = 'Cuéntanos tu nombre y tu zona para poder ayudarte.';
          bad[0].focus();
          return;
        }
        const lines = [
          `Hola, soy ${vNombre}. Quiero agendar una visita podológica a domicilio (${fd.get('para')}).`,
          `Mi zona: ${vZona}.`,
          `Necesito: ${fd.get('servicio')}.`
        ];
        const extra = String(fd.get('mensaje') || '').trim();
        if (extra) lines.push(`Comentarios: ${extra}`);
        msg.style.color = '#1d7a49';
        msg.textContent = 'Abriendo WhatsApp con tu mensaje…';
        openWhatsApp(waURL(lines.join('\n')));
      });
    }

    // El botón flotante "asoma" su texto cada cierto tiempo (animación constante, solo escritorio)
    const fab = $('.wa-float');
    if (fab && !reduce) {
      setInterval(() => {
        fab.classList.add('is-peek');
        setTimeout(() => fab.classList.remove('is-peek'), 3200);
      }, 9000);
    }
  }

  /* ==========================================================================
     5. Hero: anillo de texto, reloj de 24 h, partículas y parallax
     ========================================================================== */
  function initHeroBits() {
    const ring = $('.hv__ring');
    if (ring) {
      const chars = Array.from(ring.dataset.ring || '');
      chars.forEach((ch, i) => {
        const s = document.createElement('span');
        s.textContent = ch === ' ' ? ' ' : ch;
        s.style.setProperty('--a', (i / chars.length * 360).toFixed(2) + 'deg');
        ring.appendChild(s);
      });
    }
    // Las motos del radar usan SMIL: con movimiento reducido se detienen desde JS
    if (reduce) $$('.radar svg').forEach((s) => { if (s.pauseAnimations) s.pauseAnimations(); });
    const ticks = $('.dial24__ticks');
    if (ticks) {
      let html = '';
      for (let i = 0; i < 24; i++) {
        html += `<line x1="50" y1="5" x2="50" y2="${i % 6 === 0 ? 12 : 9}" transform="rotate(${i * 15} 50 50)"/>`;
      }
      ticks.innerHTML = html;
    }
  }

  function initParticles() {
    const cv = $('.hero__canvas');
    const hero = $('.hero');
    if (!cv || !hero || reduce || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    const palette = ['127,143,110', '154,101,66', '58,165,216'];
    let w = 0, h = 0, parts = [], running = false, visible = true;
    const mouse = { x: -999, y: -999 };

    const make = (i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.6 + Math.random() * 3.2,
      vx: (Math.random() - 0.5) * 0.28,
      vy: -(0.12 + Math.random() * 0.32),
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.012,
      c: palette[i % 3],
      leaf: Math.random() < 0.5,
      a: 0.22 + Math.random() * 0.4
    });

    const resize = () => {
      const r = hero.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp(w * h / 24000, 26, 72));
      parts = Array.from({ length: n }, (_, i) => make(i));
    };

    const frame = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14400) { const d = Math.sqrt(d2) || 1; const f = (120 - d) / 120; p.x += dx / d * f * 2.2; p.y += dy / d * f * 2.2; }
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w; }
        if (p.x < -12) p.x = w + 12; else if (p.x > w + 12) p.x = -12;

        // líneas entre partículas cercanas: red sutil, aire "tech"
        for (let j = i + 1; j < parts.length; j++) {
          const q = parts[j];
          const lx = p.x - q.x, ly = p.y - q.y;
          const ld = lx * lx + ly * ly;
          if (ld < 8100) {
            ctx.strokeStyle = `rgba(58,165,216,${(1 - ld / 8100) * 0.16})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }

        if (p.leaf) {
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.beginPath(); ctx.ellipse(0, 0, p.r * 2.3, p.r, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.c},${p.a})`; ctx.fill();
          ctx.beginPath(); ctx.moveTo(-p.r * 2.3, 0); ctx.lineTo(p.r * 2.3, 0);
          ctx.strokeStyle = `rgba(255,255,255,${p.a * 0.8})`; ctx.lineWidth = 0.6; ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.c},${p.a + 0.1})`; ctx.fill();
        }
      }
      requestAnimationFrame(frame);
    };

    const sync = () => {
      const should = visible && !document.hidden;
      if (should && !running) { running = true; requestAnimationFrame(frame); }
      else if (!should) running = false;
    };

    resize();
    addEventListener('resize', () => { resize(); }, { passive: true });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; sync(); }).observe(hero);
    }
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      hero.style.setProperty('--mx', (mouse.x / r.width * 100).toFixed(1) + '%');
      hero.style.setProperty('--my', (mouse.y / r.height * 100).toFixed(1) + '%');
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    sync();
  }

  function initHeroParallax() {
    if (reduce || !finePointer) return;
    const hero = $('.hero');
    const els = $$('.hero [data-parallax]');
    if (!hero || !els.length) return;
    els.forEach((el) => { el.style.transition = 'none'; });
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;

    const tick = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      els.forEach((el) => {
        const k = parseFloat(el.dataset.parallax) || 0;
        const base = el.matches('.hv__arch img') ? ' scale(1.14)' : '';
        el.style.transform = `translate3d(${(cx * k * 600).toFixed(2)}px, ${(cy * k * 600).toFixed(2)}px, 0)${base}`;
      });
      raf = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      kick();
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
  }

  /* ==========================================================================
     6. Interacciones: inclinación 3D, tratamientos, visor de fotos
     ========================================================================== */
  function initTilt() {
    if (reduce || !finePointer) return;
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((x - 0.5) * 8).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
    $$('[data-flyer]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((x - 0.5) * 22).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - y) * 18).toFixed(2) + 'deg');
        el.style.setProperty('--gx', (x * 100).toFixed(0) + '%');
        el.style.setProperty('--gy', (y * 100).toFixed(0) + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  function initTreatments() {
    const row = $('#treat');
    if (!row) return;
    const cards = $$('.tcard', row);
    let touched = false;
    let inView = false;

    const setOpen = (idx) => {
      cards.forEach((c, k) => {
        const open = k === idx;
        c.classList.toggle('is-open', open);
        const b = $('.tcard__btn', c);
        if (b) b.setAttribute('aria-expanded', String(open));
      });
    };

    cards.forEach((c, i) => {
      const b = $('.tcard__btn', c);
      b.addEventListener('click', () => {
        touched = true;
        const wasOpen = c.classList.contains('is-open');
        if (wasOpen && !isDesktop()) setOpen(-1); else setOpen(i);
      });
    });

    matchMedia('(min-width: 960px)').addEventListener('change', (e) => {
      if (e.matches && !cards.some((c) => c.classList.contains('is-open'))) setOpen(0);
    });

    // En escritorio, las tarjetas rotan solas hasta que la persona interactúa
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver((en) => { inView = en[0].isIntersecting; }, { threshold: 0.3 }).observe(row);
      setInterval(() => {
        if (touched || !inView || !isDesktop() || document.hidden) return;
        const cur = cards.findIndex((c) => c.classList.contains('is-open'));
        setOpen((cur + 1) % cards.length);
      }, 5200);
    }
  }

  function initLightbox() {
    const lb = $('#lightbox');
    if (!lb) return;
    const img = $('#lbImg'), cap = $('#lbCap'), close = $('#lbClose');
    let lastFocus = null;

    const open = (btn) => {
      const inner = $('img', btn);
      lastFocus = btn;
      img.src = btn.dataset.lightbox;
      img.alt = inner ? inner.alt : '';
      cap.textContent = btn.dataset.caption || '';
      lb.classList.toggle('is-full', btn.hasAttribute('data-full'));
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      close.focus({ preventScroll: true });
    };
    const shut = () => {
      if (!lb.classList.contains('is-open')) return;
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };

    $$('[data-lightbox]').forEach((b) => b.addEventListener('click', () => open(b)));
    close.addEventListener('click', shut);
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox__fig')) shut(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') shut(); });
    // Con el visor abierto, el scroll de la página de fondo se detiene
    ['wheel', 'touchmove'].forEach((t) => lb.addEventListener(t, (e) => e.preventDefault(), { passive: false }));
  }

  /* ==========================================================================
     7. Texto del enfoque que se "enciende" palabra por palabra
     ========================================================================== */
  let words = [];
  let statementEl = null;

  function initStatement() {
    statementEl = $('[data-split]');
    if (!statementEl || reduce) return;
    const nodes = Array.from(statementEl.childNodes);
    statementEl.textContent = '';
    nodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { statementEl.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = 'w'; s.textContent = tok;
          statementEl.appendChild(s);
          words.push(s);
        });
      } else {
        // El <em> con degradado se enciende como una sola pieza (evita romper su recorte de texto)
        n.classList.add('w');
        statementEl.appendChild(n);
        words.push(n);
      }
    });
  }

  /* ==========================================================================
     8. Carrete horizontal anclado al scroll
     ========================================================================== */
  const reel = $('#galeria');
  const reelTrack = $('#reelTrack');
  let reelOn = false;
  let reelMax = 0;

  function setupReel() {
    if (!reel || !reelTrack || reduce) return;
    reel.classList.add('js-reel');
    const vw = innerWidth, vh = innerHeight;
    const tw = reelTrack.scrollWidth;
    reelMax = Math.max(0, tw - vw);
    reel.style.height = (reelMax + vh) + 'px';
    reelOn = reelMax > 0;
    if (!reelOn) { reel.classList.remove('js-reel'); reel.style.height = ''; reelTrack.style.transform = ''; }
    else $$('img[loading="lazy"]', reelTrack).forEach((im) => { im.loading = 'eager'; });
  }

  function initReelFocus() {
    if (!reel || !reelTrack) return;
    const sticky = $('.reel__sticky', reel);
    if (sticky) sticky.addEventListener('scroll', () => { sticky.scrollLeft = 0; });
    reelTrack.addEventListener('focusin', (e) => {
      if (!reelOn) return;
      const s = e.target.closest('.slide');
      if (!s) return;
      const r = reel.getBoundingClientRect();
      const total = reel.offsetHeight - innerHeight;
      const p = clamp((s.offsetLeft - 24) / reelMax);
      scrollTo({ top: scrollY + r.top + p * total, behavior: 'auto' });
    });
  }

  /* ==========================================================================
     9. Bucle principal de scroll (todo lo que depende de la posición)
     ========================================================================== */
  const hdr = $('#hdr');
  const marquee = $('#marquee');
  const portal = $('#portal');
  const stepsEl = $('#steps');
  const steps = $$('.step', stepsEl || document);
  const dialFg = $('#dialFg');
  const dialN = $('#dialN');
  const dialT = $('#dialT');
  const scrollParallax = $$('[data-parallax]').filter((el) => !el.closest('.hero'));
  const navLinks = $$('.nav a');
  const navSections = navLinks.map((a) => $(a.getAttribute('href')));
  let lastY = scrollY;
  let skewTimer = 0;
  let activeStep = -1;

  scrollParallax.forEach((el) => { el.style.transition = 'none'; });
  if (marquee && !reduce) marquee.style.transition = 'transform .5s ease-out';

  function update() {
    const y = scrollY;
    const vh = innerHeight || 800;

    // barra de progreso
    safe(() => {
      const max = root.scrollHeight - vh;
      root.style.setProperty('--sp', max > 0 ? clamp(y / max).toFixed(4) : 0);
    });

    // encabezado
    safe(() => {
      if (!hdr) return;
      hdr.classList.toggle('is-stuck', y > 30);
      if (!root.classList.contains('is-menu')) {
        if (y > lastY + 4 && y > 420) hdr.classList.add('is-hidden');
        else if (y < lastY - 4 || y < 420) hdr.classList.remove('is-hidden');
      }
    });

    // franja de servicios: se inclina con la velocidad del scroll
    safe(() => {
      if (!marquee || reduce) return;
      const v = clamp((y - lastY) * 0.05, -2, 2);
      marquee.style.setProperty('--sk', v.toFixed(2) + 'deg');
      clearTimeout(skewTimer);
      skewTimer = setTimeout(() => marquee.style.setProperty('--sk', '0deg'), 110);
    });

    // texto del enfoque
    safe(() => {
      if (!statementEl || !words.length) return;
      const r = statementEl.getBoundingClientRect();
      const p = clamp((vh * 0.86 - r.top) / (r.height + vh * 0.38));
      const n = words.length;
      words.forEach((w, i) => {
        const o = clamp(0.16 + (p * 1.25 - i / n) * 8, 0.16, 1);
        w.style.opacity = o.toFixed(2);
      });
    });

    // pasos del servicio preventivo
    safe(() => {
      if (!steps.length || !stepsEl) return;
      const or = stepsEl.getBoundingClientRect();
      stepsEl.style.setProperty('--fill', clamp((vh * 0.55 - or.top) / or.height).toFixed(4));
      let best = 0, bd = Infinity;
      steps.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - vh * 0.5);
        if (d < bd) { bd = d; best = i; }
      });
      if (best !== activeStep) {
        activeStep = best;
        steps.forEach((s, i) => s.classList.toggle('is-active', i === best));
        if (dialFg) dialFg.style.strokeDashoffset = String(100 - (best + 1) / steps.length * 100);
        if (dialN) dialN.textContent = String(best + 1).padStart(2, '0');
        if (dialT) dialT.textContent = steps[best].dataset.title || '';
      }
    });

    // portal que se abre
    safe(() => {
      if (!portal || reduce) return;
      const r = portal.getBoundingClientRect();
      const total = Math.max(1, r.height - vh);
      const p = clamp((vh - r.top) / (vh + 0.4 * total));
      portal.style.setProperty('--p', p.toFixed(4));
    });

    // carrete horizontal
    safe(() => {
      if (!reelOn) return;
      const r = reel.getBoundingClientRect();
      const total = Math.max(1, reel.offsetHeight - vh);
      const p = clamp(-r.top / total);
      reelTrack.style.transform = `translate3d(${(-p * reelMax).toFixed(1)}px, 0, 0)`;
      reel.style.setProperty('--rp', p.toFixed(4));
    });

    // parallax vertical suave
    safe(() => {
      if (reduce) return;
      scrollParallax.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const k = parseFloat(el.dataset.parallax) || 0;
        el.style.transform = `translate3d(0, ${((vh / 2 - (r.top + r.height / 2)) * k).toFixed(1)}px, 0)`;
      });
    });

    // enlace activo del menú
    safe(() => {
      let cur = -1;
      navSections.forEach((s, i) => {
        if (!s) return;
        const r = s.getBoundingClientRect();
        if (r.top <= vh * 0.4 && r.bottom > vh * 0.4) cur = i;
      });
      navLinks.forEach((a, i) => a.classList.toggle('is-current', i === cur));
    });

    // respaldo de revelados
    safe(revealPass);

    lastY = y;
  }

  let ticking = false;
  function request() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }

  /* ==========================================================================
     Arranque
     ========================================================================== */
  function boot() {
    safe(initLoader);
    safe(initMenu);
    safe(initWhatsApp);
    safe(initHeroBits);
    safe(initReveal);
    safe(initStatement);
    safe(setupReel);
    safe(initReelFocus);
    safe(initTreatments);
    safe(initLightbox);
    safe(initTilt);
    safe(initHeroParallax);
    safe(initParticles);

    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', () => { safe(setupReel); request(); }, { passive: true });
    addEventListener('orientationchange', () => setTimeout(() => { safe(setupReel); request(); }, 250));
    addEventListener('load', () => { safe(setupReel); request(); setTimeout(() => { revealPass(); request(); }, 2000); });
    setTimeout(() => { revealPass(); request(); }, 2000);
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
