import type { SiteCopy } from "@/domain/site";
import { SERVICES } from "@/content/services";

export const DEFAULT_SITE_CONTENT: SiteCopy = {
  navigation: {
    brand: { es: "Lynnette Campos", en: "Lynnette Campos" },
    homeLabel: { es: "Inicio", en: "Home" },
    bioLabel: { es: "Bio", en: "Bio" },
    servicesLabel: { es: "Servicios", en: "Services" },
    clientsLabel: { es: "Clientes", en: "Clients" },
    projectsLabel: { es: "PROYECTOS", en: "PROJECTS" },
    eventsLabel: { es: "Exhibiciones", en: "Exhibitions" },
    publicationsLabel: { es: "Publicaciones", en: "Publications" },
    contactLabel: { es: "Contacto", en: "Contact" },
    openMenuLabel: { es: "Abrir menú", en: "Open menu" },
    closeMenuLabel: { es: "Cerrar menú", en: "Close menu" },
  },
  home: {
    heroHeadline: {
      es: "Producción técnica audiovisual y desarrollo de obra con nuevos medios para el sector artístico y cultural.",
      en: "Technical production and new-media execution for the arts and cultural sector.",
    },
    heroSubtitle: {
      es: "monkmonkeykey estudio es un estudio de producción creativa y técnica especializado en obras de arte con nuevos medios, experiencias interactivas y conciertos de música experimental.\n\nTrabajamos con artistas, instituciones culturales y académicas para desarrollar proyectos que integran tecnología, sonido y espacio, desde la concepción técnica hasta la implementación, operación y puesta en funcionamiento.\n\nCon base en la Ciudad de México, colaboramos en proyectos a nivel nacional e internacional, tanto en montajes presenciales como en implementaciones remotas cuando la naturaleza de la obra lo permite.\n\nNuestro enfoque parte del arte, pero se sostiene en la producción: resolver, materializar y hacer que las ideas funcionen en contextos reales.",
      en: "monkmonkeykey estudio is a creative and technical production studio focused on new-media artworks, interactive experiences, and experimental music performances.\n\nWe partner with artists, cultural institutions, and academia to craft projects that merge technology, sound, and space—from technical conception through implementation, operation, and go-live.\n\nBased in Mexico City, we collaborate on projects across Mexico and internationally, on-site when needed or remotely when the work allows.\n\nOur perspective starts from art but is grounded in production: solving, materializing, and making ideas work in real contexts.",
    },
    heroPrimaryCta: { es: "Contáctanos", en: "Book a call" },
    heroSecondaryCta: { es: "Ver proyectos", en: "View work" },
    heroTags: [],
    servicesTitle: { es: "Cómo colaboramos", en: "How we collaborate" },
    servicesCopy: {
      es: "Seleccionamos squads a medida para cada etapa: desde validar oportunidades hasta acelerar productos en producción.",
      en: "We assemble the right squad for every stage—from validating opportunities to accelerating products in production.",
    },
    servicesCta: { es: "Ver todos los servicios", en: "See all services" },
    servicesTags: [
      { es: "Discovery a delivery", en: "Discovery to delivery" },
      { es: "Equipos extendidos", en: "Embedded squads" },
      { es: "Pruebas rápidas", en: "Rapid tests" },
    ],
    servicesBadgeLabel: { es: "Servicios", en: "Services" },
    servicesCardCta: { es: "Ver formato", en: "View format" },
    projectsTitle: { es: "Historias recientes", en: "Recent stories" },
    projectsDescription: {
      es: "Casos recientes donde acompañamos lanzamientos y activaciones clave.",
      en: "Recent cases where we supported key launches and activations.",
    },
    projectsTags: [
      { es: "Museos y universidades", en: "Museums & universities" },
      { es: "Experiencias inmersivas", en: "Immersive experiences" },
      { es: "Producción técnica", en: "Technical production" },
    ],
    projectsBadgeLabel: { es: "Proyectos", en: "Projects" },
    projectsCardCta: { es: "Ver más", en: "View more" },
    projectsImageAlt: {
      es: "Ilustración abstracta de tableros de proyecto",
      en: "Abstract illustration of project boards",
    },
    projectsCta: { es: "Ver proyectos", en: "Browse projects" },
    clientsTitle: { es: "Equipos que confían en nosotros", en: "Teams that trust us" },
    clientsWebsiteLabel: { es: "Abrir sitio", en: "Open site" },
    contactCta: { es: "Agenda una llamada", en: "Book a call" },
  },
  servicesPage: {
    title: { es: "Servicios y formatos de trabajo", en: "Services and collaboration formats" },
    copy: {
      es: "Cada engagement se adapta al momento de tu producto. Podemos sumarnos como task force temporal, equipo extendido o líderes de práctica.",
      en: "Each engagement adapts to your product stage. We can join as a temporary task force, extended team, or practice leads.",
    },
    ctaLabel: { es: "Agenda una llamada", en: "Book a call" },
    chips: [
      { es: "Discovery a ejecución", en: "Discovery to delivery" },
      { es: "Equipos extendidos", en: "Extended squads" },
      { es: "Pruebas rápidas", en: "Rapid experiments" },
    ],
    outcomesLabel: { es: "Entregables principales", en: "Key deliverables" },
    quickMapLabel: { es: "Mapa rápido", en: "Quick map" },
    highlightPrimaryLabel: { es: "Inicio en 2-3 semanas", en: "Kick off in 2-3 weeks" },
    highlightSecondaryLabel: { es: "Equipo dedicado", en: "Dedicated squad" },
    sessionTitle: { es: "Sesión inicial", en: "Kick-off session" },
    sessionCopy: {
      es: "Alineamos objetivos, métricas y responsables",
      en: "Align on goals, metrics, and owners",
    },
    talkCtaLabel: { es: "Hablar con el equipo", en: "Talk with the team" },
    backToTopLabel: { es: "Volver arriba", en: "Back to top" },
    imageSrc: "/images/services-visual.svg",
    imageAlt: { es: "Ilustración de servicio", en: "Service illustration" },
    gallery: [
      {
        src: "/images/services-visual.svg",
        alt: { es: "Ilustración de producción técnica", en: "Technical production illustration" },
      },
      {
        src: "/images/clients-visual.svg",
        alt: { es: "Ilustración de colaboración", en: "Collaboration illustration" },
      },
      {
        src: "/images/contact-visual.svg",
        alt: { es: "Ilustración de operación en sitio", en: "On-site operation illustration" },
      },
    ],
  },
  projectsPage: {
    title: { es: "Proyectos / Obra", en: "Projects / Artwork" },
    copy: {
      es: "Archivo de obras, procesos y colaboraciones artísticas.",
      en: "An archive of artworks, processes, and artistic collaborations.",
    },
    filterAllLabel: { es: "Todos", en: "All" },
    emptyState: {
      es: "No hay proyectos para esta categoría todavía.",
      en: "There are no projects for this category yet.",
    },
    cardCta: { es: "Ver proyecto", en: "View project" },
    ctaTitle: { es: "Información y colaboraciones", en: "Information and collaborations" },
    ctaDescription: {
      es: "Para información adicional sobre una obra, exposición o posible colaboración, escribe desde la página de contacto.",
      en: "For more information about a work, exhibition, or possible collaboration, use the contact page.",
    },
    ctaAction: { es: "Contacto", en: "Contact" },
  },
  bioPage: {
    title: { es: "Bio", en: "Bio" },
    pending: {
      es: "Mi trabajo hace referencia constante a los primeros contactos que tuve con la ilustración gráfica. Allí afirmé mi gusto por la expansión del texto hacia su representación visual, partiendo de ahí para crear nuevas obras.",
      en: "Mi trabajo hace referencia constante a los primeros contactos que tuve con la ilustración gráfica. Allí afirmé mi gusto por la expansión del texto hacia su representación visual, partiendo de ahí para crear nuevas obras.",
    },
    cvLabel: { es: "Descargar CV", en: "Download CV" },
  },
  eventsPage: {
    title: { es: "Exhibiciones", en: "Exhibitions" },
    introduction: {
      es: "Exposiciones, charlas, performances y otras presentaciones públicas.",
      en: "Exhibitions, talks, performances, and other public presentations.",
    },
    upcomingTitle: { es: "Próximos", en: "Upcoming" },
    pastTitle: { es: "Archivo", en: "Archive" },
    emptyUpcoming: {
      es: "No hay próximos eventos publicados.",
      en: "There are no upcoming events published.",
    },
    emptyPast: {
      es: "El archivo de eventos se publicará próximamente.",
      en: "The events archive will be published soon.",
    },
    detailsLabel: { es: "Más información", en: "More information" },
  },
  publicationsPage: {
    title: { es: "Publicaciones", en: "Publications" },
    introduction: {
      es: "Textos, catálogos, entrevistas y publicaciones relacionadas con la práctica de la artista.",
      en: "Texts, catalogues, interviews, and publications related to the artist’s practice.",
    },
    empty: {
      es: "Las publicaciones se incorporarán próximamente.",
      en: "Publications will be added soon.",
    },
    openLabel: { es: "Abrir publicación", en: "Open publication" },
    downloadLabel: { es: "Ver documento", en: "View document" },
  },
  clientsPage: {
    title: { es: "Clientes y aliados", en: "Clients and partners" },
    copy: {
      es: "Co-diseñamos soluciones junto a startups, scaleups y corporativos que buscan acelerar la entrega de valor.",
      en: "We co-design solutions with startups, scaleups, and enterprises that need to accelerate value delivery.",
    },
    imageSrc: "/images/clients-visual.svg",
    imageAlt: {
      es: "Ilustración abstracta de conexiones con clientes",
      en: "Abstract illustration of client connections",
    },
    websiteLabel: { es: "Visitar sitio", en: "Visit site" },
  },
  contact: {
    title: { es: "Contacto", en: "Contact" },
    copy: {
      es: "Para invitaciones, exposiciones, publicaciones y colaboraciones, puedes escribir mediante este formulario.",
      en: "For invitations, exhibitions, publications, and collaborations, use this form to get in touch.",
    },
    email: "lynnettecoraje@gmail.com",
    preparation: [
      { es: "Contexto del producto y objetivos de negocio.", en: "Product context and business goals." },
      { es: "Estado actual del equipo y métricas disponibles.", en: "Current team setup and available metrics." },
      { es: "Hipótesis a validar y próximos hitos.", en: "Hypotheses to validate and upcoming milestones." },
    ],
    bookCallTitle: { es: "Agenda una llamada", en: "Book a call" },
    bookCallCopy: {
      es: "Compartiremos disponibilidad en menos de 24 horas hábiles.",
      en: "We will share our availability within 24 business hours.",
    },
    bookCallCta: { es: "Escríbenos", en: "Write to us" },
    preparationTitle: { es: "Qué preparamos", en: "What we prepare" },
    formTitle: { es: "Escríbenos", en: "Send a message" },
    formSubtitle: { es: "", en: "" },
    successLabel: { es: "Enviado", en: "Sent" },
    nameLabel: { es: "Nombre", en: "Name" },
    emailLabel: { es: "Correo", en: "Email" },
    organizationLabel: { es: "Organización", en: "Organization" },
    phoneLabel: { es: "Teléfono", en: "Phone" },
    subjectLabel: { es: "Asunto", en: "Subject" },
    messageLabel: { es: "Mensaje", en: "Message" },
    submitLabel: { es: "Enviar mensaje", en: "Send message" },
    sendingLabel: { es: "Enviando...", en: "Sending..." },
    moreContactTitle: { es: "Más formas de contacto", en: "More ways to reach us" },
    moreContactLabel: { es: "Correo", en: "Email" },
    moreContactNote: {
      es: "Prefieres agendar? También puedes escribirnos para compartir detalles y coordinar una llamada.",
      en: "Prefer to schedule? Share details here and we’ll coordinate a call.",
    },
    imageSrc: "/images/contact-visual.svg",
    imageAlt: {
      es: "Ilustración abstracta de una reunión de trabajo",
      en: "Abstract illustration of a working session",
    },
  },
  footer: {
    tagline: {
      es: "Artista.",
      en: "Artist.",
    },
    adminLabel: { es: "Administrar sitio", en: "Manage site" },
    instagramLabel: { es: "Instagram · @lynnettecoraje", en: "Instagram · @lynnettecoraje" },
    instagramUrl: "https://www.instagram.com/monkmokeykey_studio/",
    facebookLabel: { es: "Facebook", en: "Facebook" },
    facebookUrl: "",
    linkedinLabel: { es: "LinkedIn", en: "LinkedIn" },
    linkedinUrl: "",
  },
  services: SERVICES,
};
