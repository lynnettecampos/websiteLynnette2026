import type { LocaleText } from "@/lib/i18n";

export type ServiceGalleryImage = {
  src: string;
  alt: LocaleText;
};

export type Service = {
  slug: string;
  title: LocaleText;
  summary: LocaleText;
  outcomes: LocaleText[];
  gallery?: ServiceGalleryImage[];
};

export const SERVICES: Service[] = [
  {
    slug: "estrategia-producto",
    title: {
      es: "Producción de Arte Digital",
      en: "Product strategy",
    },
    summary: {
      es: "Desarrollo y materialización de obras digitales. Abarcamos desde la conceptualización visual hasta la ejecución técnica, creando piezas que integran nuevas tecnologías y estéticas contemporáneas.",
      en: "We design actionable roadmaps aligned with business goals.",
    },
    outcomes: [
      {
        es: "Audio Espacial y Producción Multicanal",
        en: "Opportunity assessment and initiative prioritisation",
      },
      {
        es: "Definición de métricas de impacto y governance",
        en: "Impact metrics and governance definition",
      },
      {
        es: "Roadmaps trimestrales con entregables claros",
        en: "Quarterly roadmaps with clear deliverables",
      },
    ],
    gallery: [
      {
        src: "/projects/atlas-experience-lab/cover.svg",
        alt: {
          es: "Montaje principal de obra digital",
          en: "Main digital artwork setup",
        },
      },
      {
        src: "/projects/atlas-experience-lab/gallery-1.svg",
        alt: {
          es: "Detalle técnico de instalación",
          en: "Technical installation detail",
        },
      },
      {
        src: "/projects/atlas-experience-lab/gallery-2.svg",
        alt: {
          es: "Espacio expositivo con visuales",
          en: "Exhibition space with visuals",
        },
      },
    ],
  },
  {
    slug: "diseno-ux-ui",
    title: {
      es: "Audio Espacial y Producción Multicanal",
      en: "UX/UI design",
    },
    summary: {
      es: "Diseño sonoro y producción técnica especializada para conciertos de música experimental y electroacústica. Gestionamos sistemas de audio inmersivo y difusión multicanal para crear experiencias auditivas envolventes.",
      en: "We craft accessible experiences grounded in user research.",
    },
    outcomes: [
      {
        es: "Investigación cualitativa y cuantitativa",
        en: "Qualitative and quantitative research",
      },
      {
        es: "Sistemas de diseño reutilizables",
        en: "Reusable design systems",
      },
      {
        es: "Prototipos testeados antes del desarrollo",
        en: "Tested prototypes before development",
      },
    ],
    gallery: [
      {
        src: "/projects/museo-banco-mexico/cover.svg",
        alt: {
          es: "Escenario sonoro en museo",
          en: "Museum sound stage",
        },
      },
      {
        src: "/projects/museo-banco-mexico/gallery-1.svg",
        alt: {
          es: "Sistema de audio multicanal",
          en: "Multichannel audio system",
        },
      },
      {
        src: "/projects/museo-banco-mexico/gallery-3.svg",
        alt: {
          es: "Ajustes técnicos en sala",
          en: "Technical adjustments onsite",
        },
      },
    ],
  },
  {
    slug: "experimentacion-growth",
    title: {
      es: "Taller de Impresión 3D y Fabricación",
      en: "Experimentation & growth",
    },
    summary: {
      es: "Soluciones de materialización física. Ofrecemos servicios de impresión 3D para prototipado, creación de piezas artísticas y modelado, llevando tus ideas del plano digital al objeto tangible.",
      en: "We validate hypotheses with rapid experiments and continuous measurement.",
    },
    outcomes: [
      {
        es: "Diseño e implementación de experimentos A/B",
        en: "Design and implementation of A/B tests",
      },
      {
        es: "Laboratorios de discovery continuo",
        en: "Continuous discovery labs",
      },
      {
        es: "Optimización recurrente de funnel y retención",
        en: "Recurring funnel and retention optimisation",
      },
    ],
    gallery: [
      {
        src: "/projects/loop-brand-labs/cover.svg",
        alt: {
          es: "Prototipo físico impreso en 3D",
          en: "3D printed physical prototype",
        },
      },
      {
        src: "/projects/loop-brand-labs/gallery-1.svg",
        alt: {
          es: "Piezas impresas para obra",
          en: "Printed pieces for artwork",
        },
      },
      {
        src: "/projects/loop-brand-labs/gallery-2.svg",
        alt: {
          es: "Iteración de modelos en taller",
          en: "Workshop model iterations",
        },
      },
    ],
  },
];
