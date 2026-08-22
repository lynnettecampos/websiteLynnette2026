import type { ArtistEvent, ArtistProfile, Publication } from "@/domain/artist";
import type { SiteContent } from "@/domain/site";
import type { LocaleText } from "@/lib/i18n";

export const ARTIST_PROFILE: ArtistProfile = {
  name: "Lynnette Campos",
  role: { es: "Artista", en: "Artist" },
  introduction: { es: "", en: "" },
  biography: [],
  statementTitle: { es: "Práctica", en: "Practice" },
  statement: [],
};

// These collections intentionally start empty. They are the local-content fallback
// and can be populated without changing the public pages.
export const ARTIST_EVENTS: ArtistEvent[] = [];

export const PUBLICATIONS: Publication[] = [];

export const PROJECTS_PAGE_COPY: SiteContent["projectsPage"] = {
  title: { es: "Proyectos", en: "Projects" },
  copy: {
    es: "Archivo de obras, procesos y colaboraciones artísticas.",
    en: "An archive of artworks, processes, and artistic collaborations.",
  },
  filterAllLabel: { es: "Todos", en: "All" },
  emptyState: {
    es: "No hay proyectos publicados en esta categoría.",
    en: "There are no published projects in this category.",
  },
  cardCta: { es: "Ver proyecto", en: "View project" },
  ctaTitle: { es: "Información y colaboraciones", en: "Information and collaborations" },
  ctaDescription: {
    es: "Para información adicional sobre una obra, exposición o posible colaboración, escribe desde la página de contacto.",
    en: "For more information about a work, exhibition, or possible collaboration, use the contact page.",
  },
  ctaAction: { es: "Contacto", en: "Contact" },
};

export type ArtistContactCopy = {
  title: LocaleText;
  introduction: LocaleText;
  formTitle: LocaleText;
  successLabel: LocaleText;
  nameLabel: LocaleText;
  emailLabel: LocaleText;
  subjectLabel: LocaleText;
  messageLabel: LocaleText;
  submitLabel: LocaleText;
  sendingLabel: LocaleText;
};

export const CONTACT_COPY: ArtistContactCopy = {
  title: { es: "Contacto", en: "Contact" },
  introduction: {
    es: "Para invitaciones, exposiciones, publicaciones y colaboraciones, puedes escribir mediante este formulario.",
    en: "For invitations, exhibitions, publications, and collaborations, use this form to get in touch.",
  },
  formTitle: { es: "Mensaje", en: "Message" },
  successLabel: { es: "Enviado", en: "Sent" },
  nameLabel: { es: "Nombre", en: "Name" },
  emailLabel: { es: "Correo", en: "Email" },
  subjectLabel: { es: "Asunto", en: "Subject" },
  messageLabel: { es: "Mensaje", en: "Message" },
  submitLabel: { es: "Enviar", en: "Send" },
  sendingLabel: { es: "Enviando…", en: "Sending…" },
};

export const BIO_COPY = {
  title: { es: "Bio", en: "Bio" },
  pending: {
    es: "La biografía y el statement de la artista se publicarán próximamente.",
    en: "The artist biography and statement will be published soon.",
  },
  cvLabel: { es: "Descargar CV", en: "Download CV" },
} as const;

export const EVENTS_COPY = {
  title: { es: "Eventos", en: "Events" },
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
} as const;

export const PUBLICATIONS_COPY = {
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
  downloadLabel: { es: "Descargar", en: "Download" },
} as const;
