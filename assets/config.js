/* =========================================================================
   Mercado Media Luna — configuración del sitio
   Este es el ÚNICO archivo que hay que tocar para cambiar enlaces o llaves.
   Nada de aquí es un dato del negocio: son direcciones y llaves técnicas.
   La llave publishable de Supabase es pública por diseño. La service_role
   NUNCA va aquí (07-crm/CLAUDE.md §5).
   ========================================================================= */
window.MML = {

  /* ---- 0 · A dónde va el formulario ---------------------------------------
     'whatsapp' → al enviar se abre el WhatsApp del visitante con su mensaje
                  escrito. No guardamos ningún dato: lo manda él mismo.
     'crm'      → escribe directo en el CRM (fn_captar_prospecto). Solo cuando
                  Dirección cargue aviso_privacidad_version en verde; si no,
                  el CRM rechaza el 100% de los leads.
     Cambiar esta línea es todo lo que hace falta para pasar al CRM. */
  destinoFormulario: 'whatsapp',

  /* ---- 1 · CRM (Supabase) -------------------------------------------------
     Proyecto vivo: crm-mml · nmqwibcxqkaifszzbloo · región sa-east-1.
     Verificado el 17/09/2026: fn_captar_prospecto existe y el rol anónimo
     puede ejecutarla. La llave anon antigua (JWT) está DESACTIVADA en el
     proyecto: se usa la publishable nueva. */
  supabaseUrl: 'https://nmqwibcxqkaifszzbloo.supabase.co',
  supabaseAnonKey: 'sb_publishable_JOUJf0oPbYyHDTPrtiAdtw_qU1hVjAX',

  /* ---- 2 · WhatsApp -------------------------------------------------------
     Número en formato internacional, solo dígitos. Ej: '51987654321'.
     Número del proyecto confirmado por Patriccio el 17/09/2026 (+51 992 755 150).
     Si se vacía, los botones de WhatsApp llevan al formulario.
     Si cambias este número, cámbialo también en el <noscript> de index.html
     (sección #hablemos), que no puede leer este archivo. */
  whatsapp: '51992755150',
  whatsappTexto: 'Hola, vi la web de Mercado Media Luna y quiero información.',

  /* ---- 2b · Medición: Píxel de Meta ----------------------------------------
     Solo se carga si el visitante acepta el aviso de cookies (assets/medicion.js).
     Vacío = sin píxel y sin aviso. Nunca se envían nombre, teléfono ni respuestas.
     APAGADO A PROPÓSITO: el aviso de privacidad (privacidad.html) todavía no
     tiene la identidad del responsable, el correo de derechos ARCO ni el
     plazo de conservación completos (ver PENDIENTES-WEB.md #1). Sin eso, el
     consentimiento del aviso de cookies no es "informado" (D.S. 016-2024-JUS
     art. 6.1). Cuando Dirección ratifique el aviso, cambiar esta línea a
     true: no hace falta tocar nada más, el aviso y el píxel se activan solos. */
  avisoPrivacidadListo: false,
  metaPixelId: '28950555004562397',

  /* ---- 3 · Redes ---------------------------------------------------------- */
  redes: {
    youtube: 'https://www.youtube.com/@MercadoMediaLuna',
    instagram: 'https://www.instagram.com/mercadomedialuna/',
    tiktok: 'https://www.tiktok.com/@mercadomedialuna',
    facebook: 'https://www.facebook.com/profile.php?id=61573313321939',
  },

  /* ---- 4 · Testimonios ----------------------------------------------------
     Una tarjeta por comprador en la portada, /evento y /sabado-26: foto,
     estrellas, sus palabras, nombre y rubro. Al tocar la foto se reproduce
     el video (assets/testimonios.js).
     REGLAS DEL PROYECTO:
     · cada comprador que sale en la web necesita su autorización de imagen.
       Si "autorizacion" trae la palabra PENDIENTE, la web muestra el aviso;
     · la cita es TEXTUAL, sacada de su video, y no puede prometer
       rentabilidad, plusvalía, fechas ni "título de propiedad". Si en el
       video dicen algo así, se elige otra frase (ver PENDIENTES-WEB.md, E19).
     · la foto va recortada 4:5 en assets/, con nombre nuevo si cambia. */
  testimonios: [
    {
      id: 'B83FezzbXAg',
      nombre: 'Julia Ortiz',
      descripcion: 'Rubro de comida',
      /* textual, de 0:14 a 0:21 de su video */
      cita: 'Quiero trabajar lo que es mío, ya no alquilar, sino mi propio negocio, mi propio puesto.',
      foto: 'assets/testimonio-julia-ortiz.jpg',
      duracion: '1:53',
      autorizacion: 'Accedió a la entrevista y a su publicación (Patriccio, 25/09/2026). Falta archivar la firma.',
    },
    {
      id: '1cvIRgGigTg',
      nombre: 'Vilma Ferrer',
      descripcion: 'Compradora del mercado',
      /* sin cita todavía: los subtítulos de su video no se pudieron leer
         (YouTube bloqueó la consulta el 25/09). Va textual cuando se tenga;
         mientras tanto la tarjeta sale sin frase, no con una inventada. */
      cita: '',
      foto: 'assets/testimonio-vilma-ferrer.jpg',
      duracion: '2:42',
      /* entregado por Patriccio para publicar el 25/09/2026 */
      autorizacion: 'Entregado por Patriccio para publicar (25/09/2026). Falta archivar la firma.',
    },
    {
      id: 'pdMXMdVjZ2o',
      nombre: 'Emilio',
      descripcion: 'Compró cuando esto era desierto',
      /* textual: 0:22 y 1:00 de su video */
      cita: 'Era prácticamente el desierto, no había nada. […] Para tener un progreso hay que ver hacia delante.',
      /* foto entregada por Patriccio el 24/09/2026. Se difuminó un letrero del
         fondo ("pago hasta en 12 meses" y teléfonos de terceros): podía
         leerse como una oferta de financiamiento nuestra. */
      foto: 'assets/testimonio-emilio.jpg',
      duracion: '2:59',
      /* Autorizó de viva voz a Patriccio el 23/09/2026. Falta archivar la firma. */
      autorizacion: 'Verbal, 23/09/2026. Falta archivar la firma.',
    },
  ],

  /* ---- 4a · Walter, en sus palabras (sección "Quiénes lo construyen") -----
     Short del canal oficial @MercadoMediaLuna. Patriccio lo entregó el
     23/09/2026 como la historia de Walter en primera persona, confirmada por
     Walter, y con eso se cerró ese pendiente. La foto de la sección hace de
     portada: YouTube no se toca hasta que alguien le da reproducir.
     Vacío = la sección muestra la foto sola, sin botón. */
  walter: {
    youtubeId: 'ZJXQzHrq6fE',
  },

  /* ---- 4b · La página del evento (evento.html) ----------------------------
     El evento se repite todos los miércoles, así que aquí no va ninguna
     fecha: la página calcula sola cuál es el próximo miércoles en hora de
     Lima. Para cambiar el día o la hora se cambian estas dos líneas. */
  evento: {
    diaSemana: 3,              // 0 domingo, 3 miércoles
    hora: 19, minuto: 30,      // 7:30 p.m., hora de Lima
    /* El video que estructura la información. Vacío = la página muestra el
       espacio marcado como pendiente y sigue funcionando y convirtiendo. */
    youtubeId: '',             // [PENDIENTE: id del video del evento en YouTube]
    /* 'opcional' → se puede saltar (recomendado arriba del embudo: pedir el
       documento antes de la primera conversación cuesta registros).
       'obligatorio' → no se puede saltar.  'no' → ni se pregunta. */
    pedirDocumento: 'opcional',
    /* (Los testimonios escritos pasaron a ser parte de las tarjetas de
       testimonios, arriba en §4, el 25/09/2026.) */
  },

  /* ---- 4c · El evento en vivo del sábado 26 (sabado-26.html) ---------------
     Fecha, hora (9:00 p.m.), modalidad (en vivo por YouTube, Instagram y
     TikTok) y condiciones del descuento (solo para quienes asistan y se
     unan a la comunidad, hasta la medianoche del sábado): dados por
     Patriccio el 25/09/2026. El descuento de US$2,000 es un dato de
     precio y está registrado en 00-fuente-de-verdad/precios-vigentes.md §2b.
     Pasada la medianoche la página cambia sola: dice que el evento terminó
     y manda al de los miércoles. No hay que tocar nada. */
  sabado: {
    fecha: '2026-09-26T21:00:00-05:00',          // inicio, hora de Perú
    cierreOferta: '2026-09-26T23:59:59-05:00',   // vence el descuento
    horaTexto: '9:00 p.m.',
    /* VIDEO DE INTRODUCCIÓN: pegar aquí el enlace de YouTube tal cual (sirve
       el normal, el corto youtu.be o el de Shorts). Aparece arriba en la
       página y arranca solo, con sonido donde el navegador lo deja (si no,
       sin sonido hasta el primer toque). Vacío = el espacio no se muestra.
       formato: 'horizontal' (16:9) o 'vertical' (Shorts, 9:16). */
    videoIntro: { enlace: 'https://youtu.be/CIRhBK0UnQI', formato: 'horizontal' },   // "Evento 26 de Septiembre", entregado por Patriccio el 26/09/2026
    videoIntroTitulo: 'Video de introducción del evento del sábado 26',
    pedirDocumento: 'opcional',
    /* no dice "estamos en vivo": nadie fijó cuánto dura la transmisión, y entre
       el final y la medianoche sería falso */
    rotuloEnVivo: 'El evento empezó a las 9:00 p.m. El descuento de US$2,000 (S/6,740) en 10 puestos y 2 tiendas vence a la medianoche, hora de Perú. Quedan:',
    rotuloTerminado: 'El evento del sábado 26 ya terminó y el descuento venció. Los miércoles a las 7:30 p.m. seguimos explicando el mercado en vivo.',
    saludo: [
      'Hola. Este es el registro automático del evento en vivo del sábado 26.',
      'Son cuatro preguntas rápidas y tu nombre. Menos de un minuto.'
    ],
    preguntaAsistencia: {
      id: 'sabado', texto: '¿Te conectas este sábado 26 a las 9:00 p.m.?', rotulo: 'El sábado 26',
      opciones: [
        { v: 'si', t: 'Sí, me conecto' },
        { v: 'quizas', t: 'Voy a intentarlo' },
        { v: 'info', t: 'Mándame la información primero' }
      ],
      eco: {
        quizas: 'Te mandamos los enlaces igual. El descuento es solo para quienes se conecten esa noche y se unan a la comunidad.',
        info: 'Listo. Te mandamos la información y los enlaces de la transmisión y de la comunidad.'
      }
    },
    mensajeRegistro: 'Quiero registrarme al evento en vivo del sábado 26 de septiembre, 9:00 p.m.',
    mensajeWa: 'Hola, vi la página del evento en vivo del sábado 26 de Mercado Media Luna y quiero información.',
    confirmacion: 'Listo. Si se abrió tu WhatsApp, dale enviar y te mandamos los enlaces de la transmisión y de la comunidad.',
  },

  /* ---- 5 · Video del hero -------------------------------------------------
     El timelapse de la construcción (entregado por Patriccio el 24/09/2026)
     recodificado desde el original HEVC de 10 bits: H.264 con un cuadro clave
     cada 8 para que el scroll vaya y vuelva sin trabarse. Escritorio a CRF 18,
     que a tamaño real no se distingue del original.
     Cuando cambie el video, cambia el nombre del archivo: /assets/ guarda
     imágenes y videos 7 días en el navegador y un nombre repetido dejaría a
     quien ya visitó el sitio viendo el video viejo. */
  video: 'assets/hero-scrub-v2.mp4',                  // 1920×1080
  videoLigero: 'assets/hero-scrub-v2-lite.mp4',       // 1280×720: solo con conexión lenta o ahorro de datos
  videoBytes: 7100592,                                // respaldo cuando falta Content-Length
  videoLigeroBytes: 2947814,
  poster: 'assets/hero-poster-v2.jpg',                // primer cuadro del video, idéntico
  /* En celular (vertical) el hero es compacto: un recorte cuadrado centrado
     en el mercado, que así se ve completo en el ancho del teléfono. */
  videoMovil: 'assets/hero-scrub-v2-movil.mp4',       // 1080×1080
  videoMovilLigero: 'assets/hero-scrub-v2-movil-lite.mp4', // 720×720
  videoMovilBytes: 3422425,
  videoMovilLigeroBytes: 1639454,
  posterMovil: 'assets/hero-poster-v2-movil.jpg',
};
