// Ciclone em 3D: corpo, cone, entrada tangencial, tubo de saida e pernas, com particulas
// mostrando o caminho do po (desce girando junto da parede) e do ar limpo (sobe pelo centro).
// O three.js (r128, MIT, js/three.min.js) so e baixado quando a secao chega perto da tela.
// Sem script ou sem WebGL fica o desenho em SVG; com movimento reduzido nada gira sozinho
// e as particulas ficam paradas, mas arrastar continua girando.
(function () {
  'use strict';
  var palco = document.querySelector('[data-ciclone]');
  if (!palco || !('IntersectionObserver' in window)) { return; }
  var tela = palco.querySelector('.ciclone__tela');
  var poster = palco.querySelector('.ciclone__poster');
  var controles = document.querySelector('.ciclone__controles');
  var botaoCorte = document.querySelector('[data-ciclone-corte]');
  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function carregar(pronto) {
    if (window.THREE) { pronto(); return; }
    var s = document.createElement('script');
    s.src = 'js/three.min.js';
    s.onload = pronto;
    document.head.appendChild(s);
  }

  var vigia = new IntersectionObserver(function (es) {
    if (es.some(function (e) { return e.isIntersecting; })) {
      vigia.disconnect();
      carregar(iniciar);
    }
  }, { rootMargin: '300px' });
  vigia.observe(palco);

  // Raio interno da parede na altura y: corpo cilindrico em cima, cone embaixo.
  var TOPO = 2.4, JUNTA = 0.8, FUNDO = -1.6, R = 1, RB = 0.2;
  function raioParede(y) {
    if (y >= JUNTA) { return R; }
    if (y <= FUNDO) { return RB; }
    return RB + (R - RB) * (y - FUNDO) / (JUNTA - FUNDO);
  }

  function iniciar() {
    var T = window.THREE;
    var renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas: tela, antialias: true, alpha: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var cena = new T.Scene();
    var camera = new T.PerspectiveCamera(34, 7 / 8, 0.1, 100);
    camera.position.set(0, 3.2, 10.6);
    camera.lookAt(0, 0.45, 0);
    cena.add(new T.HemisphereLight(0xffffff, 0x8a9199, 0.9));
    var sol = new T.DirectionalLight(0xffffff, 0.8);
    sol.position.set(4, 7, 6);
    cena.add(sol);

    var grupo = new T.Group();
    grupo.rotation.y = -0.5;
    cena.add(grupo);

    var aco = new T.MeshStandardMaterial({ color: 0xc9cfd5, metalness: 0.35, roughness: 0.5, side: T.DoubleSide, transparent: true });
    var azul = new T.MeshStandardMaterial({ color: 0x1f5c99, metalness: 0.3, roughness: 0.45 });
    var grafite = new T.MeshStandardMaterial({ color: 0x50565c, metalness: 0.4, roughness: 0.6 });
    function malha(geo, mat, x, y, z) { var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); grupo.add(m); return m; }
    // moldura azul na boca da entrada
    function flangeEntrada() {
      var z = R - 0.225;
      malha(new T.BoxGeometry(0.06, 0.07, 0.57), azul, -1.6, 2.38, z);
      malha(new T.BoxGeometry(0.06, 0.07, 0.57), azul, -1.6, 1.62, z);
      malha(new T.BoxGeometry(0.06, 0.82, 0.07), azul, -1.6, 2.0, z - 0.25);
      malha(new T.BoxGeometry(0.06, 0.82, 0.07), azul, -1.6, 2.0, z + 0.25);
    }
    function flange(r, y) { var f = malha(new T.TorusGeometry(r, 0.035, 8, 48), azul, 0, y, 0); f.rotation.x = Math.PI / 2; }

    // corpo, cone, descarga do po e tubo de saida do ar limpo
    malha(new T.CylinderGeometry(R, R, TOPO - JUNTA, 48, 1, true), aco, 0, (TOPO + JUNTA) / 2);
    malha(new T.CylinderGeometry(R, RB, JUNTA - FUNDO, 48, 1, true), aco, 0, (JUNTA + FUNDO) / 2);
    malha(new T.CylinderGeometry(RB, RB, 0.4, 24, 1, true), aco, 0, FUNDO - 0.2);
    var tampa = malha(new T.RingGeometry(0.42, R, 48), aco, 0, TOPO);
    tampa.rotation.x = -Math.PI / 2;
    malha(new T.CylinderGeometry(0.42, 0.42, 1.9, 32, 1, true), aco, 0, 2.35);
    flange(R, TOPO); flange(R, JUNTA); flange(RB, FUNDO - 0.4); flange(0.42, 3.3);
    // entrada retangular tangente ao corpo, do lado de fora (z = R)
    malha(new T.BoxGeometry(1.6, 0.7, 0.45), aco, -0.8, 2.0, R - 0.225);
    flangeEntrada();
    // pernas, anel de apoio preso ao corpo, travessas embaixo e a sombra no chao
    var PE = 0.82;
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (p) {
      malha(new T.BoxGeometry(0.1, 3.3, 0.1), grafite, p[0] * PE, -0.75, p[1] * PE);
    });
    var anel = malha(new T.TorusGeometry(PE * Math.SQRT2, 0.05, 8, 48), grafite, 0, 0.85, 0);
    anel.rotation.x = Math.PI / 2;
    [[0, PE, 0], [0, -PE, 0], [PE, 0, 1], [-PE, 0, 1]].forEach(function (b) {
      var t = malha(new T.BoxGeometry(2 * PE, 0.07, 0.07), grafite, b[0], -1.75, b[1]);
      if (b[2]) { t.rotation.y = Math.PI / 2; }
    });
    var sombra = malha(new T.CircleGeometry(1.7, 40), new T.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.08, depthWrite: false }), 0, -2.4, 0);
    sombra.rotation.x = -Math.PI / 2;

    // particulas: cada uma tem uma fase t que corre de 0 a 1 ao longo do caminho
    function nuvem(n, cor, tamanho) {
      var geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
      var pts = new T.Points(geo, new T.PointsMaterial({ color: cor, size: tamanho, sizeAttenuation: true, depthWrite: false }));
      grupo.add(pts);
      var dados = [];
      for (var i = 0; i < n; i++) { dados.push({ t: Math.random(), j: Math.random(), k: Math.random() }); }
      return { geo: geo, dados: dados };
    }
    var po = nuvem(560, 0x6e5a46, 0.09);
    var ar = nuvem(360, 0x2f7fd0, 0.085);
    var ENTRADA = Math.PI / 2;

    function posPo(d, out, i) {
      var x, y, z;
      if (d.t < 0.12) {
        // ainda no duto de entrada, andando em +x
        x = -1.55 + (d.t / 0.12) * 1.55;
        y = 2.0 + (d.j - 0.5) * 0.5;
        z = R - 0.225 + (d.k - 0.5) * 0.3;
      } else {
        var s = (d.t - 0.12) / 0.88;
        y = 2.0 - s * 3.9;
        var r = y < FUNDO ? RB * 0.6 * d.k : raioParede(y) - 0.07 - d.j * 0.06;
        var a = ENTRADA - s * 6 * Math.PI * 2 - d.k * 0.3;
        x = r * Math.cos(a); z = r * Math.sin(a);
      }
      out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
    }
    function posAr(d, out, i) {
      var y = -0.9 + d.t * 4.3;
      var r = (y < 1.4 ? 0.26 : 0.3) * (0.4 + 0.6 * d.j) + 0.35 * Math.max(0, 1 - d.t * 5);
      var a = ENTRADA - d.t * 5 * Math.PI * 2 - d.k * Math.PI * 2;
      out[i * 3] = r * Math.cos(a); out[i * 3 + 1] = y; out[i * 3 + 2] = r * Math.sin(a);
    }
    function mover(nv, fn, passo) {
      var arr = nv.geo.attributes.position.array;
      for (var i = 0; i < nv.dados.length; i++) {
        var d = nv.dados[i];
        d.t = (d.t + passo) % 1;
        fn(d, arr, i);
      }
      nv.geo.attributes.position.needsUpdate = true;
    }

    var corte = true;
    function aplicarCorte() {
      aco.opacity = corte ? 0.3 : 1;
      aco.depthWrite = !corte;
      if (botaoCorte) { botaoCorte.setAttribute('aria-pressed', corte ? 'true' : 'false'); }
    }
    aplicarCorte();

    function ajustar() {
      var w = palco.clientWidth, h = palco.clientHeight;
      if (!w || !h) { return; }
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    var arrastando = false, ultimoX = 0, visivel = false, antes = 0;
    function desenhar() { renderer.render(cena, camera); }
    function quadro(agora) {
      if (!visivel) { antes = 0; return; }
      var dt = antes ? Math.min((agora - antes) / 1000, 0.05) : 0;
      antes = agora;
      if (!arrastando) { grupo.rotation.y += dt * 0.25; }
      mover(po, posPo, dt * 0.09);
      mover(ar, posAr, dt * 0.11);
      desenhar();
      requestAnimationFrame(quadro);
    }

    tela.addEventListener('pointerdown', function (e) { arrastando = true; ultimoX = e.clientX; tela.setPointerCapture(e.pointerId); });
    tela.addEventListener('pointermove', function (e) {
      if (!arrastando) { return; }
      grupo.rotation.y += (e.clientX - ultimoX) * 0.01;
      ultimoX = e.clientX;
      if (reduzido) { desenhar(); }
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) { tela.addEventListener(ev, function () { arrastando = false; }); });
    tela.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') { return; }
      e.preventDefault();
      grupo.rotation.y += e.key === 'ArrowLeft' ? -0.2 : 0.2;
      if (reduzido) { desenhar(); }
    });
    if (botaoCorte) {
      botaoCorte.addEventListener('click', function () { corte = !corte; aplicarCorte(); if (reduzido) { desenhar(); } });
    }

    mover(po, posPo, 0);
    mover(ar, posAr, 0);
    tela.hidden = false;
    if (poster) { poster.hidden = true; }
    if (controles) { controles.hidden = false; }
    ajustar();
    desenhar();
    if ('ResizeObserver' in window) { new ResizeObserver(function () { ajustar(); desenhar(); }).observe(palco); }

    if (reduzido) { return; }
    new IntersectionObserver(function (es) {
      var v = es[0].isIntersecting;
      if (v && !visivel) { visivel = true; requestAnimationFrame(quadro); }
      visivel = v;
    }).observe(palco);
  }
})();
