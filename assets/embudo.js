/* =========================================================================
   Mercado Media Luna — embudo de calificación (chat automático)
   Las preguntas salen del guion de calificación del proyecto
   (02-marketing/marca/OPERACION-WHATSAPP-HERRAMIENTAS-Y-LOTE.md §1.4: operar
   o invertir, si compró antes, cómo paga, si decide solo) más las que el
   equipo necesita antes de la primera conversación.
   Reglas: el chat dice que es automático, y ninguna respuesta promete
   precio, financiamiento, rentabilidad, fechas ni disponibilidad.
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
  /* en modo WhatsApp el visitante escribe desde su propio número: no hace falta pedirlo */
  var pideTelefono = destino === 'crm';
  zona.tabIndex = -1;   // ancla del foco mientras se cambia el contenido

  /* ---------------------------------------------------------------------
     El guion
     --------------------------------------------------------------------- */
  var LEJOS = { provincia: 1, extranjero: 1 };
  var PREGUNTAS = [
    {
      id: 'uso', texto: '¿Para qué quieres el puesto?',
      opciones: [
        { v: 'operar', t: 'Para trabajarlo yo' },
        { v: 'invertir', t: 'Como inversión' },
        { v: 'viendo', t: 'Todavía lo estoy viendo' }
      ],
      eco: { invertir: 'De frente: hoy no tenemos un dato de renta que podamos respaldar, y no te vamos a inventar uno. Lo que sí te mostramos es la obra como está.' }
    },
    {
      id: 'alquiler', texto: '¿Hoy pagas alquiler por tu puesto o local?',
      opciones: [
        { v: 'si', t: 'Sí, pago alquiler' },
        { v: 'calle', t: 'Vendo en la calle o en feria' },
        { v: 'propio', t: 'No, ya tengo local propio' },
        { v: 'sin_negocio', t: 'Todavía no tengo negocio' }
      ],
      eco: { si: 'Entonces sabes lo que es pagar cada mes por un sitio que no es tuyo.' }
    },
    {
      id: 'antes', texto: '¿Ya compraste un puesto o local antes?',
      opciones: [
        { v: 'si', t: 'Sí, ya compré' },
        { v: 'no', t: 'No, sería la primera vez' }
      ],
      eco: { no: 'Normal. Antes de que pagues algo, te explicamos por escrito qué estás comprando.' }
    },
    {
      id: 'giro', texto: '¿Qué vendes, o qué te gustaría vender?',
      saltar: function (r) { return r.uso === 'invertir'; },
      opciones: [
        { v: 'abarrotes', t: 'Abarrotes' },
        { v: 'frutas', t: 'Frutas y verduras' },
        { v: 'carnes', t: 'Carnes, pollo o pescado' },
        { v: 'comida', t: 'Comida o jugos' },
        { v: 'otro', t: 'Otra cosa' }
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
        { v: 'partes', t: 'Hoy no tengo el monto completo' },
        { v: 'nose', t: 'Todavía no lo sé' }
      ],
      eco: { partes: 'Anotado. Se lo pasamos tal cual al equipo.' }
    },
    {
      id: 'decide', texto: '¿Quién toma la decisión?',
      opciones: [
        { v: 'solo', t: 'Lo decido yo' },
        { v: 'familia', t: 'Con mi familia o mi socio' }
      ],
      eco: { familia: 'Tiene sentido. Pueden ver la obra juntos, en persona o por videollamada.' }
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

  /* rótulos del resumen y del mensaje de WhatsApp */
  var ROTULOS = {
    uso: 'El puesto', alquiler: 'Hoy', antes: 'Compra previa', giro: 'Rubro',
    zona: 'Escribo desde', pago: 'Pago', decide: 'Decisión', visita: 'Visita'
  };

  var SALUDO = [
    'Hola. Este es el chat automático de Mercado Media Luna.',
    pideTelefono
      ? 'Te hago unas preguntas rápidas para ver si esto te sirve. Al final te pedimos tu nombre y tu WhatsApp, nada más.'
      : 'Te hago unas preguntas rápidas para ver si esto te sirve. Al final te pedimos tu nombre, nada más.'
  ];
  var PREGUNTA_NOMBRE = pideTelefono ? 'Ya casi. ¿Cómo te llamas?' : 'Último paso. ¿Cómo te llamas?';
  var PREGUNTA_TELEFONO = '¿A qué número de WhatsApp te escribimos?';

  /* ---------------------------------------------------------------------
     Estado
     --------------------------------------------------------------------- */
  var respuestas = {};   // id → valor
  var textos = {};       // id → texto elegido
  var contacto = { nombre: '', telefono: '', telefonoVisible: '' };
  var turno = 0;         // invalida animaciones en curso
  var iniciado = false;
  var interactuo = false;

  function preguntasActivas() {
    return PREGUNTAS.filter(function (p) { return !(p.saltar && p.saltar(respuestas)); });
  }
  function opcionesDe(p) { return typeof p.opciones === 'function' ? p.opciones(respuestas) : p.opciones; }
  function preguntaPorId(id) { return PREGUNTAS.filter(function (q) { return q.id === id; })[0]; }

  /* el siguiente paso pendiente: una pregunta, 'nombre', 'telefono' o 'resumen' */
  function pasoActual() {
    var activas = preguntasActivas();
    for (var i = 0; i < activas.length; i++) if (!(activas[i].id in respuestas)) return activas[i];
    if (!contacto.nombre) return 'nombre';
    if (pideTelefono && !contacto.telefono) return 'telefono';
    return 'resumen';
  }
  function claveDe(p) { return typeof p === 'object' ? p.id : p; }

  /* pasos ya hechos, en orden: sirve para contar y para volver atrás */
  function pasosHechos() {
    var hechos = preguntasActivas().filter(function (p) { return p.id in respuestas; }).map(function (p) { return p.id; });
    if (contacto.nombre) hechos.push('nombre');
    if (pideTelefono && contacto.telefono) hechos.push('telefono');
    return hechos;
  }
  function totalPasos() { return preguntasActivas().length + (pideTelefono ? 2 : 1); }

  /* ---------------------------------------------------------------------
     Burbujas: cada una sabe a qué paso pertenece, para poder recortar
     --------------------------------------------------------------------- */
  function burbuja(clase, texto, paso) {
    var b = document.createElement('div');
    b.className = 'msg ' + clase;
    b.textContent = texto;
    b.setAttribute('data-paso', paso || '');
    log.appendChild(b);
    return b;
  }
  function bot(texto, paso) { return burbuja('msg-bot', texto, paso); }
  function yo(texto, paso) { return burbuja('msg-yo', texto, paso); }

  function escribiendo() {
    var t = document.createElement('div');
    t.className = 'msg msg-bot msg-escribiendo';
    t.setAttribute('aria-hidden', 'true');
    t.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(t);
    return t;
  }

  var esperar = function (ms) { return new Promise(function (r) { setTimeout(r, reducido.matches ? 0 : ms); }); };

  /* escribe burbujas del bot con su pausa de "escribiendo"; lineas = [{ texto, paso }] */
  function decir(lineas, miTurno) {
    return lineas.reduce(function (cadena, linea) {
      return cadena.then(function () {
        if (miTurno !== turno) return;
        var t = escribiendo();
        if (interactuo) mantenerVisible();
        return esperar(Math.min(1100, 380 + linea.texto.length * 11)).then(function () {
          t.remove();
          if (miTurno === turno) bot(linea.texto, linea.paso);
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

  /* el foco nunca cae a <body> cuando se borra el elemento que lo tenía */
  function anclarFoco() {
    var a = document.activeElement;
    if (a && (zona.contains(a) || a === atras)) zona.focus({ preventScroll: true });
  }

  function actualizarCabecera() {
    var hechos = pasosHechos().length, total = totalPasos();
    barra.style.transform = 'scaleX(' + (hechos / total).toFixed(3) + ')';
    pasoTxt.textContent = pasoActual() === 'resumen' ? 'Listo para enviar' : 'Paso ' + Math.min(hechos + 1, total) + ' de ' + total;
    if (hechos === 0 && document.activeElement === atras) zona.focus({ preventScroll: true });
    atras.hidden = hechos === 0;
  }

  /* ---------------------------------------------------------------------
     Avanzar: animar solo lo nuevo
     --------------------------------------------------------------------- */
  function siguiente(ecos) {
    var miTurno = ++turno;
    zona.textContent = '';
    actualizarCabecera();
    var p = pasoActual();
    var clave = claveDe(p);

    var lineas = (ecos || []).slice();
    if (typeof p === 'object') lineas.push({ texto: p.texto, paso: clave });
    else if (p === 'nombre') lineas.push({ texto: PREGUNTA_NOMBRE, paso: clave });
    else if (p === 'telefono') lineas.push({ texto: PREGUNTA_TELEFONO, paso: clave });
    else lineas.push({ texto: contacto.nombre.split(' ')[0] + ', esto es lo que le llega al equipo:', paso: 'resumen' });

    decir(lineas, miTurno).then(function () {
      if (miTurno !== turno) return;
      if (typeof p === 'object') mostrarOpciones(p);
      else if (p === 'nombre' || p === 'telefono') mostrarCampo(p);
      else mostrarResumen();
      if (interactuo) mantenerVisible();
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
    if (p.id in respuestas) return;          // doble toque: la primera respuesta manda
    if (!interactuo && window.MMLmedir) window.MMLmedir.evento('EmbudoInicio');
    interactuo = true;
    anclarFoco();
    respuestas[p.id] = o.v;
    textos[p.id] = o.t;
    if (p.id === 'uso' && o.v === 'invertir') { delete respuestas.giro; delete textos.giro; }
    if (p.id === 'zona' && respuestas.visita) {
      var valida = opcionesDe(preguntaPorId('visita')).some(function (x) { return x.v === respuestas.visita; });
      if (!valida) { delete respuestas.visita; delete textos.visita; }
    }
    zona.textContent = '';
    yo(o.t, p.id);
    var eco = p.eco && p.eco[o.v];
    siguiente(eco ? [{ texto: eco, paso: p.id }] : []);
  }

  function mostrarCampo(tipo) {
    var f = document.createElement('form');
    f.className = 'chat-campo';
    f.noValidate = true;
    var id = 'chat-' + tipo;
    var esTel = tipo === 'telefono';
    var fuera = respuestas.zona === 'extranjero';
    var ayuda = fuera ? 'Escríbelo con + y el código de tu país.' : 'Celular de Perú. Si estás fuera, ponlo con el código de tu país.';
    f.innerHTML =
      '<label class="sr" for="' + id + '">' + (esTel ? 'Tu número de WhatsApp' : 'Tu nombre') + '</label>' +
      '<input id="' + id + '" type="' + (esTel ? 'tel' : 'text') + '" ' +
      (esTel ? 'inputmode="tel" autocomplete="tel" placeholder="' + (fuera ? '+56 9 1234 5678' : '999 999 999') + '"' : 'autocomplete="name" placeholder="Nombre y apellido"') +
      ' aria-describedby="' + id + '-error' + (esTel ? ' ' + id + '-ayuda' : '') + '" required>' +
      '<button type="submit" class="chat-enviar" aria-label="Enviar">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6l-.02 6.53L15 12 3.38 13.87z"/></svg></button>' +
      '<p class="chat-error" id="' + id + '-error" role="alert"></p>' +
      (esTel ? '<p class="chat-ayuda" id="' + id + '-ayuda"></p>' : '') +
      '<div class="trampa" aria-hidden="true"><input type="text" name="web" tabindex="-1" autocomplete="off"></div>';
    if (esTel) f.querySelector('.chat-ayuda').textContent = ayuda;
    var input = f.querySelector('input');
    var error = f.querySelector('.chat-error');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.querySelector('[name=web]').value) return;      // bot atrapado: no hace nada
      interactuo = true;
      var v = input.value.trim();
      if (!esTel) {
        if (v.length < 2) { error.textContent = 'Escribe tu nombre, por favor.'; input.focus(); return; }
        anclarFoco();
        contacto.nombre = v.replace(/\s+/g, ' ');
        zona.textContent = '';
        yo(contacto.nombre, 'nombre');
      } else {
        var tel = normalizarTelefono(v, fuera);
        if (!tel) {
          error.textContent = fuera ? 'Escríbelo con + y el código de tu país.' : 'Revisa el número. Un celular de Perú son 9 dígitos y empieza en 9.';
          input.focus(); return;
        }
        anclarFoco();
        contacto.telefono = tel;
        contacto.telefonoVisible = v;
        zona.textContent = '';
        yo(v, 'telefono');
      }
      siguiente();
    });
    zona.appendChild(f);
    input.focus({ preventScroll: true });
  }

  /* ---------------------------------------------------------------------
     Resumen y envío
     --------------------------------------------------------------------- */
  function lineasResumen() {
    return preguntasActivas().map(function (p) {
      var t = textos[p.id];
      return ROTULOS[p.id] + ': ' + t.charAt(0).toLowerCase() + t.slice(1);
    });
  }

  /* de dónde vino, para que el equipo mida qué canal trae gente */
  function etiquetaOrigen() {
    return { meta_ads: 'anuncio', referido: 'referido', base_historica: 'base', live: 'live' }[origenDesdeUTM(new URLSearchParams(location.search))] || 'web';
  }

  function mensajeWhatsApp() {
    return 'Hola, soy ' + contacto.nombre + '. Vengo de la web de Mercado Media Luna (' + etiquetaOrigen() + ').\n' +
      lineasResumen().map(function (l) { return '• ' + l; }).join('\n') +
      (contacto.telefono ? '\nMi número: ' + contacto.telefono : '');
  }

  /* prioridad interna para el CRM: nunca se le muestra al visitante */
  function prioridad() {
    var s = 0;
    if (respuestas.uso === 'operar') s += 2;
    if (respuestas.alquiler === 'si') s += 2;
    if (respuestas.alquiler === 'calle') s += 1;
    if (respuestas.pago === 'ahorros') s += 1;
    if (respuestas.decide === 'solo') s += 1;
    if (respuestas.visita === 'semana' || respuestas.visita === 'video_semana') s += 2;
    return s >= 6 ? 'alta' : s >= 3 ? 'media' : 'baja';
  }

  function enlaceAviso(texto) {
    var a = document.createElement('a');
    a.href = 'privacidad.html';
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = texto;
    return a;
  }

  function mostrarResumen() {
    var tarjeta = document.createElement('div');
    tarjeta.className = 'chat-resumen';
    tarjeta.tabIndex = -1;
    tarjeta.setAttribute('role', 'group');
    tarjeta.setAttribute('aria-label', 'Resumen de lo que respondiste');
    var lista = document.createElement('ul');
    var filas = lineasResumen().concat(['Nombre: ' + contacto.nombre]);
    if (contacto.telefono) filas.push('WhatsApp: ' + (contacto.telefonoVisible || contacto.telefono));
    filas.forEach(function (l) { var li = document.createElement('li'); li.textContent = l; lista.appendChild(li); });
    tarjeta.appendChild(lista);
    zona.appendChild(tarjeta);

    var acciones = document.createElement('div');
    acciones.className = 'chat-acciones';

    if (destino === 'whatsapp') {
      if (!CFG.whatsapp) {
        var sin = document.createElement('p');
        sin.className = 'chat-error';
        sin.textContent = 'Estamos activando el número de WhatsApp. Vuelve en un rato.';
        acciones.appendChild(sin);
        console.warn('[MML] Falta el número en assets/config.js (whatsapp).');
      } else {
        var a = document.createElement('a');
        a.className = 'btn btn-accent btn-big';
        a.href = 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(mensajeWhatsApp());
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = 'Enviar por WhatsApp';
        var avisado = false;
        a.addEventListener('click', function () {
          if (avisado) return;
          avisado = true;
          if (window.MMLmedir) window.MMLmedir.lead('embudo_whatsapp');
          var miTurno = ++turno;
          setTimeout(function () {
            decir([{ texto: 'Listo. Si se abrió tu WhatsApp, dale enviar y te responde una persona del equipo.', paso: 'envio' }], miTurno);
          }, 400);
        });
        acciones.appendChild(a);
        var nota = document.createElement('p');
        nota.className = 'chat-ayuda';
        nota.append('Se abre tu WhatsApp con este resumen ya escrito. Tú decides si lo mandas. Si lo mandas, lo recibe el equipo de SCP Inmobiliaria. ');
        nota.append(enlaceAviso('Aviso de privacidad'), '.');
        acciones.appendChild(nota);
      }
    } else {
      var label = document.createElement('label');
      label.className = 'chat-ok';
      label.innerHTML = '<input type="checkbox" id="chat-ok" aria-describedby="chat-ok-aviso"> ';
      label.append('Autorizo que SCP Inmobiliaria use mis datos para contactarme sobre Mercado Media Luna.');
      var aviso = document.createElement('p');
      aviso.className = 'chat-ayuda';
      aviso.id = 'chat-ok-aviso';
      aviso.append(enlaceAviso('Lee el aviso de privacidad'), ' (se abre en otra pestaña).');
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn btn-accent btn-big';
      boton.id = 'chat-guardar';
      boton.textContent = 'Enviar';
      var err = document.createElement('p');
      err.className = 'chat-error';
      err.setAttribute('role', 'alert');
      boton.addEventListener('click', enviarCRM);
      acciones.append(label, aviso, boton, err);
    }
    zona.appendChild(acciones);
    if (ultimoPorTeclado || document.activeElement === zona) tarjeta.focus({ preventScroll: true });
  }

  function enviarCRM() {
    var ok = document.getElementById('chat-ok');
    var boton = document.getElementById('chat-guardar');
    var error = zona.querySelector('.chat-acciones .chat-error');
    if (boton.disabled) return;
    if (!ok.checked) { error.textContent = 'Necesitamos tu permiso para escribirte.'; ok.focus(); return; }
    if (!(CFG.supabaseUrl && CFG.supabaseAnonKey)) { falloConRespaldo(error, boton); return; }
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
        if (d && d.ok) { if (window.MMLmedir) window.MMLmedir.lead('embudo_crm'); setTimeout(function () { location.href = 'gracias.html'; }, 300); return; }
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
      a.addEventListener('click', function () { if (window.MMLmedir) window.MMLmedir.lead('embudo_respaldo'); });
      error.appendChild(a);
    }
  }

  /* ---------------------------------------------------------------------
     Utilidades del contrato del CRM (07-crm/02-codigo/crm-mml/sql/12-captacion.sql)
     --------------------------------------------------------------------- */
  function normalizarTelefono(v, fuera) {
    var s = String(v || '').replace(/[\s().-]/g, '');
    if (/^\+\d{8,15}$/.test(s)) return s;
    if (/^00\d{8,15}$/.test(s)) return '+' + s.slice(2);
    if (fuera) return null;                 // desde el extranjero se pide el código de país
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
     Atrás: recorta la conversación desde el último paso (sin volver a
     anunciar todo al lector de pantalla), y vuelve a preguntarlo
     --------------------------------------------------------------------- */
  atras.addEventListener('click', function () {
    var hechos = pasosHechos();
    var revertir = hechos[hechos.length - 1];
    if (!revertir) return;
    interactuo = true;
    anclarFoco();
    if (revertir === 'nombre') contacto.nombre = '';
    else if (revertir === 'telefono') { contacto.telefono = ''; contacto.telefonoVisible = ''; }
    else { delete respuestas[revertir]; delete textos[revertir]; }
    var desde = log.querySelector('[data-paso="' + revertir + '"]');
    while (desde && desde.nextSibling) desde.parentNode.removeChild(desde.nextSibling);
    if (desde) desde.remove();
    // sin eco repetido: la pregunta se vuelve a hacer una vez
    siguiente();
  });

  /* ---------------------------------------------------------------------
     Arranque cuando el chat entra en pantalla
     --------------------------------------------------------------------- */
  function iniciar() {
    if (iniciado) return;
    iniciado = true;
    siguiente(SALUDO.map(function (t) { return { texto: t, paso: 'saludo' }; }));
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

  /* para pruebas automáticas: solo funciones, ningún dato del visitante */
  window.__embudo = { prioridad: prioridad, mensaje: mensajeWhatsApp };
})();
