"use client";

import Image from "next/image";

import { useLocale } from "@/components/site/locale-context";
import type { ArtistProfile } from "@/domain/artist";
import type { SiteContent } from "@/domain/site";
import { translate } from "@/lib/i18n";

type BioPageClientProps = {
  profile: ArtistProfile;
  copy: SiteContent["bioPage"];
};

export default function BioPageClient({ profile, copy }: BioPageClientProps) {
  const { locale } = useLocale();
  const introduction = translate(locale, profile.introduction).trim();
  const biography = profile.biography.filter(
    (paragraph) => translate(locale, paragraph).trim().length > 0,
  );
  const statement = profile.statement.filter(
    (paragraph) => translate(locale, paragraph).trim().length > 0,
  );
  const portraitFootnote = profile.portrait?.footnote
    ? translate(locale, profile.portrait.footnote).trim()
    : "";
  const hasEditorialContent = Boolean(
    introduction || biography.length > 0 || statement.length > 0 || profile.portrait || profile.cvUrl,
  );
  const hasTextColumn = Boolean(
    introduction || biography.length > 0 || statement.length > 0 || profile.cvUrl,
  );

  return (
    <article>
      <header className="border-b border-foreground/20 pb-8 sm:pb-12">
        <h1 className="max-w-5xl text-left text-[clamp(2.625rem,6.75vw,6.5625rem)] font-normal leading-[.2] tracking-[-0.055em]">
          {profile.name}
        </h1>
      </header>

      {hasEditorialContent ? (
        <div className="grid gap-10 border-b border-foreground/20 py-12 sm:gap-14 sm:py-16 lg:grid-cols-12 lg:gap-x-12 lg:py-20">
          {profile.portrait ? (
            <figure className="lg:col-span-5">
              <Image
                src={profile.portrait.src}
                alt={translate(locale, profile.portrait.alt)}
                width={900}
                height={1200}
                sizes="(min-width: 1024px) 38vw, calc(100vw - 2rem)"
                className="h-auto w-full object-contain"
                priority
              />
              {portraitFootnote ? (
                <figcaption className="mt-3 max-w-md font-mono text-xs leading-5 text-foreground/60">
                  {portraitFootnote}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          {hasTextColumn ? (
            <div
              className={
                profile.portrait
                  ? "space-y-10 sm:space-y-14 lg:col-span-6 lg:col-start-7"
                  : "space-y-10 sm:space-y-14 lg:col-span-9 lg:col-start-3"
              }
            >
              {introduction ? (
                <section aria-labelledby="bio-introduction">
                  <h2
                    id="bio-introduction"
                    className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-foreground/60"
                  >
                    {locale === "es" ? "En breve" : "In brief"}
                  </h2>
                  <p className="max-w-[34ch] text-pretty text-[clamp(1.75rem,3.4vw,2.8rem)] leading-[1.12] tracking-[-0.03em]">
                    {introduction}
                  </p>
                </section>
              ) : null}

              {biography.length > 0 ? (
                <section
                  aria-labelledby="artist-biography"
                  className={introduction ? "border-t border-foreground/20 pt-10 sm:pt-14" : ""}
                >
                  <h2
                    id="artist-biography"
                    className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-foreground/60"
                  >
                    {locale === "es" ? "Biografía" : "Biography"}
                  </h2>
                  <div className="max-w-[60ch] space-y-5 text-base leading-[1.65] text-foreground/80 sm:text-lg">
                    {biography.map((paragraph, index) => (
                      <p key={`bio-${index}`}>{translate(locale, paragraph)}</p>
                    ))}
                  </div>
                </section>
              ) : null}

              {statement.length > 0 ? (
                <section
                  aria-labelledby="artist-statement"
                  className={
                    introduction || biography.length > 0
                      ? "border-t border-foreground/20 pt-10 sm:pt-14"
                      : ""
                  }
                >
                  <h2
                    id="artist-statement"
                    className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-foreground/60"
                  >
                    {translate(locale, profile.statementTitle)}
                  </h2>
                  <div className="space-y-6">
                    {statement.map((paragraph, index) => (
                      <p
                        key={`statement-${index}`}
                        className={
                          index === 0
                            ? "max-w-[38ch] whitespace-pre-line text-pretty text-[clamp(1.25rem,2vw,1.875rem)] leading-[1.15] tracking-[-0.025em]"
                            : "max-w-[60ch] whitespace-pre-line text-base leading-[1.65] text-foreground/70 sm:text-lg"
                        }
                      >
                        {translate(locale, paragraph)}
                      </p>
                    ))}
                  </div>
                </section>
              ) : null}

              {profile.cvUrl ? (
                <a
                  href={profile.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-3 border-b border-foreground/40 pb-1 text-sm outline-none transition hover:border-foreground focus-visible:border-foreground"
                >
                  {translate(locale, copy.cvLabel)}
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                    ↗
                  </span>
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="max-w-3xl py-16 text-2xl leading-snug tracking-[-0.02em] text-foreground/55 sm:py-24 sm:text-4xl">
          {translate(locale, copy.pending)}
        </p>
      )}
    </article>
  );
}
