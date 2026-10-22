(function () {
  window.dataLayer = window.dataLayer || [];
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-cta]');
    if (!el) return;
    window.dataLayer.push({
      event: el.getAttribute('data-cta'),
      cta_location: el.getAttribute('data-cta-location') || 'unknown',
      language: (document.documentElement.lang || 'en').slice(0, 2)
    });
  });
})();