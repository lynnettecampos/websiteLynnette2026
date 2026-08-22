"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { ProjectMenuItem } from "@/components/projects/project-menu";
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon } from "@/components/site/icons";
import { useLocale } from "@/components/site/locale-context";
import type {
  LocalizedValue,
  Project,
  ProjectCategory,
  ProjectDescriptionBlock,
  ProjectDescriptionImageSize,
  ProjectDescriptionMediaLayout,
  ProjectGalleryImage,
  ProjectImageSize,
} from "@/domain/projects";
import { formatProjectTimeline, translateCategoryLabel } from "@/domain/projects";
import { translate, type Locale, type LocaleText } from "@/lib/i18n";

const LABELS = {
  project: { es: "Proyecto", en: "Project" },
  statement: { es: "Sobre la obra", en: "About the work" },
  details: { es: "Ficha técnica", en: "Details" },
  year: { es: "Año", en: "Year" },
  categories: { es: "Tipo", en: "Type" },
  client: { es: "Entidad / contexto", en: "Entity / context" },
  location: { es: "Lugar", en: "Location" },
  images: { es: "Imágenes", en: "Images" },
  video: { es: "Video", en: "Video" },
  play: { es: "Reproducir video", en: "Play video" },
  watchOn: { es: "Ver en", en: "Watch on" },
  credits: { es: "Créditos y colaboraciones", en: "Credits and collaborations" },
  visit: { es: "Visitar sitio", en: "Visit website" },
  previous: { es: "Proyecto anterior", en: "Previous project" },
  next: { es: "Proyecto siguiente", en: "Next project" },
} satisfies Record<string, LocaleText>;

const hasLocaleContent = (value: LocaleText | undefined): boolean =>
  Boolean(value && (value.es.trim().length > 0 || value.en.trim().length > 0));

const translateLocalizedValue = (locale: Locale, value: LocalizedValue): string =>
  typeof value === "string" ? value : value[locale];

const galleryWidth = (index: number): string => {
  const positions = [
    "w-full",
    "w-full lg:ml-auto lg:w-4/5",
    "w-full lg:w-2/3",
    "w-full lg:mx-auto lg:w-5/6",
  ];

  return positions[index % positions.length];
};

const PROJECT_IMAGE_WIDTH: Record<ProjectImageSize, string> = {
  small: "w-full lg:w-1/2",
  medium: "w-full lg:w-4/5",
  large: "w-full",
};

const PROJECT_IMAGE_SIZES: Record<ProjectImageSize, string> = {
  small: "(min-width: 1280px) 576px, (min-width: 1024px) 50vw, calc(100vw - 3rem)",
  medium: "(min-width: 1280px) 922px, (min-width: 1024px) 80vw, calc(100vw - 3rem)",
  large: "(min-width: 1280px) 1152px, calc(100vw - 3rem)",
};

const DESCRIPTION_MEDIA_WIDTH: Record<
  Exclude<ProjectDescriptionMediaLayout, "gallery">,
  string
> = {
  small: "w-full sm:w-1/2 lg:max-w-sm",
  medium: "w-full sm:w-3/4 lg:max-w-xl",
  large: "w-full",
};

const DESCRIPTION_GALLERY_WIDTH: Record<ProjectDescriptionImageSize, string> = {
  small: "col-span-12 sm:col-span-4",
  medium: "col-span-12 sm:col-span-6",
  large: "col-span-12",
};

const DESCRIPTION_GALLERY_SIZES: Record<ProjectDescriptionImageSize, string> = {
  small: "(min-width: 1024px) 18vw, (min-width: 640px) 33vw, calc(100vw - 3rem)",
  medium: "(min-width: 1024px) 28vw, (min-width: 640px) 50vw, calc(100vw - 3rem)",
  large: "(min-width: 1024px) 55vw, calc(100vw - 3rem)",
};

const renderTextWithLinks = (value: string) => {
  const parts = value.split(/(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi);

  return parts.map((part, index) => {
    if (!/^(?:https?:\/\/|www\.)/i.test(part)) {
      return part;
    }

    const linkText = part.replace(/[.,;:!?\])}]+$/, "");
    const trailingPunctuation = part.slice(linkText.length);
    const href = /^www\./i.test(linkText) ? `https://${linkText}` : linkText;

    return (
      <span key={`${linkText}-${index}`}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="border-b border-current/40 outline-none transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:border-[var(--accent)] focus-visible:text-[var(--accent)]"
        >
          {linkText} <ArrowUpRightIcon />
        </a>
        {trailingPunctuation}
      </span>
    );
  });
};

type ProjectNavigation = {
  previous?: ProjectMenuItem;
  next?: ProjectMenuItem;
};

type ProjectDetailProps = {
  project: Project;
  categoryLabels: Record<ProjectCategory, LocaleText>;
  navigation?: ProjectNavigation;
};

function ArtworkImage({
  image,
  priority = false,
  sizes,
}: {
  image: ProjectGalleryImage;
  priority?: boolean;
  sizes: string;
}) {
  const { locale } = useLocale();

  return (
    <figure>
      <Image
        src={image.src}
        alt={translate(locale, image.alt)}
        width={2400}
        height={1600}
        sizes={sizes}
        priority={priority}
        className="h-auto w-full object-contain"
      />
      {hasLocaleContent(image.footnote) ? (
        <figcaption className="mt-2 max-w-3xl font-mono text-[10px] leading-4 text-foreground/60 sm:text-xs">
          {translate(locale, image.footnote!)}
        </figcaption>
      ) : null}
    </figure>
  );
}

function DescriptionMedia({ block }: { block: ProjectDescriptionBlock }) {
  const media = block.media;

  if (!media || media.images.length === 0) {
    return null;
  }

  if (media.layout === "gallery") {
    return (
      <div className="grid grid-cols-12 gap-4">
        {media.images.map((image, index) => {
          const legacySize: ProjectDescriptionImageSize =
            media.images.length % 2 === 1 && index === 0 ? "large" : "medium";
          const size = image.size ?? legacySize;

          return (
            <div key={`${image.src}-${index}`} className={DESCRIPTION_GALLERY_WIDTH[size]}>
              <ArtworkImage image={image} sizes={DESCRIPTION_GALLERY_SIZES[size]} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={DESCRIPTION_MEDIA_WIDTH[media.layout]}>
      <ArtworkImage
        image={media.images[0]}
        sizes={
          media.layout === "small"
            ? "(min-width: 1024px) 22vw, calc(100vw - 3rem)"
            : media.layout === "medium"
              ? "(min-width: 1024px) 38vw, calc(100vw - 3rem)"
              : "(min-width: 1024px) 55vw, calc(100vw - 3rem)"
        }
      />
    </div>
  );
}

export function ProjectDetail({ project, categoryLabels, navigation }: ProjectDetailProps) {
  const { locale } = useLocale();
  const [isVideoActive, setIsVideoActive] = useState(false);

  const detailItems = [
    {
      label: translate(locale, LABELS.year),
      value: formatProjectTimeline(project),
    },
    {
      label: translate(locale, LABELS.categories),
      value: project.categories
        .map((category) => translateCategoryLabel(locale, category, categoryLabels))
        .join(" · "),
    },
    {
      label: translate(locale, LABELS.client),
      value: translateLocalizedValue(locale, project.client),
    },
    {
      label: translate(locale, LABELS.location),
      value: translateLocalizedValue(locale, project.location),
    },
    ...project.meta.map((item) => ({
      label: translate(locale, item.label),
      value: translateLocalizedValue(locale, item.value),
    })),
  ].filter((item) => item.value.trim().length > 0);

  const videoProvider = project.video?.provider === "youtube" ? "YouTube" : "Vimeo";
  const embedUrl = project.video
    ? `${project.video.embedUrl}${project.video.embedUrl.includes("?") ? "&" : "?"}autoplay=1`
    : "";

  return (
    <article className="space-y-20 sm:space-y-28 lg:space-y-36">
      <div className="space-y-10 sm:space-y-12 lg:space-y-16">
        <header className="border-t border-foreground/25 pt-3 sm:pt-4">
          <div className="mb-7 flex items-baseline justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/60 sm:mb-10 sm:text-xs lg:mb-12">
            <span>{translate(locale, LABELS.project)}</span>
            <span>{formatProjectTimeline(project)}</span>
          </div>
          <h1 className="max-w-[18ch] text-balance text-[clamp(2.65rem,7vw,6.75rem)] font-normal leading-[0.9] tracking-[-0.055em]">
            {translate(locale, project.name)}
          </h1>
          {translate(locale, project.subtitle).trim() ? (
            <p className="mt-7 max-w-2xl text-lg leading-snug text-foreground/65 sm:mt-10 sm:text-2xl">
              {translate(locale, project.subtitle)}
            </p>
          ) : null}
        </header>

        <div className={project.cover.size ? PROJECT_IMAGE_WIDTH[project.cover.size] : "w-full"}>
          <ArtworkImage
            image={project.cover}
            priority
            sizes={
              project.cover.size
                ? PROJECT_IMAGE_SIZES[project.cover.size]
                : "(min-width: 1280px) 1152px, calc(100vw - 3rem)"
            }
          />
        </div>
      </div>

      <section
        aria-labelledby="project-statement-title"
        className="grid gap-14 border-t border-foreground/25 pt-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.65fr)] lg:gap-20"
      >
        <div>
          <h2
            id="project-statement-title"
            className="mb-9 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/60 sm:text-xs"
          >
            {translate(locale, LABELS.statement)}
          </h2>
          <div className="max-w-3xl space-y-10 text-lg leading-[1.55] tracking-[-0.015em] sm:text-xl sm:leading-[1.55]">
            {project.description.map((block, index) => (
              <div key={`${project.slug}-paragraph-${index}`} className="space-y-5">
                <p>{renderTextWithLinks(translate(locale, block.text))}</p>
                <DescriptionMedia block={block} />
              </div>
            ))}
          </div>
        </div>

        <aside aria-labelledby="project-details-title" className="lg:border-l lg:border-foreground/25 lg:pl-6">
          <h2
            id="project-details-title"
            className="mb-5 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/60 sm:text-xs"
          >
            {translate(locale, LABELS.details)}
          </h2>
          <dl className="border-t border-foreground/25">
            {detailItems.map((detail) => (
              <div
                key={`${project.slug}-${detail.label}`}
                className="grid grid-cols-[minmax(5.5rem,0.75fr)_minmax(0,1.25fr)] gap-4 border-b border-foreground/25 py-3 text-sm leading-snug"
              >
                <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-foreground/60">
                  {detail.label}
                </dt>
                <dd>{detail.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>

      {project.gallery.length > 0 ? (
        <section aria-labelledby="project-images-title">
          <div className="mb-12 flex items-baseline gap-4 border-t border-foreground/25 pt-3 sm:mb-20">
            <h2
              id="project-images-title"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/60 sm:text-xs"
            >
              {translate(locale, LABELS.images)}
            </h2>
            <span className="font-mono text-[10px] tabular-nums text-foreground/60 sm:text-xs">
              {String(project.gallery.length).padStart(2, "0")}
            </span>
          </div>
          <ol className="space-y-14 sm:space-y-24 lg:space-y-36">
            {project.gallery.map((image, index) => (
              <li
                key={`${project.slug}-gallery-${index}`}
                className={image.size ? PROJECT_IMAGE_WIDTH[image.size] : galleryWidth(index)}
              >
                <ArtworkImage
                  image={image}
                  sizes={
                    image.size
                      ? PROJECT_IMAGE_SIZES[image.size]
                      : index % 4 === 2
                        ? "(min-width: 1024px) 45vw, calc(100vw - 3rem)"
                        : "(min-width: 1280px) 1000px, calc(100vw - 3rem)"
                  }
                />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {project.video ? (
        <section aria-labelledby="project-video-title" className="border-t border-foreground/25 pt-3">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2
              id="project-video-title"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/60 sm:text-xs"
            >
              {translate(locale, LABELS.video)}
            </h2>
            <a
              href={project.video.url}
              target="_blank"
              rel="noreferrer"
              className="border-b border-foreground/40 font-mono text-[10px] uppercase tracking-[0.08em] outline-none transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:border-[var(--accent)] focus-visible:text-[var(--accent)] sm:text-xs"
            >
              {translate(locale, LABELS.watchOn)} {videoProvider} <ArrowUpRightIcon />
            </a>
          </div>
          <div className="relative aspect-video w-full overflow-hidden bg-black text-white">
            {isVideoActive ? (
              <iframe
                src={embedUrl}
                title={translate(locale, project.video.title)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsVideoActive(true)}
                className="group absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden bg-black text-white outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
                aria-label={`${translate(locale, LABELS.play)}: ${translate(locale, project.video.title)}`}
              >
                <Image
                  src={project.cover.src}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 1152px, calc(100vw - 3rem)"
                  className="object-cover opacity-55 transition-opacity duration-200 group-hover:opacity-40"
                />
                <span className="relative z-10 flex h-20 w-20 items-center justify-center border border-white/80 font-mono text-xs uppercase tracking-[0.1em] sm:h-28 sm:w-28">
                  {locale === "es" ? "Ver" : "Play"}
                </span>
              </button>
            )}
          </div>
        </section>
      ) : null}

      {project.entities.length > 0 ? (
        <section aria-labelledby="project-credits-title" className="border-t border-foreground/25 pt-3">
          <h2
            id="project-credits-title"
            className="mb-8 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/60 sm:text-xs"
          >
            {translate(locale, LABELS.credits)}
          </h2>
          <ul>
            {project.entities.map((entity) => (
              <li
                key={`${project.slug}-${entity.slug}`}
                className="grid gap-3 border-t border-foreground/25 py-4 first:border-t-0 sm:grid-cols-[minmax(10rem,0.7fr)_minmax(0,1.3fr)] sm:gap-8"
              >
                <div>
                  {entity.website ? (
                    <a
                      href={entity.website}
                      target="_blank"
                      rel="noreferrer"
                      className="border-b border-foreground/40 text-lg outline-none transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:border-[var(--accent)] focus-visible:text-[var(--accent)]"
                    >
                      {entity.name} <ArrowUpRightIcon />
                      <span className="sr-only"> — {translate(locale, LABELS.visit)}</span>
                    </a>
                  ) : (
                    <p className="text-lg">{entity.name}</p>
                  )}
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground/60">
                    {translate(locale, entity.sector)}
                  </p>
                </div>
                <p className="max-w-xl text-sm leading-relaxed text-foreground/70">
                  {translate(locale, entity.summary)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {navigation?.previous || navigation?.next ? (
        <nav
          aria-label={locale === "es" ? "Navegación entre proyectos" : "Project navigation"}
          className="grid border-y border-foreground/25 sm:grid-cols-2"
        >
          {navigation.previous ? (
            <Link
              href={`/proyectos/${navigation.previous.slug}`}
              className="group border-b border-foreground/25 py-6 outline-none transition-colors hover:text-[var(--accent)] focus-visible:text-[var(--accent)] sm:border-b-0 sm:border-r sm:pr-8"
            >
              <span className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/60 group-hover:text-current group-focus-visible:text-current">
                <ArrowLeftIcon /> {translate(locale, LABELS.previous)}
              </span>
              <span className="block text-xl leading-tight tracking-[-0.025em] sm:text-2xl">
                {translate(locale, navigation.previous.label)}
              </span>
            </Link>
          ) : (
            <span className="hidden sm:block" aria-hidden="true" />
          )}
          {navigation.next ? (
            <Link
              href={`/proyectos/${navigation.next.slug}`}
              className="group py-6 text-left outline-none transition-colors hover:text-[var(--accent)] focus-visible:text-[var(--accent)] sm:pl-8 sm:text-right"
            >
              <span className="mb-3 flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/60 group-hover:text-current group-focus-visible:text-current">
                {translate(locale, LABELS.next)} <ArrowRightIcon />
              </span>
              <span className="block text-xl leading-tight tracking-[-0.025em] sm:text-2xl">
                {translate(locale, navigation.next.label)}
              </span>
            </Link>
          ) : null}
        </nav>
      ) : null}
    </article>
  );
}
