/* =========================================================================
   Mercado Media Luna — medición (Píxel de Meta) con consentimiento
   Nada de Meta se descarga ni se envía hasta que el visitante acepta
   (Ley 29733 y D.S. 016-2024-JUS). A Meta nunca se le envía el nombre,
   el teléfono ni las respuestas del embudo: solo el tipo de evento.
   ========================================================================= */
(function () {
  'use strict';

  var CFG = window.MML || {};
  var PIXEL = CFG.metaPixelId;
  var CLAVE = 'mml-cookies-v1';          // cambiar el sufijo obliga a volver a preguntar
  var cargado = false;

  function leer() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function guardar(v) { try { localStorage.setItem(CLAVE, v); } catch (e) { /* modo privado: se pregunta en cada visita */ } }

  /* ---- el código oficial del píxel, inyectado solo con permiso ---- */
  function cargarPixel() {
    if (cargado || !PIXEL) return;
    cargado = true;
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', PIXEL);
    window.fbq('track', 'PageView');
  }

  /* ---- API para el resto del sitio: no hace nada sin permiso ---- */
  function listo() { return cargado && typeof window.fbq === 'function'; }
  window.MMLmedir = {
    /* terminó el embudo y tocó enviar: la señal más calificada */
    lead: function (fuente) { if (listo()) window.fbq('track', 'Lead', { content_name: fuente || 'embudo' }); },
    /* tocó un botón de WhatsApp fuera del embudo */
    contacto: function (fuente) { if (listo()) window.fbq('track', 'Contact', { content_name: fuente || 'whatsapp' }); },
    /* evento propio, sin datos personales */
    evento: function (nombre, datos) { if (listo()) window.fbq('trackCustom', nombre, datos || {}); }
  };

  /* ---------------------------------------------------------------------
     El aviso: dos botones con el mismo peso, nada marcado de antemano
     --------------------------------------------------------------------- */
  var aviso = null;

  function crearAviso() {
    aviso = document.createElement('div');
    aviso.className = 'aviso-cookies';
    aviso.setAttribute('role', 'region');
    aviso.setAttribute('aria-label', 'Permiso para medir anuncios');
    aviso.innerHTML =
      '<p class="aviso-texto">Con tu permiso usamos las cookies de Meta para saber si nuestros anuncios te trajeron hasta aquí. ' +
      'No les enviamos tu nombre, tu número ni tus respuestas. <a href="privacidad.html#cookies">Más información</a>.</p>' +
      '<div class="aviso-botones">' +
      '<button type="button" class="aviso-btn" data-cookies="si">Aceptar</button>' +
      '<button type="button" class="aviso-btn" data-cookies="no">No, gracias</button>' +
      '</div>';
    aviso.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cookies]');
      if (!b) return;
      decidir(b.getAttribute('data-cookies'));
    });
    document.body.appendChild(aviso);
  }

  function mostrarAviso() {
    if (!PIXEL) return;
    if (!aviso) crearAviso();
    aviso.hidden = false;
    document.body.classList.add('con-aviso');
    medirAviso();
  }

  /* el botón flotante de WhatsApp sube exactamente lo que mide el aviso */
  function medirAviso() {
    if (aviso && !aviso.hidden) document.documentElement.style.setProperty('--aviso-alto', aviso.offsetHeight + 'px');
  }
  window.addEventListener('resize', medirAviso);

  function ocultarAviso() {
    if (aviso) aviso.hidden = true;
    document.body.classList.remove('con-aviso');
  }

  function decidir(v) {
    var antes = leer();
    guardar(v);
    ocultarAviso();
    if (v === 'si') cargarPixel();
    /* si retira el permiso, se recarga para que el píxel deje de correr en esta visita */
    else if (antes === 'si' && cargado) location.reload();
  }

  /* enlace del pie para cambiar la decisión cuando quiera */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-preferencias-cookies]');
    if (!b) return;
    e.preventDefault();
    mostrarAviso();
    var primero = aviso && aviso.querySelector('.aviso-btn');
    if (primero) primero.focus();
  });

  /* ---- arranque ---- */
  if (!PIXEL) return;
  var decision = leer();
  if (decision === 'si') cargarPixel();
  else if (decision !== 'no') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mostrarAviso);
    else mostrarAviso();
  }
})();
