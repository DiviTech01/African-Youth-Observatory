/**
 * Injects a scroll-reveal/counter/bar-fill/gauge-arc animation block into PKPB
 * report HTML at serve time. Run only when the document is being viewed
 * inline (iframe), never on direct downloads — those stay byte-pure so the
 * file the user downloads matches what the contributor uploaded.
 *
 * The injected JS:
 *   - Looks for every well-known PACSDA template selector for sections, bars,
 *     numerics, and the AYEMI gauge. If a future upload uses different markup
 *     the script is a graceful no-op (queries return empty).
 *   - Uses IntersectionObserver inside the iframe — no cross-origin call back
 *     to the parent — so this works in both dev and prod.
 *   - The cover-AYEMI-score and gauge-pct numbers get a "raging engine" effect:
 *     they overshoot to 100, then settle back to the real value.
 *   - The gauge arc animates its stroke-dashoffset from empty → final.
 *   - A reading-progress bar tracks how far through the report the user has
 *     scrolled.
 *   - The parliament-seat visualization fills in youth seats first (with a
 *     gold glow), then non-youth seats — visually narrating the gap.
 *   - When a bar fill reaches its target it gets a brief brightness/glow
 *     pulse so a long stack of bars doesn't feel mechanical.
 *   - Snaps to final state on `beforeprint` and under `@media print`, so
 *     "Save as PDF" produces a fully-rendered document.
 *   - Honors `prefers-reduced-motion`.
 */

const ANIMATION_BLOCK = `
<style data-ayd-pkpb-animations>
  /* Reading-progress bar — pinned to the top of the iframe viewport. */
  #ayd-reading-progress {
    position: fixed;
    top: 0; left: 0;
    height: 2px; width: 0;
    background: linear-gradient(90deg, #C9942A 0%, #D4A017 50%, #E8B431 100%);
    box-shadow: 0 0 8px rgba(212,160,23,0.55);
    z-index: 99999;
    transition: width 100ms ease-out;
    pointer-events: none;
  }
  /* Bar-completion pulse — a brief brightness + edge glow when a fill reaches
     its target. Uses currentColor where possible so it inherits the bar tint. */
  @keyframes ayd-bar-pulse {
    0%   { filter: brightness(1.55) saturate(1.25); box-shadow: 4px 0 14px 0 rgba(255,255,255,0.45); }
    100% { filter: brightness(1) saturate(1); box-shadow: 0 0 0 0 rgba(255,255,255,0); }
  }
  .ayd-bar-done { animation: ayd-bar-pulse 700ms cubic-bezier(.22,1,.36,1) both; }

  /* Print snapshot — ensure animation states don't bleed into the PDF. */
  @media print {
    #ayd-reading-progress { display: none !important; }
    [data-ayd-reveal] { opacity: 1 !important; transform: none !important; }
    .bar-fill[data-ayd-target], .prog-fill[data-ayd-target] {
      width: var(--ayd-final-width, attr(data-ayd-target)) !important;
      transition: none !important;
      animation: none !important;
    }
    .seat[data-ayd-seat] { opacity: 1 !important; transform: none !important; box-shadow: none !important; }
  }
  /* Reduced-motion users see the final state immediately. */
  @media (prefers-reduced-motion: reduce) {
    #ayd-reading-progress { display: none !important; }
    [data-ayd-reveal] { opacity: 1 !important; transform: none !important; transition: none !important; }
    .ayd-bar-done { animation: none !important; }
  }
</style>
<script data-ayd-pkpb-animations>
(function(){
  if (window.__aydPkpbAnimations) return;
  window.__aydPkpbAnimations = true;

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // ─── CTA button rewiring (always run, even if section markers are absent) ─
  // The PACSDA template ships hard-coded mailto/external links in the CTA;
  // when the report is rendered inside our dashboard iframe we route them to
  // the right places: Partner → external contact page (new tab), AYIMS →
  // parent dashboard via postMessage so the parent React app can navigate.
  function rewireCtaButtons() {
    var partner = document.querySelector('.cta-btns .btn-p');
    if (partner && !partner.hasAttribute('data-ayd-rewired')) {
      partner.setAttribute('data-ayd-rewired', '');
      partner.setAttribute('href', 'https://pacsda.org/contact');
      partner.setAttribute('target', '_blank');
      partner.setAttribute('rel', 'noopener noreferrer');
    }
    var ayims = document.querySelector('.cta-btns .btn-s');
    if (ayims && !ayims.hasAttribute('data-ayd-rewired')) {
      ayims.setAttribute('data-ayd-rewired', '');
      // Fallback for users opening the iframe URL directly (no parent listener).
      ayims.setAttribute('href', '/dashboard');
      ayims.setAttribute('target', '_top');
      ayims.addEventListener('click', function(ev){
        try {
          if (window.parent && window.parent !== window) {
            ev.preventDefault();
            window.parent.postMessage({ type: 'ayd-pkpb:navigate', path: '/dashboard' }, '*');
          }
        } catch (e) { /* fall through to default href */ }
      });
    }
  }
  rewireCtaButtons();

  // ─── Reading-progress bar (always on, even if no .section markers exist) ──
  function installProgressBar() {
    if (reduce) return;
    if (document.getElementById('ayd-reading-progress')) return;
    var bar = document.createElement('div');
    bar.id = 'ayd-reading-progress';
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var de = document.documentElement;
      var docH = (de.scrollHeight || document.body.scrollHeight) - window.innerHeight;
      var sy = window.scrollY || de.scrollTop || document.body.scrollTop || 0;
      var pct = docH > 0 ? Math.min(100, Math.max(0, (sy / docH) * 100)) : 0;
      bar.style.width = pct + '%';
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }
  installProgressBar();

  // ─── Selectors ────────────────────────────────────────────────────────────
  var NUMERIC_SELECTOR = [
    '.score-value', '.gauge-pct', '.stat-num',
    '.cstat-val', '.demo-num', '.drain-num',
    '.gsr-num', '.gov-stat', '.health-num',
    '.mb-num', '.ind-val', '.bar-pct',
    '.rec-num'
  ].join(',');
  var BAR_SELECTOR = '.bar-fill, .prog-fill';
  var ENGINE_REV_SELECTOR = '.score-value, .gauge-pct';

  var sections = document.querySelectorAll('.section');
  if (!sections.length) return; // not a PACSDA-template doc — bail.

  // Stage sections.
  for (var i = 0; i < sections.length; i++) {
    var s = sections[i];
    s.setAttribute('data-ayd-reveal', '');
    s.style.opacity = reduce ? '1' : '0';
    s.style.transform = reduce ? 'none' : 'translateY(28px)';
    s.style.transition = 'opacity .85s cubic-bezier(.22,1,.36,1), transform .85s cubic-bezier(.22,1,.36,1)';
  }

  // Stage bar fills + bind the completion pulse to transitionend.
  var bars = document.querySelectorAll(BAR_SELECTOR);
  for (var j = 0; j < bars.length; j++) {
    var b = bars[j];
    var target = b.style.width || '';
    if (!target && window.getComputedStyle) {
      var cs = window.getComputedStyle(b);
      var px = parseFloat(cs.width);
      var parentPx = b.parentElement ? parseFloat(window.getComputedStyle(b.parentElement).width) : 0;
      if (parentPx > 0) target = ((px / parentPx) * 100).toFixed(1) + '%';
    }
    if (!target) continue;
    b.setAttribute('data-ayd-target', target);
    b.style.setProperty('--ayd-final-width', target);
    if (!reduce) {
      b.style.width = '0%';
      b.style.transition = 'width 1.5s cubic-bezier(.22,1,.36,1)';
      // When the width transition completes, briefly add the pulse class.
      // transitionend fires once per property; we filter on 'width'.
      b.addEventListener('transitionend', function(ev){
        if (ev.propertyName !== 'width') return;
        var el = ev.currentTarget;
        if (el.__aydPulsed) return;
        el.__aydPulsed = true;
        el.classList.add('ayd-bar-done');
        setTimeout(function(){ el.classList.remove('ayd-bar-done'); }, 750);
      });
    }
  }

  // Stage numeric counters.
  var numerics = document.querySelectorAll(NUMERIC_SELECTOR);
  for (var k = 0; k < numerics.length; k++) {
    var el = numerics[k];
    var raw = (el.textContent || '').trim();
    if (!raw) continue;
    var m = raw.match(/^([^0-9.\\-]*)(-?[0-9][0-9,]*(?:\\.[0-9]+)?)(.*)$/);
    if (!m) continue;
    var prefix = m[1] || '';
    var numStr = (m[2] || '').replace(/,/g, '');
    var num = parseFloat(numStr);
    if (isNaN(num)) continue;
    var decimals = numStr.indexOf('.') >= 0 ? numStr.split('.')[1].length : 0;
    var suffix = m[3] || '';
    el.setAttribute('data-ayd-num-target', String(num));
    el.setAttribute('data-ayd-num-prefix', prefix);
    el.setAttribute('data-ayd-num-suffix', suffix);
    el.setAttribute('data-ayd-num-decimals', String(decimals));
    el.setAttribute('data-ayd-num-original', raw);
    if (!reduce) el.textContent = prefix + (decimals > 0 ? (0).toFixed(decimals) : '0') + suffix;
  }

  // Mark engine-rev targets.
  var revvers = document.querySelectorAll(ENGINE_REV_SELECTOR);
  for (var r = 0; r < revvers.length; r++) revvers[r].setAttribute('data-ayd-engine-rev', '');

  // Stage gauge arcs.
  var gaugeArcs = document.querySelectorAll('.gauge-svg path[stroke-dasharray]');
  for (var g = 0; g < gaugeArcs.length; g++) {
    var arc = gaugeArcs[g];
    var dashArr = arc.getAttribute('stroke-dasharray') || '';
    var dashOff = arc.getAttribute('stroke-dashoffset');
    if (dashArr && dashOff !== null) {
      arc.setAttribute('data-ayd-arc-final', dashOff);
      if (!reduce) {
        arc.setAttribute('stroke-dashoffset', dashArr);
        arc.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.22,1,.36,1)';
      }
    }
  }

  // ─── Parliament dot pre-staging ───────────────────────────────────────────
  // The contributor's HTML builds .seat children into .parliament-vis on load
  // (220 dots, first N marked .seat-youth). We pre-hide them here so they can
  // cascade in when their section enters the viewport. We give the build script
  // a moment to run since both inline scripts execute at end-of-body.
  function stageParliament() {
    var seats = document.querySelectorAll('.parliament-vis .seat');
    for (var i = 0; i < seats.length; i++) {
      var s = seats[i];
      if (s.hasAttribute('data-ayd-seat')) continue;
      s.setAttribute('data-ayd-seat', '');
      if (!reduce) {
        s.style.opacity = '0';
        s.style.transform = 'scale(0.35)';
        s.style.transition = 'opacity 280ms ease-out, transform 380ms cubic-bezier(.34,1.56,.64,1), box-shadow 600ms ease-out';
      }
    }
  }
  // Run immediately and again next tick — covers the case where the seats are
  // built by an inline script that runs after this one (rare but possible).
  stageParliament();
  setTimeout(stageParliament, 0);

  function animateParliament(scope) {
    var youth = scope.querySelectorAll('.parliament-vis .seat.seat-youth[data-ayd-seat]');
    var others = scope.querySelectorAll('.parliament-vis .seat:not(.seat-youth)[data-ayd-seat]');
    if (!youth.length && !others.length) return;
    // Youth seats: slow + dramatic, with gold glow that fades.
    for (var i = 0; i < youth.length; i++) {
      (function(seat, idx){
        setTimeout(function(){
          seat.style.opacity = '1';
          seat.style.transform = 'scale(1)';
          seat.style.boxShadow = '0 0 10px rgba(212,160,23,0.95), 0 0 20px rgba(212,160,23,0.6)';
          setTimeout(function(){ seat.style.boxShadow = '0 0 0 0 rgba(212,160,23,0)'; }, 700);
        }, idx * 90);
      })(youth[i], i);
    }
    // Non-youth seats: fast cascade after youth, no glow.
    var otherStart = youth.length * 90 + 250;
    for (var j = 0; j < others.length; j++) {
      (function(seat, idx){
        setTimeout(function(){
          seat.style.opacity = '1';
          seat.style.transform = 'scale(1)';
        }, otherStart + idx * 4);
      })(others[j], j);
    }
  }

  // ─── Bar fills, gauge arcs, counters (per-section) ────────────────────────
  function fillBars(scope) {
    var bs = scope.querySelectorAll('.bar-fill[data-ayd-target], .prog-fill[data-ayd-target]');
    for (var i = 0; i < bs.length; i++) {
      (function(bar, idx){
        var t = bar.getAttribute('data-ayd-target');
        setTimeout(function(){ bar.style.width = t; }, idx * 60);
      })(bs[i], i);
    }
  }

  function animateGauges(scope) {
    var arcs = scope.querySelectorAll('.gauge-svg path[data-ayd-arc-final]');
    for (var i = 0; i < arcs.length; i++) {
      (function(a){
        var f = a.getAttribute('data-ayd-arc-final');
        requestAnimationFrame(function(){ a.setAttribute('stroke-dashoffset', f); });
      })(arcs[i]);
    }
  }

  function format(n, prefix, suffix, decimals) {
    return prefix + n.toFixed(decimals) + suffix;
  }

  function countNumber(el, target, prefix, suffix, decimals, isEngineRev) {
    var startTime = 0;

    if (isEngineRev && target < 100) {
      // RAGING ENGINE: 0 → 100 (rev up) → target (settle), with overshoot.
      var revUpDur = 700;
      var settleDur = 800;
      function tickRev(now) {
        if (!startTime) startTime = now;
        var elapsed = now - startTime;
        var v;
        if (elapsed < revUpDur) {
          var t1 = elapsed / revUpDur;
          var eased1 = 1 - Math.pow(1 - t1, 3);
          v = eased1 * 100;
        } else if (elapsed < revUpDur + settleDur) {
          var t2 = (elapsed - revUpDur) / settleDur;
          var c = 1.70158;
          var p = t2 - 1;
          var eased2 = 1 + c * p * p * p + c * p * p;
          v = 100 + (target - 100) * eased2;
        } else {
          el.textContent = format(target, prefix, suffix, decimals);
          return;
        }
        el.textContent = format(v, prefix, suffix, decimals);
        requestAnimationFrame(tickRev);
      }
      requestAnimationFrame(tickRev);
      return;
    }

    var duration = 1500;
    function tick(now) {
      if (!startTime) startTime = now;
      var t = Math.min(1, (now - startTime) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = format(eased * target, prefix, suffix, decimals);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function countNumbers(scope) {
    var ns = scope.querySelectorAll('[data-ayd-num-target]');
    for (var i = 0; i < ns.length; i++) {
      (function(el, idx){
        var target = parseFloat(el.getAttribute('data-ayd-num-target'));
        var prefix = el.getAttribute('data-ayd-num-prefix') || '';
        var suffix = el.getAttribute('data-ayd-num-suffix') || '';
        var decimals = parseInt(el.getAttribute('data-ayd-num-decimals') || '0', 10);
        var isEngineRev = el.hasAttribute('data-ayd-engine-rev');
        setTimeout(function(){
          countNumber(el, target, prefix, suffix, decimals, isEngineRev);
        }, idx * 100);
      })(ns[i], i);
    }
  }

  if (reduce) return;

  var io = new IntersectionObserver(function(entries){
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (!e.isIntersecting) continue;
      var el = e.target;
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      fillBars(el);
      animateGauges(el);
      countNumbers(el);
      animateParliament(el);
      io.unobserve(el);
    }
  }, { threshold: 0.18 });

  for (var s2 = 0; s2 < sections.length; s2++) io.observe(sections[s2]);

  // Cover (.cover) sits above the first .section and is visible immediately.
  // Trigger its numbers + gauge after a brief tick so the user sees motion
  // right away.
  var cover = document.querySelector('.cover');
  if (cover) {
    setTimeout(function(){
      animateGauges(cover);
      countNumbers(cover);
    }, 250);
  }

  // ─── Print snapshot ───────────────────────────────────────────────────────
  function snapToFinal() {
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      s.style.opacity = '1';
      s.style.transform = 'translateY(0)';
    }
    var allBars = document.querySelectorAll('[data-ayd-target]');
    for (var j = 0; j < allBars.length; j++) {
      allBars[j].style.transition = 'none';
      allBars[j].style.width = allBars[j].getAttribute('data-ayd-target') || '';
    }
    var allArcs = document.querySelectorAll('.gauge-svg path[data-ayd-arc-final]');
    for (var a = 0; a < allArcs.length; a++) {
      allArcs[a].style.transition = 'none';
      allArcs[a].setAttribute('stroke-dashoffset', allArcs[a].getAttribute('data-ayd-arc-final') || '0');
    }
    var allNums = document.querySelectorAll('[data-ayd-num-target]');
    for (var k = 0; k < allNums.length; k++) {
      allNums[k].textContent = allNums[k].getAttribute('data-ayd-num-original') || allNums[k].textContent;
    }
    var allSeats = document.querySelectorAll('[data-ayd-seat]');
    for (var p = 0; p < allSeats.length; p++) {
      allSeats[p].style.opacity = '1';
      allSeats[p].style.transform = 'none';
      allSeats[p].style.boxShadow = 'none';
    }
  }
  window.addEventListener('beforeprint', snapToFinal);
})();
</script>
`.trim();

/**
 * Insert the animation block right before </body>, or append at the end if
 * the doc has no </body> tag (rare but defensive).
 */
export function injectPkpbAnimations(html: string): string {
  // Idempotent — never inject twice.
  if (html.indexOf('data-ayd-pkpb-animations') !== -1) return html;

  const closingBody = /<\/body\s*>/i;
  if (closingBody.test(html)) {
    return html.replace(closingBody, ANIMATION_BLOCK + '\n</body>');
  }
  return html + '\n' + ANIMATION_BLOCK;
}
