/* ============================================================
   THE FOUNDHER TABLE — app.js
   Lenis + GSAP ScrollTrigger scroll-driven experience
   ============================================================ */

(function () {
  'use strict';

  /* ---- CANVAS SETUP ---- */
  const canvas  = document.getElementById('canvas');
  const ctx     = canvas.getContext('2d');
  const canvasWrap = document.getElementById('canvas-wrap');

  let canvasW = 0, canvasH = 0;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvasW = window.innerWidth;
    canvasH = window.innerHeight;
    canvas.width  = canvasW * dpr;
    canvas.height = canvasH * dpr;
    ctx.scale(dpr, dpr);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  /* ---- ANIMATED CANVAS: BURGUNDY SATIN SHIMMER ---- */
  let animFrame = 0;
  let scrollProg = 0;

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function lerp(a, b, t)    { return a + (b - a) * clamp(t, 0, 1); }

  function drawCanvas() {
    ctx.clearRect(0, 0, canvasW, canvasH);

    const t = scrollProg;
    const f = animFrame;

    /* Base radial gradient shifts with scroll and time */
    const cx = canvasW * (0.45 + Math.sin(f * 0.0004) * 0.08);
    const cy = canvasH * (0.42 + Math.cos(f * 0.0003) * 0.06);
    const radius = Math.max(canvasW, canvasH) * 0.9;
    const base = ctx.createRadialGradient(cx, cy, 0, canvasW / 2, canvasH / 2, radius);

    /* Inner color: transitions from deep maroon → rich burgundy as you scroll */
    const r1 = Math.round(lerp(90,  130, t));
    const g1 = Math.round(lerp(8,   22,  t));
    const b1 = Math.round(lerp(30,  50,  t));

    const r2 = Math.round(lerp(40,  70,  t));
    const g2 = Math.round(lerp(2,   8,   t));
    const b2 = Math.round(lerp(12,  25,  t));

    base.addColorStop(0,   `rgb(${r1},${g1},${b1})`);
    base.addColorStop(0.5, `rgb(${r2},${g2},${b2})`);
    base.addColorStop(1,   '#140008');

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvasW, canvasH);

    /* Satin sheen — diagonal light sweep */
    const sheenPct = 0.15 + Math.sin(f * 0.0005) * 0.35;
    const sheenX0  = canvasW * sheenPct;
    const sheenX1  = canvasW * (sheenPct + 0.25);
    const sheen    = ctx.createLinearGradient(sheenX0, 0, sheenX1, canvasH);

    sheen.addColorStop(0,    'rgba(255,230,200,0)');
    sheen.addColorStop(0.42, 'rgba(255,230,200,0)');
    sheen.addColorStop(0.50, 'rgba(255,220,180,0.055)');
    sheen.addColorStop(0.58, 'rgba(255,230,200,0)');
    sheen.addColorStop(1,    'rgba(255,230,200,0)');

    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, canvasW, canvasH);

    /* Secondary warm accent glow (bottom-left) */
    const glow = ctx.createRadialGradient(
      canvasW * 0.15, canvasH * 0.85, 0,
      canvasW * 0.15, canvasH * 0.85,
      canvasW * 0.45
    );
    glow.addColorStop(0,   `rgba(160, 36, 58, ${0.18 + t * 0.12})`);
    glow.addColorStop(0.6, 'rgba(90, 14, 30, 0.06)');
    glow.addColorStop(1,   'rgba(90, 14, 30, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvasW, canvasH);

    animFrame++;
    requestAnimationFrame(drawCanvas);
  }

  drawCanvas();

  /* ---- LOADER ---- */
  const loader    = document.getElementById('loader');
  const loaderBar = document.getElementById('loader-bar');
  let loadPct = 0;

  const loadTimer = setInterval(() => {
    loadPct += Math.random() * 12 + 5;
    if (loadPct >= 100) {
      loadPct = 100;
      clearInterval(loadTimer);
      loaderBar.style.width = '100%';
      setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => { loader.style.display = 'none'; }, 900);
      }, 350);
    }
    loaderBar.style.width = loadPct + '%';
  }, 75);

  /* ---- WAIT FOR GSAP + LENIS ---- */
  window.addEventListener('load', init);

  function init() {
    gsap.registerPlugin(ScrollTrigger);

    /* LENIS SMOOTH SCROLL */
    const lenis = new Lenis({
      duration:    1.2,
      easing:      (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    const scrollContainer = document.getElementById('scroll-container');
    const hero            = document.getElementById('hero');
    const header          = document.getElementById('site-header');
    const overlay         = document.getElementById('dark-overlay');
    const marqueeWrap     = document.getElementById('marquee-wrap');
    const marqueeTrack    = document.getElementById('marquee-track');

    /* ---- HEADER SCROLL STATE ---- */
    ScrollTrigger.create({
      trigger:    scrollContainer,
      start:      'top -60px',
      onEnter:    () => header.classList.add('scrolled'),
      onLeaveBack:() => header.classList.remove('scrolled'),
    });

    /* ---- HERO FADE + CANVAS CIRCLE WIPE ---- */
    ScrollTrigger.create({
      trigger: scrollContainer,
      start:   'top top',
      end:     'bottom bottom',
      scrub:   true,
      onUpdate(self) {
        scrollProg = self.progress;

        /* Hero fades away quickly */
        const heroFade = clamp(1 - self.progress * 14, 0, 1);
        hero.style.opacity = heroFade;

        /* Canvas reveals via expanding circle */
        const wipe = clamp((self.progress - 0.01) / 0.07, 0, 1);
        canvasWrap.style.clipPath = `circle(${wipe * 82}% at 50% 50%)`;
      },
    });

    /* ---- DARK OVERLAY (quote 44-56% + stats 81-89%) ---- */
    const overlayZones = [
      { enter: 0.42, leave: 0.58 },
      { enter: 0.79, leave: 0.91 },
    ];

    ScrollTrigger.create({
      trigger: scrollContainer,
      start:   'top top',
      end:     'bottom bottom',
      scrub:   true,
      onUpdate(self) {
        const p    = self.progress;
        const fade = 0.03;
        let   op   = 0;

        for (const z of overlayZones) {
          if      (p >= z.enter - fade && p < z.enter)  op = Math.max(op, (p - (z.enter - fade)) / fade);
          else if (p >= z.enter && p <= z.leave)         op = Math.max(op, 1);
          else if (p > z.leave && p <= z.leave + fade)   op = Math.max(op, 1 - (p - z.leave) / fade);
        }

        overlay.style.opacity = op;
      },
    });

    /* ---- MARQUEE ---- */
    const marqStart = 0.28, marqEnd = 0.67, marqFade = 0.04;

    ScrollTrigger.create({
      trigger: scrollContainer,
      start:   'top top',
      end:     'bottom bottom',
      scrub:   true,
      onUpdate(self) {
        const p = self.progress;
        let   op = 0;

        if      (p >= marqStart && p < marqStart + marqFade) op = (p - marqStart) / marqFade;
        else if (p >= marqStart + marqFade && p < marqEnd - marqFade) op = 0.55;
        else if (p >= marqEnd - marqFade && p <= marqEnd)    op = 0.55 * (1 - (p - (marqEnd - marqFade)) / marqFade);

        marqueeWrap.style.opacity = op;

        const range = marqEnd - marqStart;
        const pct   = clamp((p - marqStart) / range, 0, 1);
        gsap.set(marqueeTrack, { xPercent: -pct * 28 });
      },
    });

    /* ---- SECTION ANIMATION SYSTEM ---- */
    const sections = document.querySelectorAll('.scroll-section');

    sections.forEach((section) => {
      const enterPct  = parseFloat(section.dataset.enter) / 100;
      const leavePct  = parseFloat(section.dataset.leave) / 100;
      const animType  = section.dataset.animation;
      const persist   = section.dataset.persist === 'true';

      /* Collect animatable children */
      const targets = section.querySelectorAll(
        '.section-label, .section-heading, .section-body, .section-link, ' +
        '.pillar, .stat, ' +
        '.cta-heading, .cta-sub, .cta-button, .cta-note, ' +
        '.brand-quote'
      );

      /* Build GSAP timeline */
      const tl = gsap.timeline({ paused: true });
      const dur = 0.9, stag = 0.12;

      switch (animType) {
        case 'slide-right':
          tl.from(targets, { x: -70, opacity: 0, stagger: stag, duration: dur, ease: 'power3.out' });
          break;
        case 'fade-up':
          tl.from(targets, { y: 55, opacity: 0, stagger: stag, duration: dur, ease: 'power3.out' });
          break;
        case 'clip-reveal':
          tl.from(targets, {
            clipPath: 'inset(100% 0 0 0)', opacity: 0,
            stagger: stag, duration: 1.3, ease: 'power4.inOut',
          });
          break;
        case 'stagger-up':
          tl.from(targets, { y: 60, opacity: 0, stagger: 0.15, duration: 0.85, ease: 'power3.out' });
          break;
        case 'scale-up':
          tl.from(targets, { scale: 0.87, opacity: 0, stagger: stag, duration: 1.05, ease: 'power2.out' });
          break;
        case 'rotate-in':
          tl.from(targets, { y: 45, rotation: 2, opacity: 0, stagger: 0.11, duration: dur, ease: 'power3.out' });
          break;
        default:
          tl.from(targets, { opacity: 0, stagger: stag, duration: dur, ease: 'power2.out' });
      }

      let played = false;

      ScrollTrigger.create({
        trigger: scrollContainer,
        start:   'top top',
        end:     'bottom bottom',
        onUpdate(self) {
          const p = self.progress;
          const visible = p >= enterPct && p <= leavePct;

          if (visible) {
            gsap.set(section, { opacity: 1 });
            section.classList.add('is-active');
            if (!played) {
              tl.restart();
              played = true;
            }
          } else if (!persist) {
            gsap.set(section, { opacity: 0 });
            section.classList.remove('is-active');
            played = false;
          }
        },
      });
    });

    /* ---- COUNTER ANIMATIONS (stats) ---- */
    document.querySelectorAll('.stat-number').forEach((el) => {
      const target   = parseFloat(el.dataset.value);
      const decimals = parseInt(el.dataset.decimals || '0');
      let   triggered = false;

      ScrollTrigger.create({
        trigger:     el.closest('.scroll-section'),
        start:       'top 80%',
        onEnter:     () => {
          if (triggered) return;
          triggered = true;

          const proxy = { val: 0 };
          gsap.to(proxy, {
            val:      target,
            duration: 2.4,
            ease:     'power1.out',
            onUpdate() {
              el.textContent = decimals === 0
                ? Math.round(proxy.val)
                : proxy.val.toFixed(decimals);
            },
          });
        },
      });
    });
  }

})();
