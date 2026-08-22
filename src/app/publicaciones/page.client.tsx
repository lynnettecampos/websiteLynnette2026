"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useLocale } from "@/components/site/locale-context";
import type { Publication, PublicationType } from "@/domain/artist";
import type { Project } from "@/domain/projects";
import type { SiteContent } from "@/domain/site";
import { translate } from "@/lib/i18n";

const PUBLICATION_LABELS: Record<PublicationType, { es: string; en: string }> = {
  "artist-text": { es: "Texto de artista", en: "Artist text" },
  catalogue: { es: "Catálogo", en: "Catalogue" },
  interview: { es: "Entrevista", en: "Interview" },
  press: { es: "Prensa", en: "Press" },
  academic: { es: "Publicación académica", en: "Academic publication" },
  other: { es: "Publicación", en: "Publication" },
};

const publicationYear = (publication: Publication) => publication.publishedAt.slice(0, 4);

function Cover({ publication, priority = false }: { publication: Publication; priority?: boolean }) {
  const { locale } = useLocale();

  if (!publication.cover) {
    return (
      <div className="flex aspect-[4/5] w-full flex-col justify-between border border-foreground/20 p-4 text-foreground/60">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
          {translate(locale, PUBLICATION_LABELS[publication.type])}
        </span>
        <span className="text-5xl tracking-[-0.05em]">{publicationYear(publication)}</span>
      </div>
    );
  }

  const footnote = publication.cover.footnote
    ? translate(locale, publication.cover.footnote).trim()
    : "";

  return (
    <figure>
      <Image
        src={publication.cover.src}
        alt={translate(locale, publication.cover.alt)}
        width={720}
        height={900}
        sizes="(min-width: 1024px) 30vw, 40vw"
        className="aspect-[4/5] w-full object-cover"
        priority={priority}
      />
      {footnote ? (
        <figcaption className="mt-2 font-mono text-[9px] leading-3 text-foreground/55 sm:text-[10px] sm:leading-4">
          {footnote}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default function PublicationsPageClient({
  publications,
  projects,
  copy,
}: {
  publications: Publication[];
  projects: Pick<Project, "slug" | "name">[];
  copy: SiteContent["publicationsPage"];
}) {
  const { locale } = useLocale();
  const orderedPublications = [...publications].sort((first, second) =>
    second.publishedAt.localeCompare(first.publishedAt),
  );
  const [activeSlug, setActiveSlug] = useState(orderedPublications[0]?.slug ?? "");
  const activePublication =
    orderedPublications.find((publication) => publication.slug === activeSlug) ??
    orderedPublications[0];
  const configuredDocumentLabel = translate(locale, copy.downloadLabel).trim();
  const documentLabel = ["descargar", "download"].includes(configuredDocumentLabel.toLowerCase())
    ? locale === "es"
      ? "Ver documento"
      : "View document"
    : configuredDocumentLabel;

  return (
    <div>
      <header className="grid gap-8 border-b border-foreground/20 pb-8 sm:pb-10 lg:grid-cols-12 lg:items-end">
        <h1 className="text-[clamp(3.25rem,8.8vw,8.2rem)] font-normal leading-[0.83] tracking-[-0.065em] lg:col-span-9">
          {translate(locale, copy.title)}
        </h1>
        <div className="space-y-3 lg:col-span-3 lg:pb-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/60">
            {locale === "es" ? "Índice bibliográfico" : "Bibliographic index"} · {publications.length}
          </p>
          <p className="max-w-sm text-sm leading-6 text-foreground/60">
            {translate(locale, copy.introduction)}
          </p>
        </div>
      </header>

      {orderedPublications.length > 0 && activePublication ? (
        <div className="grid gap-12 py-12 sm:py-16 lg:grid-cols-12 lg:gap-8">
          <aside className="hidden lg:col-span-4 lg:block" aria-label={locale === "es" ? "Portada seleccionada" : "Selected cover"}>
            <div className="sticky top-28">
              <Cover publication={activePublication} priority />
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/60">
                <span className="truncate">{translate(locale, activePublication.title)}</span>
                <time dateTime={activePublication.publishedAt}>
                  {publicationYear(activePublication)}
                </time>
              </div>
            </div>
          </aside>

          <ol className="border-t border-foreground/20 lg:col-span-8 lg:col-start-5">
            {orderedPublications.map((publication, index) => {
              const isActive = publication.slug === activePublication.slug;
              const relatedProject = publication.projectSlug
                ? projects.find((project) => project.slug === publication.projectSlug)
                : undefined;

              return (
                <li key={publication.slug} className="border-b border-foreground/20">
                  <article
                    className={`grid gap-5 py-7 transition-colors sm:grid-cols-[3rem_minmax(0,1fr)] lg:py-8 ${
                      isActive ? "text-foreground" : "text-foreground/72"
                    }`}
                    onPointerEnter={() => setActiveSlug(publication.slug)}
                    onFocusCapture={() => setActiveSlug(publication.slug)}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveSlug(publication.slug)}
                      className="self-start font-mono text-[10px] text-foreground/60 outline-none transition hover:text-foreground focus-visible:text-foreground"
                      aria-label={`${locale === "es" ? "Mostrar portada de" : "Show cover for"} ${translate(locale, publication.title)}`}
                      aria-pressed={isActive}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </button>

                    <div className="space-y-5">
                      <div className="w-28 sm:w-36 lg:hidden">
                        <Cover publication={publication} priority={index === 0} />
                      </div>

                      <div className="space-y-2">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/60">
                          {translate(locale, PUBLICATION_LABELS[publication.type])}
                        </p>
                        <h2 className="max-w-2xl text-2xl leading-[1.08] tracking-[-0.03em] sm:text-3xl">
                          {translate(locale, publication.title)}
                        </h2>
                        <p className="text-sm leading-6 text-foreground/60">
                          {translate(locale, publication.publisher)}
                          <span aria-hidden="true"> · </span>
                          <time dateTime={publication.publishedAt}>{publicationYear(publication)}</time>
                        </p>
                      </div>

                      {publication.summary ? (
                        <p className="max-w-2xl text-sm leading-6 text-foreground/60">
                          {translate(locale, publication.summary)}
                        </p>
                      ) : null}

                      {(publication.url || publication.downloadUrl || relatedProject) && (
                        <div className="space-y-2 pt-1 text-xs">
                          {relatedProject ? (
                            <p className="font-mono text-[10px] uppercase leading-4 tracking-[0.14em] text-foreground/60">
                              {locale === "es" ? "Proyecto" : "Project"} · {translate(locale, relatedProject.name)}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap gap-x-5 gap-y-2">
                            {relatedProject ? (
                              <Link
                                href={`/proyectos/${relatedProject.slug}`}
                                className="inline-flex items-center gap-2 border-b border-foreground/35 pb-0.5 outline-none transition hover:border-foreground focus-visible:border-foreground"
                              >
                                {locale === "es" ? "Ver proyecto" : "View project"}
                                <span aria-hidden="true">↗</span>
                              </Link>
                            ) : null}
                            {publication.url ? (
                              <a
                                href={publication.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 border-b border-foreground/35 pb-0.5 outline-none transition hover:border-foreground focus-visible:border-foreground"
                              >
                                {translate(locale, copy.openLabel)}
                                <span aria-hidden="true">↗</span>
                              </a>
                            ) : null}
                            {publication.downloadUrl ? (
                              <a
                                href={publication.downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 border-b border-foreground/35 pb-0.5 outline-none transition hover:border-foreground focus-visible:border-foreground"
                              >
                                {documentLabel}
                                <span aria-hidden="true">↗</span>
                              </a>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <p className="max-w-3xl py-16 text-2xl leading-snug tracking-[-0.02em] text-foreground/60 sm:py-24 sm:text-4xl">
          {translate(locale, copy.empty)}
        </p>
      )}
    </div>
  );
}
