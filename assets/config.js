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
     autorización de imagen firmada. El video ya es público en el canal,
     pero la firma sigue pendiente. */
  testimonios: [
    {
      id: 'pdMXMdVjZ2o',
      nombre: '[PENDIENTE: nombre del comprador]',
      rubro: '[PENDIENTE: rubro]',
      fecha: '[PENDIENTE: fecha de grabación]',
      autorizacion: '[PENDIENTE: autorización de imagen firmada para la web]',
    },
  ],

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

  /* ---- 5 · Video del hero ------------------------------------------------- */
  video: 'assets/hero-scrub.mp4',
  videoLigero: 'assets/hero-scrub-lite.mp4',   // conexiones lentas y ahorro de datos
  videoBytes: 8445931,                          // respaldo cuando falta Content-Length
  videoLigeroBytes: 3034868,
};
