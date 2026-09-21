/* =========================================================================
   Mercado Media Luna — comportamiento del sitio
   Sin dependencias. La página tiene que quedar completa aunque el video
   nunca cargue y aunque el navegador tenga el movimiento reducido activado.
   ========================================================================= */
(function () {
  'use strict';

  var CFG = window.MML || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  var smoothstep = function (p, e0, e1) { var t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------------------------------------------------------------------
     1 · Texto: partido una sola vez, con azar sembrado (idéntico en cada carga)
     --------------------------------------------------------------------- */
  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function partir(p, entrada, semilla) {
    var texto = p.getAttribute('data-text') || p.textContent;
    var r = rng(semilla);
    p.textContent = '';

    var lector = document.createElement('span');
    lector.className = 'sr';
    lector.textContent = texto;
    p.appendChild(lector);

    function construir() {
      var cont = document.createElement('span');
      cont.setAttribute('aria-hidden', 'true');
      var palabras = texto.split(' ');
      var totalChars = texto.replace(/\s/g, '').length, idx = 0;

      palabras.forEach(function (palabra, wi) {
        var w = document.createElement('span');
        w.className = 'w';
        w.style.setProperty('--th', (wi / Math.max(1, palabras.length) * 0.5 + r() * 0.06).toFixed(3));
        (palabra + (wi < palabras.length - 1 ? ' ' : '')).split('').forEach(function (ch) {
          var c = document.createElement('span');
          c.className = 'c';
          c.textContent = ch;
          if (entrada === 'ensamble') {
            c.style.setProperty('--th', (idx / Math.max(1, totalChars) * 0.35 + r() * 0.2).toFixed(3));
            c.style.setProperty('--jx', Math.round((r() - 0.5) * 90) + 'px');
            c.style.setProperty('--jy', Math.round((r() - 0.5) * 70) + 'px');
            c.style.setProperty('--jr', Math.round((r() - 0.5) * 40) + 'deg');
          }
          idx++;
          w.appendChild(c);
        });
        cont.appendChild(w);
      });
      return cont;
    }

    if (entrada === 'nitido') {
      var suave = construir(); suave.className = 'blur-copy';
      var nitido = construir(); nitido.className = 'sharp-copy';
      p.appendChild(suave); p.appendChild(nitido);
    } else {
      p.appendChild(construir());
    }
  }

  /* ---------------------------------------------------------------------
     2 · El hero con scroll
     --------------------------------------------------------------------- */
  var hero = $('.hero');
  var track = $('.hero-track');
  var stage = $('.stage');
  var video = $('#hero-video');
  var poster = $('.poster');
  var loader = $('#loader');
  var bandsEls = $$('.band');

  var bandas = bandsEls.map(function (el, i) {
    var r = (el.getAttribute('data-band') || '0,1').split(',').map(Number);
    var rampAttr = parseFloat(el.getAttribute('data-ramp'));
    partir($('.line', el), el.getAttribute('data-entrance'), 1000 + i * 77);
    var sub = $('.line-sub', el);
    if (sub) partir(sub, el.getAttribute('data-entrance'), 2000 + i * 31);
    return { el: el, a: r[0], b: r[1], ramp: isNaN(rampAttr) ? 0 : rampAttr, op: -1, k: -1 };
  });

  var target = 0, shown = 0, rafId = null, lastTick = 0;
  var heroVisible = true, scrubOn = false, cargaIniciada = false;
  var loadK = 0, loadStart = 0;

  function heroProgress() {
    if (!track) return 0;
    var rect = track.getBoundingClientRect();
    var total = track.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp(-rect.top / total, 0, 1);
  }

  /* seeks con compuerta: nunca dos a la vez, siempre el más nuevo */
  var seekBusy = false, pendingTime = null;
  function requestSeek(t) {
    if (!video.duration || isNaN(t)) return;
    if (seekBusy) { pendingTime = t; return; }
    seekBusy = true;
    try { video.currentTime = t; } catch (e) { seekBusy = false; }
  }
  video.addEventListener('seeked', function () {
    seekBusy = false;
    if (pendingTime !== null) { var t = pendingTime; pendingTime = null; requestSeek(t); }
  });
  video.addEventListener('error', function () { seekBusy = false; pendingTime = null; fallaVideo(); });

  /* escrituras al DOM solo cuando algo cambia de verdad */
  function pintarBandas(p) {
    for (var i = 0; i < bandas.length; i++) {
      var b = bandas[i];
      var f = Math.min(0.02, (b.b - b.a) / 3);
      var entra = i === 0 ? 1 : smoothstep(p, b.a, b.a + f);
      var sale = i === bandas.length - 1 ? 0 : (1 - smoothstep(p, b.b - f, b.b));
      var op = entra * (i === bandas.length - 1 ? 1 : sale);
      var ramp = b.ramp || Math.min(0.025, (b.b - b.a) * 0.35);
      var k = clamp((p - b.a) / ramp, 0, 1);
      if (i === 0) k = Math.max(k, loadK);

      if (Math.abs(op - b.op) > 0.004) { b.el.style.opacity = op.toFixed(3); b.op = op; }
      if (Math.abs(k - b.k) > 0.008) { b.el.style.setProperty('--k', k.toFixed(3)); b.k = k; }
    }
    var luna = document.documentElement;
    var lunaV = Math.round(p * 100) / 100;
    if (luna.style.getPropertyValue('--luna') !== String(lunaV)) luna.style.setProperty('--luna', lunaV);
  }

  function tick(now) {
    var dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    var k = 0.16;
    shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));

    if (loadStart && loadK < 1) loadK = clamp((now - loadStart) / 1100, 0, 1);

    var quieto = Math.abs(target - shown) < 0.0005 && loadK >= 1;
    if (quieto) { shown = target; rafId = null; lastTick = 0; }
    else { rafId = requestAnimationFrame(tick); }

    if (video.duration) requestSeek(shown * video.duration);
    pintarBandas(shown);
  }

  function onScroll() {
    target = heroProgress();
    if (rafId === null && heroVisible && scrubOn) { lastTick = 0; rafId = requestAnimationFrame(tick); }
  }

  /* ---- carga del video: primero el póster, luego el blob con anillo ---- */
  function conexionLenta() {
    var c = navigator.connection;
    if (!c) return false;
    if (c.saveData) return true;
    return ['slow-2g', '2g', '3g'].indexOf(c.effectiveType) !== -1;
  }

  function fallaVideo() {
    if (loader) loader.classList.add('done');
    stage.classList.add('video-failed');
  }

  function iniciarHeroUnaVez() {
    if (cargaIniciada) return;
    cargaIniciada = true;
    poster.style.backgroundImage = "url('assets/hero-poster.jpg')";
    var arrancado = false;
    function arrancar() {
      if (arrancado) return;
      arrancado = true;
      cargarBlob().catch(fallaVideo);
    }
    var img = new Image();
    img.onload = arrancar; img.onerror = arrancar;
    img.src = 'assets/hero-poster.jpg';
    setTimeout(arrancar, 4000);
    loadStart = performance.now();
  }

  function cargarBlob() {
    var ligero = conexionLenta();
    var url = ligero ? (CFG.videoLigero || CFG.video) : CFG.video;
    var bytes = ligero ? (CFG.videoLigeroBytes || CFG.videoBytes) : CFG.videoBytes;
    var ring = $('.ring circle', loader);
    var ctrl = new AbortController();
    var watchdog = setTimeout(function () { ctrl.abort(); }, 20000);

    return fetch(url, { signal: ctrl.signal }).then(function (res) {
      if (!res.ok || !res.body) throw new Error('video ' + res.status);
      var total = Number(res.headers.get('Content-Length')) || bytes || 0;
      var reader = res.body.getReader();
      var chunks = [], got = 0, lastRing = 0;
      return (function leer() {
        return reader.read().then(function (r) {
          if (r.done) return chunks;
          clearTimeout(watchdog);
          watchdog = setTimeout(function () { ctrl.abort(); }, 20000);
          chunks.push(r.value); got += r.value.length;
          var frac = total ? Math.min(1, got / total) : 0;
          var now = performance.now();
          if (ring && (now - lastRing > 100 || frac === 1)) {
            lastRing = now;
            ring.style.setProperty('--ld', Math.round(126 * (1 - frac)));
          }
          return leer();
        });
      })();
    }).then(function (chunks) {
      clearTimeout(watchdog);
      if (ring) ring.style.setProperty('--ld', 0);
      video.src = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
      video.load();
      video.addEventListener('canplay', function () {
        if (loader) loader.classList.add('done');
        stage.classList.add('video-ready');
        requestSeek(heroProgress() * video.duration);
        onScroll();
      }, { once: true });
    });
  }

  /* ---- las cinco compuertas del hero estático, idénticas al CSS ---- */
  var GATES = [
    '(max-width: 720px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];
  var MQLS = GATES.map(function (q) { return matchMedia(q); });

  function activarScrub() {
    if (scrubOn) return;
    scrubOn = true;
    iniciarHeroUnaVez();
    window.addEventListener('scroll', onScroll, { passive: true });
    bandas.forEach(function (b) { b.op = -1; b.k = -1; });
    soltarEstadosFinales();
    pintarBandas(heroProgress());
    onScroll();
  }
  function desactivarScrub() {
    if (!scrubOn) return;
    scrubOn = false;
    window.removeEventListener('scroll', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }
  function aplicarModoHero() {
    if (MQLS.some(function (m) { return m.matches; })) desactivarScrub();
    else activarScrub();
  }
  MQLS.forEach(function (m) {
    if (m.addEventListener) m.addEventListener('change', aplicarModoHero);
    else if (m.addListener) m.addListener(aplicarModoHero);
  });

  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      heroVisible = es[0].isIntersecting;
      if (heroVisible && scrubOn) onScroll();
      else if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    }, { rootMargin: '10px' }).observe(hero);
  }

  aplicarModoHero();

  /* ---------------------------------------------------------------------
     3 · Entradas de sección y estados finales
     --------------------------------------------------------------------- */
  var reveals = $$('.reveal, .promesa');
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        setTimeout(function () { e.target.classList.add('settled'); }, 1200);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in', 'settled'); });
  }

  function fijarEstadosFinales() {
    reveals.forEach(function (el) { el.classList.add('in', 'settled'); });
    document.documentElement.style.setProperty('--luna', 1);
    bandas.forEach(function (b) { b.el.style.opacity = ''; b.el.style.setProperty('--k', 1); b.op = -1; b.k = -1; });
  }
  function soltarEstadosFinales() {
    document.documentElement.style.removeProperty('--luna');
  }

  var mqMovimiento = matchMedia('(prefers-reduced-motion: reduce)');
  function onMovimiento(e) { if (e.matches) fijarEstadosFinales(); else aplicarModoHero(); }
  if (mqMovimiento.addEventListener) mqMovimiento.addEventListener('change', onMovimiento);
  else if (mqMovimiento.addListener) mqMovimiento.addListener(onMovimiento);
  if (mqMovimiento.matches) fijarEstadosFinales();

  document.addEventListener('visibilitychange', function () {
    document.body.classList.toggle('pausado', document.hidden);
  });

  /* ---------------------------------------------------------------------
     4 · La calculadora del alquiler (el momento que el visitante realiza)
     --------------------------------------------------------------------- */
  var monto = $('#calc-monto'), anios = $('#calc-anios'), aniosOut = $('#calc-anios-out');
  var resultado = $('#calc-result'), kicker = $('#calc-kicker');
  var fmt = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });

  function calcular() {
    if (!monto || !anios) return;
    var m = parseFloat(monto.value) || 0;
    var a = parseInt(anios.value, 10) || 0;
    if (aniosOut) aniosOut.textContent = a + (a === 1 ? ' año' : ' años');
    if (m <= 0) {
      resultado.textContent = 'Pon tu alquiler y te digo cuánto llevas pagado.';
      if (kicker) kicker.hidden = true;
      return;
    }
    var total = m * 12 * a;
    resultado.innerHTML = 'En ' + a + (a === 1 ? ' año' : ' años') + ' ya pagaste <span class="cifra">S/ ' + fmt.format(total) + '</span>.';
    if (kicker) kicker.hidden = false;
  }
  if (monto) { monto.addEventListener('input', calcular); }
  if (anios) { anios.addEventListener('input', calcular); }
  var calcForm = $('#calc');
  if (calcForm) calcForm.addEventListener('submit', function (e) { e.preventDefault(); });
  calcular();

  /* ---------------------------------------------------------------------
     5 · WhatsApp (CTA secundario)
     --------------------------------------------------------------------- */
  function seccionDe(el) {
    var s = el.closest('section');
    return (s && s.id) || 'pie';
  }
  $$('[data-wa]').forEach(function (a) {
    if (!CFG.whatsapp) {
      a.setAttribute('href', '#hablemos');
      a.setAttribute('title', 'Número de WhatsApp pendiente: ver assets/config.js');
      return;
    }
    var texto = (CFG.whatsappTexto || '') + ' (' + seccionDe(a) + ')';
    a.setAttribute('href', 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(texto));
    a.setAttribute('rel', 'noopener');
    a.setAttribute('target', '_blank');
  });
  if (!CFG.whatsapp) console.warn('[MML] Falta el número de WhatsApp en assets/config.js. Los botones de WhatsApp llevan al formulario.');

  /* ---------------------------------------------------------------------
     6 · Testimonios: fachada, sin cargar YouTube hasta el clic
     --------------------------------------------------------------------- */
  var rail = $('#testi-rail');
  if (rail && CFG.testimonios && CFG.testimonios.length) {
    $('.testi-vacio') && $('.testi-vacio').remove();
    var aviso = $('.testi-aviso');
    if (aviso && CFG.testimonios.some(function (t) { return /PENDIENTE/.test(t.autorizacion || ''); })) aviso.hidden = false;
    CFG.testimonios.forEach(function (t) {
      var card = document.createElement('article');
      card.className = 'testi-card';
      card.setAttribute('role', 'listitem');
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Reproducir el testimonio de ' + (t.nombre || 'un comprador'));
      b.style.backgroundImage = "url('https://i.ytimg.com/vi/" + t.id + "/hqdefault.jpg')";
      b.addEventListener('click', function () {
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + t.id + '?autoplay=1&rel=0';
        f.title = 'Testimonio de ' + (t.nombre || 'un comprador');
        f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
        f.setAttribute('allowfullscreen', '');
        b.replaceWith(f);
      });
      var meta = document.createElement('p');
      meta.className = 'testi-meta';
      meta.textContent = [t.nombre, t.rubro, t.fecha].filter(Boolean).join(' · ');
      card.appendChild(b); card.appendChild(meta);
      rail.appendChild(card);
    });
  }

  /* ---------------------------------------------------------------------
     7 · El formulario: escribe directo en el CRM (fn_captar_prospecto)
     Contrato: 07-crm/02-codigo/crm-mml/sql/12-captacion.sql
     --------------------------------------------------------------------- */
  var form = $('#lead-form'), msg = $('#form-msg'), submit = $('#f-submit');
  var destino = CFG.destinoFormulario === 'crm' ? 'crm' : 'whatsapp';
  var campoConsentimiento = $('#f-ok') ? $('#f-ok').closest('.field-check') : null;
  var configurado = destino === 'crm'
    ? !!(CFG.supabaseUrl && CFG.supabaseAnonKey)
    : !!CFG.whatsapp;

  if (form && destino === 'whatsapp') {
    // El visitante manda su propio mensaje: no guardamos nada, así que no
    // pedimos consentimiento de tratamiento de datos.
    if (campoConsentimiento) campoConsentimiento.hidden = true;
    if ($('#f-ok')) $('#f-ok').required = false;
    submit.textContent = 'Enviar por WhatsApp';
    var nota = document.createElement('p');
    nota.className = 'hint hint-wa';
    nota.textContent = 'Al enviar se abre tu WhatsApp con el mensaje ya escrito. Tú decides si lo mandas.';
    submit.parentNode.insertBefore(nota, submit);
  }

  if (form && !configurado) {
    form.classList.add('desactivado');
    submit.disabled = true;
    msg.textContent = destino === 'whatsapp'
      ? 'Estamos activando el número de WhatsApp. Vuelve en un rato.'
      : 'Formulario en preparación. Por ahora escríbenos por WhatsApp.';
    msg.className = 'form-msg';
    console.warn(destino === 'whatsapp'
      ? '[MML] Falta el número en assets/config.js (whatsapp): el formulario no puede enviar.'
      : '[MML] Faltan supabaseUrl y supabaseAnonKey en assets/config.js: el formulario no puede escribir en el CRM.');
  }

  function normalizarTelefono(v) {
    var s = String(v || '').replace(/[\s().-]/g, '');
    if (/^\+\d{8,15}$/.test(s)) return s;
    if (/^00\d{6,15}$/.test(s)) return '+' + s.slice(2);
    if (/^9\d{8}$/.test(s)) return '+51' + s;
    if (/^0\d{8}$/.test(s)) return '+51' + s.slice(1);
    if (/^51\d{9}$/.test(s)) return '+' + s;
    return null;
  }

  /* p_origen solo admite: meta_ads | organico | referido | base_historica | live.
     'landing' NO es válido y haría que el CRM rechace el 100% de los leads. */
  function origenDesdeUTM(params) {
    var src = (params.get('utm_source') || '').toLowerCase();
    if (/meta|fb|facebook|ig|instagram/.test(src)) return 'meta_ads';
    if (/referido|ref/.test(src)) return 'referido';
    return 'organico';
  }

  if (form && configurado) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.className = 'form-msg';

      var trampa = $('#f-web').value;
      var nombre = $('#f-nombre').value.trim();
      var telRaw = $('#f-tel').value;
      var ok = destino === 'whatsapp' ? true : $('#f-ok').checked;

      if (trampa) { msg.textContent = 'Listo. Te escribimos hoy mismo.'; msg.className = 'form-msg ok'; return; }
      if (!nombre) { msg.textContent = 'Escribe tu nombre, por favor.'; msg.className = 'form-msg err'; $('#f-nombre').focus(); return; }
      var tel = normalizarTelefono(telRaw);
      if (!tel) { msg.textContent = 'Revisa el número. Un celular de Perú son 9 dígitos y empieza en 9.'; msg.className = 'form-msg err'; $('#f-tel').focus(); return; }
      if (!ok) { msg.textContent = 'Necesitamos tu permiso para escribirte.'; msg.className = 'form-msg err'; $('#f-ok').focus(); return; }

      /* Camino de hoy: el propio visitante manda su mensaje por WhatsApp.
         No se guarda ningún dato personal de este lado. */
      if (destino === 'whatsapp') {
        var texto = 'Hola, soy ' + nombre + '. Mi número es ' + tel + '. Quiero información de Mercado Media Luna.';
        window.open('https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
        msg.textContent = 'Listo. Te abrimos WhatsApp con tu mensaje. Dale enviar y te respondemos.';
        msg.className = 'form-msg ok';
        form.reset();
        return;
      }

      var params = new URLSearchParams(location.search);
      var carga = {
        utm_source: params.get('utm_source') || null,
        utm_medium: params.get('utm_medium') || null,
        utm_campaign: params.get('utm_campaign') || null,
        utm_content: params.get('utm_content') || null,
        seccion: 'hablemos',
        pagina: location.pathname,
        user_agent: navigator.userAgent
      };

      submit.disabled = true;
      var textoBoton = submit.textContent;
      submit.textContent = 'Enviando…';

      fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/fn_captar_prospecto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CFG.supabaseAnonKey,
          'Authorization': 'Bearer ' + CFG.supabaseAnonKey
        },
        body: JSON.stringify({
          p_nombre_completo: nombre,
          p_telefono_e164: tel,
          p_origen: origenDesdeUTM(params),
          p_consentimiento: true,
          p_carga: carga,
          p_fuente_sistema: 'landing'
        })
      }).then(function (r) { return r.json().catch(function () { return null; }); })
        .then(function (data) {
          if (data && data.ok) {
            location.href = 'gracias.html';
            return;
          }
          console.warn('[MML] El CRM rechazó el lead. Motivo:', data && data.motivo);
          msg.textContent = 'No pudimos enviarlo. Escríbenos por WhatsApp y te atendemos igual.';
          msg.className = 'form-msg err';
        })
        .catch(function (err) {
          console.warn('[MML] Error de red al enviar el lead:', err);
          msg.textContent = 'No pudimos enviarlo. Escríbenos por WhatsApp y te atendemos igual.';
          msg.className = 'form-msg err';
        })
        .then(function () { submit.disabled = false; submit.textContent = textoBoton; });
    });
  }
})();
