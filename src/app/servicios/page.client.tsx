"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Service } from "@/content/services";
import type { SiteContent } from "@/domain/site";
import { translate } from "@/lib/i18n";
import { useLocale } from "@/components/site/locale-context";
import { getPlainText, RichText } from "@/components/site/rich-text";

type ServicesPageClientProps = {
  services: Service[];
  siteContent: SiteContent;
};

export default function ServicesPageClient({ services, siteContent }: ServicesPageClientProps) {
  const { locale } = useLocale();
  const chips = (siteContent.servicesPage.chips || []).filter(
    (chip) => getPlainText(translate(locale, chip)).length > 0,
  );
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  const activeService = services[activeServiceIndex] ?? services[0];
  const deliverablesLabel = locale === "es" ? "Nuestros servicios" : "Deliverables";
  const deliverableDotStyles = ["bg-sky-400", "bg-violet-400", "bg-emerald-400", "bg-amber-400"];
  const galleryImages = useMemo(() => {
    const fromService = (activeService?.gallery ?? []).filter((image) => image.src.trim().length > 0);

    if (fromService.length > 0) {
      return fromService;
    }

    return [
      {
        src: siteContent.servicesPage.imageSrc || "/images/services-visual.svg",
        alt: siteContent.servicesPage.imageAlt,
      },
    ];
  }, [activeService?.gallery, siteContent.servicesPage.imageAlt, siteContent.servicesPage.imageSrc]);


  useEffect(() => {
    if (galleryImages.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveGalleryIndex((previousIndex) => (previousIndex + 1) % galleryImages.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [galleryImages.length]);

  const normalizedGalleryIndex = galleryImages.length > 0 ? activeGalleryIndex % galleryImages.length : 0;

  return (
    <div className="space-y-12" id="top">
      <header className="max-w-3xl space-y-2 sm:space-y-3">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          <RichText as="span" value={siteContent.servicesPage.title} />
        </h1>
        <RichText
          value={siteContent.servicesPage.copy}
          className="prose prose-sm max-w-none text-foreground/70 sm:prose-base [&_p]:my-0"
        />
        <div className="flex flex-wrap gap-3 pt-1 text-sm text-foreground/70">
          {chips.map((chip, index) => (
            <div
              key={`${chip.es}-${index}`}
              className="inline-flex items-center gap-2 rounded-full bg-background/60 px-3 py-2 ring-1 ring-foreground/10"
            >
              <span className="size-2 rounded-full" />
              <RichText as="span" value={chip} />
            </div>
          ))}
        </div>
      </header>

      <section className="rounded-3xl border border-foreground/10 bg-background p-5 shadow-sm sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
          <div className="order-1 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/50">
                <RichText as="span" value={siteContent.servicesPage.outcomesLabel} />
              </p>
              <a
                href="#top"
                className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60 transition hover:text-foreground sm:inline-flex sm:items-center sm:gap-2"
              >
                <RichText as="span" value={siteContent.servicesPage.backToTopLabel} />
              </a>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {services.map((service, index) => (
                <button
                  key={service.slug}
                  type="button"
                  onClick={() => {
                    setActiveServiceIndex(index);
                    setActiveGalleryIndex(0);
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition sm:py-4 ${
                    index === activeServiceIndex
                      ? "border-primary/50 bg-primary/10"
                      : "border-foreground/10 bg-foreground/5 hover:border-foreground/25"
                  }`}
                >
                  <p className="text-base font-semibold tracking-tight text-foreground/90 sm:text-lg">
                    <RichText as="span" value={service.title} />
                  </p>
                  <p className="mt-1.5 text-sm text-foreground/70 sm:mt-2">
                    <RichText as="span" value={service.summary} />
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="order-2 space-y-4 lg:sticky lg:top-24 lg:self-start">
            {activeService && (
              <div className="space-y-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
                <div className="space-y-2 text-sm text-foreground/70">
                  <div className="flex items-start justify-between gap-3">
                    <RichText
                      as="p"
                      value={siteContent.servicesPage.sessionTitle}
                      className="font-semibold text-foreground"
                    />
                    <Link
                      href="/contacto"
                      className="inline-flex shrink-0 items-center rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/15 hover:text-primary/90"
                    >
                      <RichText as="span" value={siteContent.servicesPage.talkCtaLabel} />
                    </Link>
                  </div>
                  <RichText as="p" value={siteContent.servicesPage.sessionCopy} />
                  <a
                    href="#top"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60 transition hover:text-foreground sm:hidden"
                  >
                    <RichText as="span" value={siteContent.servicesPage.backToTopLabel} />
                  </a>
                </div>

                <div className="space-y-2.5">
                  <p className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/90">
                    <span className="size-1. rounded-full bg-primary" aria-hidden />
                    {deliverablesLabel}
                  </p>

                  {(activeService.outcomes || []).map((outcome, outcomeIndex) => (
                    <div
                      key={`${activeService.slug}-outcome-${outcomeIndex}`}
                      className="flex items-start gap-2.5 rounded-xl border border-foreground/10 bg-background/90 px-3 py-2.5 text-sm text-foreground/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                    >
                      <span
                        className={`mt-2 size-2.5 shrink-0 rounded-full ${deliverableDotStyles[outcomeIndex % deliverableDotStyles.length]}`}
                        aria-hidden
                      />
                      <span className="leading-relaxed">{translate(locale, outcome)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/5">
              {galleryImages.map((image, index) => (
                <Image
                  key={`${activeService?.slug ?? "service"}-${image.src}-${index}`}
                  src={image.src}
                  alt={getPlainText(translate(locale, image.alt))}
                  fill
                  className={`object-cover transition-opacity duration-700 ${
                    index === normalizedGalleryIndex ? "opacity-100" : "opacity-0"
                  }`}
                  priority={index === normalizedGalleryIndex}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
