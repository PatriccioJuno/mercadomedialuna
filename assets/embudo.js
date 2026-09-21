/* =========================================================================
   Mercado Media Luna — embudo de calificación (estilo chat)
   Las preguntas salen del guion de calificación del proyecto
   (02-marketing/marca/OPERACION-WHATSAPP-HERRAMIENTAS-Y-LOTE.md: ¿operar o
   invertir?, ¿cómo lo pensaba pagar?, ¿decide solo?) más las que el equipo
   necesita antes de la primera conversación.
   Regla: ninguna respuesta del chat promete precio, financiamiento,
   rentabilidad, fechas ni disponibilidad.
   ========================================================================= */
(function () {
  'use strict';

  var CFG = window.MML || {};
  var raiz = document.getElementById('chat');
  if (!raiz) return;

  var log = raiz.querySelector('.chat-log');
  var zona = raiz.querySelector('.chat-zona');
  var barra = raiz.querySelector('.chat-barra i');
  var pasoTxt = raiz.querySelector('.chat-paso');
  var atras = raiz.querySelector('.chat-atras');
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  var destino = CFG.destinoFormulario === 'crm' ? 'crm' : 'whatsapp';

  /* ---------------------------------------------------------------------
     El guion
     --------------------------------------------------------------------- */
  var LEJOS = { provincia: 1, extranjero: 1 };
  var PREGUNTAS = [
    {
      id: 'uso', texto: '¿Para qué quieres el puesto?',
      opciones: [
        { v: 'operar', t: 'Para trabajarlo yo' },
        { v: 'invertir', t: 'Para alquilarlo' },
        { v: 'viendo', t: 'Todavía lo estoy viendo' }
      ],
      eco: { invertir: 'Te digo algo de frente: no damos números de rentabilidad que no podamos sostener. Todo lo demás te lo mostramos.' }
    },
    {
      id: 'alquiler', texto: '¿Hoy pagas alquiler por tu puesto o local?',
      opciones: [
        { v: 'si', t: 'Sí, pago alquiler' },
        { v: 'propio', t: 'No, ya tengo local propio' },
        { v: 'sin_negocio', t: 'Todavía no tengo negocio' }
      ],
      eco: { si: 'Entonces sabes lo que es pagar cada mes por un sitio que no es tuyo.' }
    },
    {
      id: 'giro', texto: '¿Qué vendes, o qué te gustaría vender?',
      saltar: function (r) { return r.uso === 'invertir'; },
      opciones: [
        { v: 'abarrotes', t: 'Abarrotes' },
        { v: 'frutas', t: 'Frutas y verduras' },
        { v: 'carnes', t: 'Carnes, pollo o pescado' },
        { v: 'comida', t: 'Comida o jugos' },
        { v: 'otro', t: 'Otro rubro' }
      ]
    },
    {
      id: 'zona', texto: '¿Desde dónde nos escribes?',
      opciones: [
        { v: 'cerca', t: 'Cerca de Jicamarca' },
        { v: 'lima', t: 'Otra zona de Lima' },
        { v: 'provincia', t: 'Provincia' },
        { v: 'extranjero', t: 'Fuera del Perú' }
      ],
      eco: {
        provincia: 'Sin problema. La obra se puede recorrer completa por videollamada.',
        extranjero: 'Sin problema. La obra se puede recorrer completa por videollamada.'
      }
    },
    {
      id: 'pago', texto: '¿Cómo pensabas pagarlo?',
      opciones: [
        { v: 'ahorros', t: 'Con mis ahorros' },
        { v: 'partes', t: 'Necesito pagarlo en partes' },
        { v: 'nose', t: 'Todavía no lo sé' }
      ],
      eco: { partes: 'Anotado. Eso se conversa con calma, y todo queda por escrito.' }
    },
    {
      id: 'decide', texto: '¿Quién toma la decisión?',
      opciones: [
        { v: 'solo', t: 'Yo solo' },
        { v: 'familia', t: 'Con mi familia o socio' }
      ],
      eco: { familia: 'Tiene sentido. Pueden venir juntos a ver la obra.' }
    },
    {
      id: 'visita', texto: '¿Cuándo te gustaría ver la obra?',
      opciones: function (r) {
        return LEJOS[r.zona]
          ? [{ v: 'video_semana', t: 'Por videollamada, esta semana' },
             { v: 'video_mes', t: 'Por videollamada, este mes' },
             { v: 'videos', t: 'Primero quiero ver videos' }]
          : [{ v: 'semana', t: 'Esta semana' },
             { v: 'mes', t: 'Este mes' },
             { v: 'videos', t: 'Primero quiero ver videos' }];
      }
    }
  ];

  /* etiquetas cortas para el resumen y el mensaje de WhatsApp */
  var ROTULOS = {
    uso: 'Quiero el puesto', alquiler: 'Hoy', giro: 'Rubro', zona: 'Escribo desde',
    pago: 'Pago', decide: 'Decido', visita: 'Visita'
  };

  /* ---------------------------------------------------------------------
     Estado: lo que respondió, y en qué paso va
     --------------------------------------------------------------------- */
  var respuestas = {};   // id → valor
  var textos = {};       // id → texto elegido
  var contacto = { nombre: '', telefono: '' };
  var turno = 0;         // invalida animaciones en curso cuando se vuelve atrás
  var iniciado = false;

  function preguntasActivas() {
    return PREGUNTAS.filter(function (p) { return !(p.saltar && p.saltar(respuestas)); });
  }
  function opcionesDe(p) { return typeof p.opciones === 'function' ? p.opciones(respuestas) : p.opciones; }

  /* el siguiente paso pendiente: una pregunta, 'nombre', 'telefono' o 'resumen' */
  function pasoActual() {
    var activas = preguntasActivas();
    for (var i = 0; i < activas.length; i++) if (!(activas[i].id in respuestas)) return activas[i];
    if (!contacto.nombre) return 'nombre';
    if (!contacto.telefono) return 'telefono';
    return 'resumen';
  }
  function totalPasos() { return preguntasActivas().length + 2; }
  function pasosHechos() {
    return preguntasActivas().filter(function (p) { return p.id in respuestas; }).length +
      (contacto.nombre ? 1 : 0) + (contacto.telefono ? 1 : 0);
  }

  /* ---------------------------------------------------------------------
     Burbujas
     --------------------------------------------------------------------- */
  function burbuja(clase, texto) {
    var b = document.createElement('div');
    b.className = 'msg ' + clase;
    b.textContent = texto;
    log.appendChild(b);
    return b;
  }
  function bot(texto) { return burbuja('msg-bot', texto); }
  function yo(texto) { return burbuja('msg-yo', texto); }

  function escribiendo() {
    var t = document.createElement('div');
    t.className = 'msg msg-bot msg-escribiendo';
    t.setAttribute('aria-hidden', 'true');
    t.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(t);
    return t;
  }

  var esperar = function (ms) { return new Promise(function (r) { setTimeout(r, reducido.matches ? 0 : ms); }); };

  /* escribe una o varias burbujas del bot con su pausa de "escribiendo" */
  function decir(lineas, miTurno) {
    return lineas.reduce(function (cadena, linea) {
      return cadena.then(function () {
        if (miTurno !== turno) return;
        var t = escribiendo();
        mantenerVisible();
        return esperar(Math.min(1100, 380 + linea.length * 11)).then(function () {
          t.remove();
          if (miTurno === turno) bot(linea);
        });
      });
    }, Promise.resolve());
  }

  function mantenerVisible() {
    var r = zona.getBoundingClientRect();
    if (r.bottom > window.innerHeight - 12 || r.top < 0) {
      zona.scrollIntoView({ block: 'nearest', behavior: reducido.matches ? 'auto' : 'smooth' });
    }
  }

  function actualizarCabecera() {
    var hechos = pasosHechos(), total = totalPasos();
    barra.style.transform = 'scaleX(' + (hechos / total).toFixed(3) + ')';
    var p = pasoActual();
    pasoTxt.textContent = p === 'resumen' ? 'Listo para enviar' : 'Paso ' + Math.min(hechos + 1, total) + ' de ' + total;
    atras.hidden = hechos === 0;
  }

  /* ---------------------------------------------------------------------
     Pintar la conversación completa desde el estado (sin animar),
     y animar solo la pregunta nueva
     --------------------------------------------------------------------- */
  var SALUDO = [
    'Hola. Te hago unas preguntas rápidas para saber si esto te sirve.',
    'Se responden con un toque. No te pedimos nada más que tu nombre y tu número al final.'
  ];

  function pintarHistorial() {
    log.textContent = '';
    SALUDO.forEach(bot);
    preguntasActivas().forEach(function (p) {
      if (!(p.id in respuestas)) return;
      bot(p.texto);
      yo(textos[p.id]);
      var eco = p.eco && p.eco[respuestas[p.id]];
      if (eco) bot(eco);
    });
    if (contacto.nombre) { bot('Último paso. ¿Cómo te llamas?'); yo(contacto.nombre); }
    if (contacto.telefono) { bot('¿A qué número de WhatsApp te escribimos?'); yo(contacto.telefonoVisible || contacto.telefono); }
  }

  function siguiente(animarDesde) {
    var miTurno = ++turno;
    zona.textContent = '';
    actualizarCabecera();
    var p = pasoActual();

    var lineas = (animarDesde || []).slice();
    if (typeof p === 'object') lineas.push(p.texto);
    else if (p === 'nombre') lineas.push('Último paso. ¿Cómo te llamas?');
    else if (p === 'telefono') lineas.push('¿A qué número de WhatsApp te escribimos?');
    else lineas.push(contacto.nombre.split(' ')[0] + ', esto es lo que le llega al equipo:');

    decir(lineas, miTurno).then(function () {
      if (miTurno !== turno) return;
      if (typeof p === 'object') mostrarOpciones(p);
      else if (p === 'nombre' || p === 'telefono') mostrarCampo(p);
      else mostrarResumen();
      mantenerVisible();
    });
  }

  /* ---------------------------------------------------------------------
     Las respuestas del visitante
     --------------------------------------------------------------------- */
  var ultimoPorTeclado = false;
  document.addEventListener('keydown', function () { ultimoPorTeclado = true; }, true);
  document.addEventListener('pointerdown', function () { ultimoPorTeclado = false; }, true);

  function mostrarOpciones(p) {
    var grupo = document.createElement('div');
    grupo.className = 'chips';
    grupo.setAttribute('role', 'group');
    grupo.setAttribute('aria-label', p.texto);
    opcionesDe(p).forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = o.t;
      b.addEventListener('click', function () { responder(p, o); });
      grupo.appendChild(b);
    });
    zona.appendChild(grupo);
    if (ultimoPorTeclado) grupo.querySelector('button').focus({ preventScroll: true });
  }

  function responder(p, o) {
    respuestas[p.id] = o.v;
    textos[p.id] = o.t;
    // si cambió una respuesta que decide otras (zona → visita), la dependiente se vuelve a preguntar
    if (p.id === 'zona' && respuestas.visita) {
      var visita = PREGUNTAS.filter(function (q) { return q.id === 'visita'; })[0];
      var valida = opcionesDe(visita).some(function (x) { return x.v === respuestas.visita; });
      if (!valida) { delete respuestas.visita; delete textos.visita; }
    }
    if (p.id === 'uso' && o.v === 'invertir') { delete respuestas.giro; delete textos.giro; }
    zona.textContent = '';
    yo(o.t);
    var eco = p.eco && p.eco[o.v];
    siguiente(eco ? [eco] : []);
  }

  function mostrarCampo(tipo) {
    var f = document.createElement('form');
    f.className = 'chat-campo';
    f.noValidate = true;
    var id = 'chat-' + tipo;
    var esTel = tipo === 'telefono';
    f.innerHTML =
      '<label class="sr" for="' + id + '">' + (esTel ? 'Tu número de WhatsApp' : 'Tu nombre') + '</label>' +
      '<input id="' + id + '" type="' + (esTel ? 'tel' : 'text') + '" ' +
      (esTel ? 'inputmode="tel" autocomplete="tel" placeholder="999 999 999"' : 'autocomplete="name" placeholder="Nombre y apellido"') +
      ' aria-describedby="' + id + '-error" required>' +
      '<button type="submit" class="chat-enviar" aria-label="Enviar">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6l-.02 6.53L15 12 3.38 13.87z"/></svg></button>' +
      '<p class="chat-error" id="' + id + '-error" role="alert"></p>' +
      (esTel ? '<p class="chat-ayuda">Celular de Perú. Si estás fuera, ponlo con el código de tu país.</p>' : '') +
      '<div class="trampa" aria-hidden="true"><input type="text" name="web" tabindex="-1" autocomplete="off"></div>';
    var input = f.querySelector('input');
    var error = f.querySelector('.chat-error');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.querySelector('[name=web]').value) return;      // bot atrapado: no hace nada
      var v = input.value.trim();
      if (!esTel) {
        if (v.length < 2) { error.textContent = 'Escribe tu nombre, por favor.'; input.focus(); return; }
        contacto.nombre = v.replace(/\s+/g, ' ');
        zona.textContent = '';
        yo(contacto.nombre);
        siguiente();
      } else {
        var tel = normalizarTelefono(v);
        if (!tel) { error.textContent = 'Revisa el número. Un celular de Perú son 9 dígitos y empieza en 9.'; input.focus(); return; }
        contacto.telefono = tel;
        contacto.telefonoVisible = v;
        zona.textContent = '';
        yo(v);
        siguiente();
      }
    });
    zona.appendChild(f);
    input.focus({ preventScroll: true });
  }

  /* ---------------------------------------------------------------------
     Resumen y envío
     --------------------------------------------------------------------- */
  function lineasResumen() {
    return preguntasActivas().map(function (p) { var t = textos[p.id]; return ROTULOS[p.id] + ': ' + t.charAt(0).toLowerCase() + t.slice(1); });
  }

  function mensajeWhatsApp() {
    return 'Hola, soy ' + contacto.nombre + '. Vengo de la web de Mercado Media Luna.\n' +
      lineasResumen().map(function (l) { return '• ' + l; }).join('\n') +
      '\nMi número: ' + contacto.telefono;
  }

  /* prioridad interna para el CRM: nunca se le muestra al visitante */
  function prioridad() {
    var s = 0;
    if (respuestas.uso === 'operar') s += 2;
    if (respuestas.alquiler === 'si') s += 2;
    if (respuestas.pago === 'ahorros') s += 1;
    if (respuestas.decide === 'solo') s += 1;
    if (respuestas.visita === 'semana' || respuestas.visita === 'video_semana') s += 2;
    return s >= 6 ? 'alta' : s >= 3 ? 'media' : 'baja';
  }

  function mostrarResumen() {
    var tarjeta = document.createElement('div');
    tarjeta.className = 'chat-resumen';
    var lista = document.createElement('ul');
    lineasResumen().concat(['Nombre: ' + contacto.nombre, 'WhatsApp: ' + (contacto.telefonoVisible || contacto.telefono)])
      .forEach(function (l) { var li = document.createElement('li'); li.textContent = l; lista.appendChild(li); });
    tarjeta.appendChild(lista);
    zona.appendChild(tarjeta);

    var acciones = document.createElement('div');
    acciones.className = 'chat-acciones';

    if (destino === 'whatsapp') {
      if (!CFG.whatsapp) {
        acciones.innerHTML = '<p class="chat-error">Estamos activando el número de WhatsApp. Vuelve en un rato.</p>';
        console.warn('[MML] Falta el número en assets/config.js (whatsapp).');
      } else {
        var a = document.createElement('a');
        a.className = 'btn btn-accent btn-big';
        a.href = 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(mensajeWhatsApp());
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = 'Enviar por WhatsApp';
        a.addEventListener('click', function () {
          var miTurno = ++turno;
          setTimeout(function () {
            decir(['Listo. Se abrió tu WhatsApp con el mensaje escrito. Dale enviar y te responde una persona del equipo.'], miTurno);
          }, 400);
        });
        acciones.appendChild(a);
        var nota = document.createElement('p');
        nota.className = 'chat-ayuda';
        nota.textContent = 'Se abre tu WhatsApp con este resumen ya escrito. Tú decides si lo mandas.';
        acciones.appendChild(nota);
      }
    } else {
      acciones.innerHTML =
        '<label class="chat-ok"><input type="checkbox" id="chat-ok"> Autorizo que SCP Inmobiliaria use mis datos para contactarme sobre Mercado Media Luna. <a href="privacidad.html">Aviso de privacidad</a>.</label>' +
        '<button type="button" class="btn btn-accent btn-big" id="chat-guardar">Enviar</button>' +
        '<p class="chat-error" role="alert"></p>';
      acciones.querySelector('#chat-guardar').addEventListener('click', enviarCRM);
    }
    zona.appendChild(acciones);
  }

  function enviarCRM() {
    var ok = document.getElementById('chat-ok');
    var boton = document.getElementById('chat-guardar');
    var error = zona.querySelector('.chat-acciones .chat-error');
    if (!ok.checked) { error.textContent = 'Necesitamos tu permiso para escribirte.'; ok.focus(); return; }
    if (!(CFG.supabaseUrl && CFG.supabaseAnonKey)) { error.textContent = 'No pudimos enviarlo. Escríbenos por WhatsApp.'; return; }
    var params = new URLSearchParams(location.search);
    boton.disabled = true; boton.textContent = 'Enviando…';
    fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/fn_captar_prospecto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + CFG.supabaseAnonKey },
      body: JSON.stringify({
        p_nombre_completo: contacto.nombre,
        p_telefono_e164: contacto.telefono,
        p_origen: origenDesdeUTM(params),
        p_consentimiento: true,
        p_carga: {
          respuestas: respuestas, prioridad: prioridad(), seccion: 'embudo',
          utm_source: params.get('utm_source'), utm_medium: params.get('utm_medium'),
          utm_campaign: params.get('utm_campaign'), utm_content: params.get('utm_content'),
          pagina: location.pathname, user_agent: navigator.userAgent
        },
        p_fuente_sistema: 'landing'
      })
    }).then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (d) {
        if (d && d.ok) { location.href = 'gracias.html'; return; }
        console.warn('[MML] El CRM rechazó el lead. Motivo:', d && d.motivo);
        falloConRespaldo(error, boton);
      })
      .catch(function (e) { console.warn('[MML] Error de red:', e); falloConRespaldo(error, boton); });
  }

  /* si el CRM falla, el lead no se pierde: sale por WhatsApp con el mismo resumen */
  function falloConRespaldo(error, boton) {
    boton.disabled = false; boton.textContent = 'Enviar';
    error.textContent = 'No pudimos guardarlo.';
    if (CFG.whatsapp) {
      var a = document.createElement('a');
      a.href = 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(mensajeWhatsApp());
      a.target = '_blank'; a.rel = 'noopener';
      a.textContent = ' Envíalo por WhatsApp';
      error.appendChild(a);
    }
  }

  /* ---------------------------------------------------------------------
     Utilidades compartidas con el contrato del CRM
     (07-crm/02-codigo/crm-mml/sql/12-captacion.sql)
     --------------------------------------------------------------------- */
  function normalizarTelefono(v) {
    var s = String(v || '').replace(/[\s().-]/g, '');
    if (/^\+\d{8,15}$/.test(s)) return s;
    if (/^00\d{6,15}$/.test(s)) return '+' + s.slice(2);
    if (/^9\d{8}$/.test(s)) return '+51' + s;
    if (/^51\d{9}$/.test(s)) return '+' + s;
    return null;
  }
  /* p_origen solo admite meta_ads | organico | referido | base_historica | live */
  function origenDesdeUTM(params) {
    var src = (params.get('utm_source') || '').toLowerCase();
    if (/meta|fb|facebook|ig|instagram/.test(src)) return 'meta_ads';
    if (/referido|ref/.test(src)) return 'referido';
    return 'organico';
  }

  /* ---------------------------------------------------------------------
     Atrás, y arranque cuando el chat entra en pantalla
     --------------------------------------------------------------------- */
  atras.addEventListener('click', function () {
    var p = pasoActual();
    if (p === 'resumen') { contacto.telefono = ''; contacto.telefonoVisible = ''; }
    else if (p === 'telefono') contacto.nombre = '';
    else {
      var hechas = preguntasActivas().filter(function (q) { return q.id in respuestas; });
      var ultima = hechas[hechas.length - 1];
      if (ultima) { delete respuestas[ultima.id]; delete textos[ultima.id]; }
    }
    pintarHistorial();
    siguiente();
  });

  function iniciar() {
    if (iniciado) return;
    iniciado = true;
    siguiente(SALUDO);
  }
  var pasoDos = document.querySelector('[data-paso-dos]');
  if (pasoDos && destino === 'crm') pasoDos.textContent = 'Guardamos tus datos solo si nos das permiso.';

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { iniciar(); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(raiz);
  } else {
    iniciar();
  }
  actualizarCabecera();

  /* para pruebas automáticas */
  window.__embudo = { respuestas: respuestas, contacto: contacto, prioridad: prioridad, mensaje: mensajeWhatsApp };
})();
