"use client";

import Image from "next/image";
import Link from "next/link";

import { useLocale } from "@/components/site/locale-context";
import type { ArtistEvent, ArtistEventType } from "@/domain/artist";
import type { Project } from "@/domain/projects";
import type { SiteContent } from "@/domain/site";
import { translate, type Locale } from "@/lib/i18n";

const EVENT_LABELS: Record<ArtistEventType, { es: string; en: string }> = {
  exhibition: { es: "Exposición", en: "Exhibition" },
  talk: { es: "Charla", en: "Talk" },
  performance: { es: "Performance", en: "Performance" },
  residency: { es: "Residencia", en: "Residency" },
  workshop: { es: "Taller", en: "Workshop" },
  other: { es: "Evento", en: "Event" },
};

const parseDate = (value: string) => new Date(`${value}T12:00:00`);
const dateLocale = (locale: Locale) => (locale === "es" ? "es-MX" : "en-US");

const formatEventDate = (value: string, locale: Locale, year = true) =>
  new Intl.DateTimeFormat(dateLocale(locale), {
    day: "numeric",
    month: "long",
    ...(year ? { year: "numeric" as const } : {}),
  }).format(parseDate(value));

const getCalendarParts = (value: string, locale: Locale) => ({
  day: new Intl.DateTimeFormat(dateLocale(locale), { day: "2-digit" }).format(parseDate(value)),
  month: new Intl.DateTimeFormat(dateLocale(locale), { month: "short" })
    .format(parseDate(value))
    .replace(".", ""),
  year: new Intl.DateTimeFormat(dateLocale(locale), { year: "numeric" }).format(parseDate(value)),
});

type RelatedProject = Pick<Project, "slug" | "name">;

function EventImage({
  event,
  locale,
  compact = false,
}: {
  event: ArtistEvent;
  locale: Locale;
  compact?: boolean;
}) {
  if (!event.image) return null;

  const footnote = event.image.footnote
    ? translate(locale, event.image.footnote).trim()
    : "";

  return (
    <figure className={compact ? "max-w-44" : "max-w-sm"}>
      <Image
        src={event.image.src}
        alt={translate(locale, event.image.alt)}
        width={960}
        height={720}
        sizes={compact ? "11rem" : "(min-width: 1024px) 13rem, 24rem"}
        className="h-auto w-full object-contain"
      />
      {footnote ? (
        <figcaption className="mt-2 font-mono text-[9px] leading-3 text-foreground/55">
          {footnote}
        </figcaption>
      ) : null}
    </figure>
  );
}

function EventActions({
  event,
  relatedProject,
  locale,
  detailsLabel,
}: {
  event: ArtistEvent;
  relatedProject?: RelatedProject;
  locale: Locale;
  detailsLabel: string;
}) {
  if (!relatedProject && !event.url) return null;

  const linkClassName =
    "group inline-flex items-center gap-2 border-b border-foreground/35 pb-0.5 text-xs outline-none transition hover:border-foreground focus-visible:border-foreground";

  return (
    <div className="space-y-2">
      {relatedProject ? (
        <p className="max-w-xs font-mono text-[10px] uppercase leading-4 tracking-[0.14em] text-foreground/60">
          {locale === "es" ? "Proyecto" : "Project"} · {translate(locale, relatedProject.name)}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {relatedProject ? (
          <Link href={`/proyectos/${relatedProject.slug}`} className={linkClassName}>
            {locale === "es" ? "Ver proyecto" : "View project"}
            <span aria-hidden="true">↗</span>
          </Link>
        ) : null}
        {event.url ? (
          <a href={event.url} target="_blank" rel="noreferrer" className={linkClassName}>
            {detailsLabel}
            <span aria-hidden="true">↗</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}

function UpcomingAgenda({
  events,
  projects,
  locale,
  detailsLabel,
}: {
  events: ArtistEvent[];
  projects: RelatedProject[];
  locale: Locale;
  detailsLabel: string;
}) {
  return (
    <ol className="border-t border-foreground/20">
      {events.map((event) => {
        const calendar = getCalendarParts(event.startDate, locale);
        const fullDate = formatEventDate(event.startDate, locale);
        const relatedProject = event.projectSlug
          ? projects.find((project) => project.slug === event.projectSlug)
          : undefined;

        return (
          <li key={event.slug} className="border-b border-foreground/20">
            <article className="grid gap-7 py-8 sm:py-10 md:grid-cols-[8rem_minmax(0,1fr)] lg:grid-cols-[9rem_minmax(0,1fr)_13rem]">
              <time
                dateTime={event.startDate}
                aria-label={fullDate}
                className="flex items-baseline gap-3 md:block"
              >
                <span aria-hidden="true" className="text-5xl leading-none tracking-[-0.06em] sm:text-6xl">
                  {calendar.day}
                </span>
                <span aria-hidden="true" className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/60 md:mt-2 md:block">
                  {calendar.month} · {calendar.year}
                </span>
              </time>

              <div className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/60">
                  {translate(locale, EVENT_LABELS[event.type])}
                </p>
                <h3 className="max-w-3xl text-3xl leading-[1.05] tracking-[-0.035em] sm:text-4xl">
                  {translate(locale, event.title)}
                </h3>
                <p className="text-sm leading-6 text-foreground/65">
                  {[translate(locale, event.venue), translate(locale, event.location)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {event.endDate && event.endDate !== event.startDate ? (
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/60">
                    {locale === "es" ? "Hasta" : "Through"}{" "}
                    <time dateTime={event.endDate}>{formatEventDate(event.endDate, locale)}</time>
                  </p>
                ) : null}
                {event.description ? (
                  <p className="max-w-2xl pt-2 text-sm leading-6 text-foreground/65">
                    {translate(locale, event.description)}
                  </p>
                ) : null}
              </div>

              <div className="space-y-4 md:col-start-2 lg:col-start-3 lg:flex lg:flex-col lg:items-end">
                <EventImage event={event} locale={locale} />
                <EventActions
                  event={event}
                  relatedProject={relatedProject}
                  locale={locale}
                  detailsLabel={detailsLabel}
                />
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}

function EventsArchive({
  events,
  projects,
  locale,
  detailsLabel,
}: {
  events: ArtistEvent[];
  projects: RelatedProject[];
  locale: Locale;
  detailsLabel: string;
}) {
  const eventsByYear = events.reduce<Map<string, ArtistEvent[]>>((groups, event) => {
    const year = event.startDate.slice(0, 4);
    groups.set(year, [...(groups.get(year) ?? []), event]);
    return groups;
  }, new Map());

  return (
    <div className="border-t border-foreground/20">
      {Array.from(eventsByYear.entries()).map(([year, yearEvents]) => (
        <section
          key={year}
          className="grid gap-6 border-b border-foreground/20 py-8 md:grid-cols-[8rem_minmax(0,1fr)] lg:grid-cols-[9rem_minmax(0,1fr)]"
          aria-labelledby={`events-${year}`}
        >
          <h3
            id={`events-${year}`}
            className="text-4xl leading-none tracking-[-0.05em] text-foreground/85 md:sticky md:top-28 md:self-start"
          >
            {year}
          </h3>
          <ol className="divide-y divide-foreground/15 border-t border-foreground/15">
            {yearEvents.map((event) => {
              const relatedProject = event.projectSlug
                ? projects.find((project) => project.slug === event.projectSlug)
                : undefined;

              return (
                <li key={event.slug}>
                  <article className="grid gap-4 py-6 sm:grid-cols-[7rem_minmax(0,1fr)] lg:grid-cols-[7rem_minmax(0,1fr)_11rem]">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/60">
                      <time dateTime={event.startDate}>
                        {formatEventDate(event.startDate, locale, false)}
                      </time>
                      {event.endDate && event.endDate !== event.startDate ? (
                        <>
                          <span aria-hidden="true"> — </span>
                          <span className="sr-only">
                            {locale === "es" ? "hasta" : "through"}{" "}
                          </span>
                          <time dateTime={event.endDate}>
                            {formatEventDate(event.endDate, locale, false)}
                          </time>
                        </>
                      ) : null}
                    </p>
                    <div className="space-y-2">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/60">
                        {translate(locale, EVENT_LABELS[event.type])}
                      </p>
                      <h4 className="text-xl leading-tight tracking-[-0.02em] sm:text-2xl">
                        {translate(locale, event.title)}
                      </h4>
                      <p className="text-sm leading-5 text-foreground/60">
                        {[translate(locale, event.venue), translate(locale, event.location)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {event.description ? (
                        <p className="max-w-2xl pt-1 text-sm leading-6 text-foreground/60">
                          {translate(locale, event.description)}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-4 sm:col-start-2 lg:col-start-3 lg:flex lg:flex-col lg:items-end">
                      <EventImage event={event} locale={locale} compact />
                      <EventActions
                        event={event}
                        relatedProject={relatedProject}
                        locale={locale}
                        detailsLabel={detailsLabel}
                      />
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

export default function EventsPageClient({
  events,
  projects,
  copy,
}: {
  events: ArtistEvent[];
  projects: RelatedProject[];
  copy: SiteContent["eventsPage"];
}) {
  const { locale } = useLocale();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = events
    .filter((event) => parseDate(event.endDate ?? event.startDate) >= today)
    .sort((first, second) => first.startDate.localeCompare(second.startDate));
  const past = events
    .filter((event) => parseDate(event.endDate ?? event.startDate) < today)
    .sort((first, second) => second.startDate.localeCompare(first.startDate));
  const detailsLabel = translate(locale, copy.detailsLabel);

  return (
    <div>
      <header className="grid gap-8 border-b border-foreground/20 pb-8 sm:pb-10 lg:grid-cols-12 lg:items-end">
        <h1 className="text-6xl font-normal leading-[0.85] tracking-[-0.06em] sm:text-8xl lg:col-span-8 lg:text-9xl">
          {translate(locale, copy.title)}
        </h1>
        <div className="space-y-3 lg:col-span-4 lg:pb-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/60">
            {locale === "es" ? "Agenda pública" : "Public programme"} · {events.length}
          </p>
          <p className="max-w-sm text-sm leading-6 text-foreground/60">
            {translate(locale, copy.introduction)}
          </p>
        </div>
      </header>

      <section className="py-12 sm:py-16" aria-labelledby="upcoming-events">
        <div className="mb-7 flex items-baseline justify-between gap-4">
          <h2 id="upcoming-events" className="font-mono text-xs uppercase tracking-[0.2em]">
            {translate(locale, copy.upcomingTitle)}
          </h2>
          <span className="font-mono text-[10px] text-foreground/60" aria-hidden="true">
            {String(upcoming.length).padStart(2, "0")}
          </span>
        </div>
        {upcoming.length > 0 ? (
          <UpcomingAgenda
            events={upcoming}
            projects={projects}
            locale={locale}
            detailsLabel={detailsLabel}
          />
        ) : (
          <p className="border-t border-foreground/20 py-8 text-xl text-foreground/60">
            {translate(locale, copy.emptyUpcoming)}
          </p>
        )}
      </section>

      <section className="border-t border-foreground/20 pt-12 sm:pt-16" aria-labelledby="past-events">
        <div className="mb-7 flex items-baseline justify-between gap-4">
          <h2 id="past-events" className="font-mono text-xs uppercase tracking-[0.2em]">
            {translate(locale, copy.pastTitle)}
          </h2>
          <span className="font-mono text-[10px] text-foreground/60" aria-hidden="true">
            {String(past.length).padStart(2, "0")}
          </span>
        </div>
        {past.length > 0 ? (
          <EventsArchive
            events={past}
            projects={projects}
            locale={locale}
            detailsLabel={detailsLabel}
          />
        ) : (
          <p className="border-t border-foreground/20 py-8 text-xl text-foreground/60">
            {translate(locale, copy.emptyPast)}
          </p>
        )}
      </section>
    </div>
  );
}
