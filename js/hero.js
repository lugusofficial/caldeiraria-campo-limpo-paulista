// Video do heroi: toca mudo e em loop, sem botao (mesmo padrao dos outros demos).
// A economia de bateria do iPhone recusa o play() mesmo mudo; nesse caso o
// video da lugar a mesma cena em webp animado, que o Safari anima sempre.
// O webp so e baixado nesse caso, para quem toca o video nao baixar os dois.
(function () {
  'use strict';
  var video = document.querySelector('.hero__video');
  if (!video) { return; }
  var trocado = false;

  function trocar() {
    var src = video.getAttribute('data-fallback');
    if (trocado || !src) { return; }
    trocado = true;
    var img = document.createElement('img');
    img.className = video.className;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.src = src;
    video.pause();
    video.replaceWith(img);
  }

  function tocar() {
    if (trocado) { return; }
    var p = video.play();
    if (p) { p.catch(function (e) { if (e && e.name === 'NotAllowedError') { trocar(); } }); }
  }

  tocar();
  // Fora da tela o video pausa, para nao gastar bateria nem banda.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (trocado) { return; }
        if (!en.isIntersecting) { if (!video.paused) { video.pause(); } }
        else if (video.paused) { tocar(); }
      });
    }, { threshold: 0.2 }).observe(video.parentNode);
  }
})();
