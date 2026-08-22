import type { LocaleText } from "@/lib/i18n";

export type NavigationItem = {
  href: string;
  label: LocaleText;
};

export const NAVIGATION: NavigationItem[] = [
  { href: "/", label: { es: "Inicio", en: "Home" } },
  { href: "/bio", label: { es: "Bio", en: "Bio" } },
  { href: "/proyectos", label: { es: "Proyectos", en: "Projects" } },
  { href: "/eventos", label: { es: "Eventos", en: "Events" } },
  { href: "/publicaciones", label: { es: "Publicaciones", en: "Publications" } },
  { href: "/contacto", label: { es: "Contacto", en: "Contact" } },
];
