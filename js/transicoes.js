// Transicoes do site: cada bloco marcado com .reveal entra com fade ao rolar (irmaos em
// sequencia, um depois do outro), e a pagina some com fade antes de abrir outra pagina do site.
// Sem script ou com movimento reduzido tudo aparece parado, sem esconder nada.
(function () {
  'use strict';
  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduzido) { return; }

  // Reveal ao rolar. O que ja esta na tela entra junto com a pagina.
  if ('IntersectionObserver' in window) {
    var alvos = [].slice.call(document.querySelectorAll('.reveal'));
    alvos.forEach(function (el) {
      var irmaos = el.parentElement ? [].slice.call(el.parentElement.children).filter(function (x) { return x.classList.contains('reveal'); }) : [];
      var i = irmaos.indexOf(el);
      if (i > 0) { el.style.transitionDelay = Math.min(i, 5) * 110 + 'ms'; }
      el.setAttribute('data-reveal', '');
    });
    document.documentElement.classList.add('js-reveal');
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        var el = en.target;
        el.classList.add('is-visible');
        obs.unobserve(el);
        // Depois da entrada o atraso sai, para o hover responder na hora.
        setTimeout(function () { el.style.transitionDelay = ''; }, 1600);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    alvos.forEach(function (el) { obs.observe(el); });
  }

  // Fade de saida ao trocar de pagina dentro do site.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
    var a = e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download')) { return; }
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) { return; }
    if (url.pathname === location.pathname) { return; }
    e.preventDefault();
    document.body.classList.add('is-saindo');
    setTimeout(function () { location.href = url.href; }, 240);
  });
  // Voltar pelo navegador traz a pagina do cache ainda apagada: acende de novo.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { document.body.classList.remove('is-saindo'); }
  });
})();
