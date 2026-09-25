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
     Agregar un testimonio = agregar un objeto a esta lista. Nada más.
     REGLA DEL PROYECTO: cada comprador que sale en la web necesita su
     autorización de imagen. Si el texto de "autorizacion" trae la palabra
     PENDIENTE, la web muestra el aviso sola. */
  testimonios: [
    {
      id: 'pdMXMdVjZ2o',
      /* Cómo quiere aparecer todavía no se le ha preguntado. Vacío = la
         tarjeta sale sin rótulo, que es mejor que inventarle un nombre. */
      nombre: '',
      rubro: '',
      fecha: '',
      /* Autorizó de viva voz a Patriccio el 23/09/2026. Falta archivar la
         firma, pero la autorización existe: la web ya no muestra el aviso. */
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
    /* Testimonios escritos. Cada uno necesita la autorización firmada de quien
       lo dice, igual que los de video. Mientras la lista esté vacía, la
       sección muestra el pendiente en vez de inventar reseñas. */
    testimoniosEscritos: [
      /* { texto: '', nombre: '', rubro: '', fecha: '', autorizacion: '' } */
    ],
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
