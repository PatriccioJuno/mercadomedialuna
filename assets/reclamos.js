/* =========================================================================
   Mercado Media Luna — Libro de Reclamaciones Virtual
   Sin backend propio todavía (falta la tabla `reclamaciones` y el correo
   oficial de reclamos — ver 01-comercial/libro-de-reclamaciones/). Mientras
   tanto: se genera un número de seguimiento, se entrega una copia
   descargable/imprimible al consumidor, y el reclamo se envía por WhatsApp
   al mismo número real y monitoreado que usa el resto del sitio. Nada se
   pierde en silencio.
   ========================================================================= */
(function () {
  'use strict';

  var CFG = window.MML || {};
  var form = document.getElementById('reclamo-form');
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var msg = $('r-msg');
  var resultado = $('resultado');

  /* ---- menor de edad: muestra/exige los datos del representante ---- */
  var menor = $('r-menor');
  var repWrap = $('r-representante-wrap');
  var camposRep = ['r-rep-nombre', 'r-rep-domicilio', 'r-rep-telefono'];
  menor.addEventListener('change', function () {
    repWrap.classList.toggle('mostrar', menor.checked);
    camposRep.forEach(function (id) { $(id).required = menor.checked; });
    if (menor.checked) $('r-rep-nombre').focus();
  });

  /* ---- teléfono: acepta formato peruano o internacional, sin forzar +51 ---- */
  function telefonoValido(v) {
    var s = String(v || '').replace(/[\s().-]/g, '');
    return /^(\+?\d{7,15}|9\d{8})$/.test(s);
  }

  /* ---- número de seguimiento: distinto, a propósito, del formato correlativo
     impreso del libro físico (N° 000000001-2026), porque este todavía no lo
     asigna un registro persistente. Es único y trazable, no un correlativo
     legal en el sentido estricto del reglamento. ---- */
  function generarCodigo() {
    var d = new Date();
    var pad = function (n, l) { return String(n).padStart(l || 2, '0'); };
    var azar = Math.floor(Math.random() * 900 + 100);
    return 'WEB-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
      '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '-' + azar;
  }

  function val(id) { var e = $(id); return e ? e.value.trim() : ''; }
  function radioVal(name) {
    var e = form.querySelector('input[name="' + name + '"]:checked');
    return e ? e.value : '';
  }

  function recogerDatos() {
    var esMenor = menor.checked;
    return {
      codigo: generarCodigo(),
      fecha: new Date(),
      nombre: val('r-nombre'),
      docTipo: val('r-doc-tipo') || $('r-doc-tipo').value,
      docNum: val('r-doc-num'),
      domicilio: val('r-domicilio'),
      telefono: val('r-telefono'),
      correo: val('r-correo'),
      esMenor: esMenor,
      repNombre: esMenor ? val('r-rep-nombre') : '',
      repDomicilio: esMenor ? val('r-rep-domicilio') : '',
      repTelefono: esMenor ? val('r-rep-telefono') : '',
      repCorreo: esMenor ? val('r-rep-correo') : '',
      bien: radioVal('bien'),
      descripcion: val('r-descripcion'),
      monto: val('r-monto'),
      tipo: radioVal('tipo'),
      detalle: val('r-detalle'),
      pedido: val('r-pedido')
    };
  }

  function marcarError(id, texto) {
    msg.textContent = texto;
    msg.className = 'form-msg err';
    var el = $(id);
    if (el) el.focus();
  }

  /* ---------------------------------------------------------------------
     Envío
     --------------------------------------------------------------------- */
  var ultimo = null;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.className = 'form-msg';

    var d = recogerDatos();
    if (!d.nombre) return marcarError('r-nombre', 'Escribe tu nombre, por favor.');
    if (!d.docNum) return marcarError('r-doc-num', 'Escribe tu número de documento.');
    if (!telefonoValido(d.telefono)) return marcarError('r-telefono', 'Revisa el teléfono. Un celular de Perú son 9 dígitos y empieza en 9.');
    if (d.esMenor && !d.repNombre) return marcarError('r-rep-nombre', 'Escribe el nombre de quien lo representa.');
    if (!d.detalle) return marcarError('r-detalle', 'Cuéntanos qué pasó, aunque sea en pocas líneas.');
    if (!d.pedido) return marcarError('r-pedido', 'Dinos qué necesitas que hagamos.');
    if (!$('r-declaro').checked) return marcarError('r-declaro', 'Marca la casilla de declaración para continuar.');

    ultimo = d;
    mostrarResultado(d);
  });

  /* ---------------------------------------------------------------------
     Resultado: código, copia descargable, envío por WhatsApp
     --------------------------------------------------------------------- */
  function fmtFecha(f) {
    return f.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + f.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  function mostrarResultado(d) {
    $('r-codigo').textContent = 'N° ' + d.codigo;
    form.querySelectorAll('input, select, textarea, button').forEach(function (e) { e.disabled = true; });
    msg.textContent = 'Listo. Revisa el resultado abajo.';
    msg.className = 'form-msg ok';

    var wa = $('r-whatsapp');
    if (CFG.whatsapp) {
      wa.href = 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(mensajeWhatsApp(d));
    } else {
      wa.removeAttribute('href');
      wa.setAttribute('aria-disabled', 'true');
      wa.textContent = 'WhatsApp no disponible';
    }

    resultado.classList.add('mostrar');
    var titulo = $('r-resultado-titulo');
    titulo.focus({ preventScroll: false });
    resultado.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  function mensajeWhatsApp(d) {
    var l = [
      'LIBRO DE RECLAMACIONES · Mercado Media Luna',
      'N° de seguimiento: ' + d.codigo,
      'Tipo: ' + d.tipo,
      'Nombre: ' + d.nombre + ' (' + d.docTipo + ' ' + d.docNum + ')',
      'Teléfono: ' + d.telefono
    ];
    if (d.correo) l.push('Correo: ' + d.correo);
    if (d.esMenor) l.push('Representante: ' + d.repNombre + (d.repTelefono ? ' · ' + d.repTelefono : ''));
    if (d.descripcion) l.push('Sobre: ' + d.descripcion);
    if (d.monto) l.push('Monto reclamado: ' + d.monto);
    l.push('Detalle: ' + d.detalle);
    l.push('Pedido: ' + d.pedido);
    return l.join('\n');
  }

  /* ---- copia imprimible: una pestaña nueva, limpia, lista para Ctrl+P ---- */
  function escapar(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function generarCopiaHTML(d) {
    var fila = function (etiqueta, valor) {
      return valor ? '<tr><th>' + escapar(etiqueta) + '</th><td>' + escapar(valor) + '</td></tr>' : '';
    };
    return '<!DOCTYPE html><html lang="es-PE"><head><meta charset="utf-8">' +
      '<title>Reclamo ' + escapar(d.codigo) + '</title>' +
      '<style>' +
      'body{font-family:Arial,sans-serif;max-width:700px;margin:32px auto;color:#111;line-height:1.5}' +
      'h1{font-size:20px;margin-bottom:2px}h2{font-size:15px;margin-top:28px;border-bottom:1px solid #ccc;padding-bottom:4px}' +
      'table{width:100%;border-collapse:collapse;margin-top:8px}th{text-align:left;width:220px;padding:6px 8px;vertical-align:top;color:#555;font-weight:normal}' +
      'td{padding:6px 8px;vertical-align:top}tr:nth-child(even){background:#f5f5f5}' +
      '.aviso{border-left:4px solid #999;padding:10px 14px;margin:14px 0;background:#f8f8f8;font-size:14px}' +
      '.pie{font-size:12px;color:#555;margin-top:24px}' +
      '@media print{button{display:none}}' +
      '</style></head><body>' +
      '<h1>LIBRO DE RECLAMACIONES</h1>' +
      '<p>SOCIEDAD INMOBILIARIA CONSTRUYO PERU S.A.C. (SCP Inmobiliaria) · RUC 20552782292</p>' +
      '<p>N° de seguimiento: <strong>' + escapar(d.codigo) + '</strong> · Fecha: ' + escapar(fmtFecha(d.fecha)) + '</p>' +
      '<h2>1. Consumidor reclamante</h2><table>' +
      fila('Nombre y apellidos', d.nombre) + fila('Documento', d.docTipo + ' ' + d.docNum) +
      fila('Domicilio', d.domicilio) + fila('Teléfono', d.telefono) + fila('Correo', d.correo) +
      (d.esMenor ? fila('Representante', d.repNombre) + fila('Domicilio del representante', d.repDomicilio) + fila('Teléfono del representante', d.repTelefono) + fila('Correo del representante', d.repCorreo) : '') +
      '</table>' +
      '<h2>2. Bien contratado</h2><table>' +
      fila('Tipo', d.bien) + fila('Descripción', d.descripcion) + fila('Monto reclamado', d.monto) +
      '</table>' +
      '<h2>3. ' + escapar(d.tipo) + '</h2>' +
      '<p><strong>Detalle:</strong><br>' + escapar(d.detalle).replace(/\n/g, '<br>') + '</p>' +
      '<p><strong>Pedido concreto del consumidor:</strong><br>' + escapar(d.pedido).replace(/\n/g, '<br>') + '</p>' +
      '<div class="aviso">La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.</div>' +
      '<div class="aviso">El proveedor debe dar respuesta al reclamo en un plazo no mayor a quince (15) días hábiles improrrogables, conforme a la Ley N° 31435, que modifica el artículo 24 de la Ley N° 29571, Código de Protección y Defensa del Consumidor.</div>' +
      '<p class="pie">Copia generada por el visitante desde mercadomedialuna.com el ' + escapar(fmtFecha(d.fecha)) + '. Guárdala o imprímela: Ctrl/Cmd + P.</p>' +
      '<button onclick="window.print()">Imprimir o guardar como PDF</button>' +
      '</body></html>';
  }

  $('r-imprimir').addEventListener('click', function () {
    if (!ultimo) return;
    var html = generarCopiaHTML(ultimo);
    var blob = new Blob([html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var ventana = window.open(url, '_blank', 'noopener');
    if (!ventana) {
      var a = document.createElement('a');
      a.href = url; a.download = 'reclamo-' + ultimo.codigo + '.html';
      document.body.appendChild(a); a.click(); a.remove();
    }
  });
})();
