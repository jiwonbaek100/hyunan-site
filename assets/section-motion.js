(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!window.IntersectionObserver || !Element.prototype.animate) return;

  const groups = [
    ['.estate-copy h2, .consult-title, .hy-partners > h2, .hc-intro h2, .hr-band h2, .home-fees > h2, .closing-consult h2, main > h1, main .hero h1, #article-title', 16],
    ['.hy-profile, .hc-card, main .cards > .card, main .profile .portrait', 24]
  ];
  const distances = new Map();
  for (const [selector, distance] of groups) {
    document.querySelectorAll(selector).forEach(el => distances.set(el, distance));
  }

  const running = new Set();
  const observer = new IntersectionObserver(entries => {
    let cardIndex = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      observer.unobserve(el);
      const distance = distances.get(el);
      distances.delete(el);
      if (motion.matches || el.matches(':focus-within')) continue;
      const delay = distance === 24 ? Math.min(cardIndex++, 3) * 65 : 0;
      const animation = el.animate(
        [{opacity: 0.18, translate: '0 ' + distance + 'px'}, {opacity: 1, translate: '0 0'}],
        {duration: 620, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards'}
      );
      running.add(animation);
      animation.finished.then(() => running.delete(animation), () => running.delete(animation));
    }
  }, {threshold: 0.08});

  function refresh() {
    observer.disconnect();
    if (motion.matches) running.forEach(animation => animation.cancel());
    else distances.forEach((_, el) => observer.observe(el));
  }
  motion.addEventListener('change', refresh);
  refresh();
})();
