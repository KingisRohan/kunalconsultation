document.addEventListener('DOMContentLoaded', () => {
  // Scroll reveal: [data-reveal] elements animate in once as they scroll into view.
  // A page opts in by adding .reveal-ready to <html> in <head>; if anything here
  // can't run, that class is removed so content is never left invisible.
  try {
    const targets = document.querySelectorAll('[data-reveal]');
    if (targets.length) {
      if (!('IntersectionObserver' in window)) {
        document.documentElement.classList.remove('reveal-ready');
      } else {
        const show = (el) => {
          const img = el.querySelector('img');
          if (!img || img.complete) { el.classList.add('is-revealed'); return; }
          let done = false;
          const go = () => { if (!done) { done = true; el.classList.add('is-revealed'); } };
          img.addEventListener('load', go, { once: true });
          img.addEventListener('error', go, { once: true });
          setTimeout(go, 2000);
        };
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            io.unobserve(entry.target);
            show(entry.target);
          });
        }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
        targets.forEach((el) => io.observe(el));
      }
    }
  } catch (err) {
    document.documentElement.classList.remove('reveal-ready');
  }

  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  const body = document.body;

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      nav.classList.toggle('is-open');
      body.classList.toggle('nav-open');
      const expanded = navToggle.getAttribute('aria-expanded') === 'true' || false;
      navToggle.setAttribute('aria-expanded', !expanded);
    });
  }

  // Close mobile nav when a link is clicked
  document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', () => {
      if (nav && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        body.classList.remove('nav-open');
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // FAQ accordion
  const faqQuestions = document.querySelectorAll('.faq__question');
  faqQuestions.forEach(button => {
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true' || false;
      button.setAttribute('aria-expanded', !expanded);
      const answer = button.closest('.faq__item').querySelector('.faq__answer');
      if (answer) {
        if (expanded) {
          answer.setAttribute('hidden', '');
        } else {
          answer.removeAttribute('hidden');
        }
      }
    });
  });
});
