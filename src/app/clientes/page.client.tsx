"use client";

import Image from "next/image";

import type { Client } from "@/content/clients";
import { translate } from "@/lib/i18n";
import { useLocale } from "@/components/site/locale-context";
import type { SiteContent } from "@/domain/site";
import { RichText } from "@/components/site/rich-text";

type ClientsPageClientProps = {
  clients: Client[];
  copy: SiteContent["clientsPage"];
};

const hasLocaleContent = (value: { es: string; en: string } | undefined): boolean => {
  if (!value) {
    return false;
  }

  return value.es.trim().length > 0 || value.en.trim().length > 0;
};

export default function ClientsPageClient({ clients, copy }: ClientsPageClientProps) {
  const { locale } = useLocale();

  return (
    <div className="space-y-10">
      <header className="max-w-3xl space-y-2 sm:space-y-3">
        <RichText
          as="h1"
          value={copy.title}
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        />
        <RichText
          value={copy.copy}
          className="prose prose-sm max-w-none text-foreground/70 sm:prose-base [&_p]:my-0"
        />
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {clients.map((client) => (
          <article
            key={client.slug}
            className="flex flex-col gap-5 rounded-3xl border border-foreground/10 bg-background p-6 shadow-sm"
          >
            {client.image && (
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5">
                <Image
                  src={client.image.src}
                  alt={translate(locale, client.image.alt)}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            )}

            {client.image?.footnote && hasLocaleContent(client.image.footnote) && (
              <p className="text-xs text-foreground/50">
                {translate(locale, client.image.footnote)}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground/90">
                  {client.name}
                </h2>
                <span className="inline-flex items-center rounded-full border border-foreground/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-foreground/50">
                  {translate(locale, client.sector)}
                </span>
              </div>
              <p className="text-sm text-foreground/70">
                {translate(locale, client.summary)}
              </p>
            </div>

            {client.website && (
              <a
                href={client.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-foreground/10 px-4 py-2 text-xs font-semibold text-foreground/70 transition hover:border-foreground/30 hover:text-foreground"
              >
                <span>{translate(locale, copy.websiteLabel)}</span>
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
