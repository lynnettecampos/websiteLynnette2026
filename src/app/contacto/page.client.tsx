"use client";

import { useState, type FormEvent } from "react";

import { ArrowRightIcon, ArrowUpRightIcon, CheckIcon } from "@/components/site/icons";
import { useLocale } from "@/components/site/locale-context";
import { getPlainText, RichText } from "@/components/site/rich-text";
import type { SiteContent } from "@/domain/site";
import { translate, type LocaleText } from "@/lib/i18n";

export type ContactSocialLink = {
  label: LocaleText;
  url: string;
};

type ContactPageClientProps = {
  copy: SiteContent["contact"];
  socialLinks: ContactSocialLink[];
};

const fieldClassName =
  "w-full border-0 border-b border-foreground/30 bg-transparent px-0 py-3 text-base text-foreground outline-none transition placeholder:text-foreground/60 hover:border-foreground/55 focus:border-foreground";

export default function ContactPageClient({
  copy,
  socialLinks,
}: ContactPageClientProps) {
  const { locale } = useLocale();
  const formSubtitle = translate(locale, copy.formSubtitle).trim();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          errorBody && typeof errorBody.error === "string"
            ? errorBody.error
            : "Failed to send message";
        throw new Error(message);
      }

      setStatus("success");
      setFormData({
        name: "",
        email: "",
        organization: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (submissionError) {
      console.error(submissionError);
      const message = submissionError instanceof Error ? submissionError.message : null;
      setError(
        message && message !== "Failed to send message"
          ? message
          : locale === "es"
            ? "No pudimos enviar tu mensaje. Intenta de nuevo."
            : "We couldn't send your message. Please try again.",
      );
      setStatus("error");
    }
  };

  return (
    <div>
      <header className="grid gap-8 border-b border-foreground/20 pb-8 sm:pb-10 lg:grid-cols-12 lg:items-end">
        <RichText
          as="h1"
          value={copy.title}
          className="text-[clamp(3.75rem,10vw,9rem)] font-normal leading-[0.8] tracking-[-0.07em] lg:col-span-8"
        />
        <RichText
          value={copy.copy}
          className="max-w-sm text-sm leading-6 text-foreground/60 [&_p]:my-0 lg:col-span-4 lg:pb-1"
        />
      </header>

      <section className="border-b border-foreground/20 py-12 sm:py-20" aria-labelledby="direct-contact">
        <h2
          id="direct-contact"
          className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/60"
        >
          {locale === "es" ? "Correo directo" : "Direct email"}
        </h2>
        <a
          href={`mailto:${copy.email}`}
          className="inline border-b border-foreground/35 text-[clamp(2rem,7.25vw,6.5rem)] leading-[1.02] tracking-[-0.055em] outline-none transition [overflow-wrap:anywhere] hover:border-foreground focus-visible:border-foreground"
        >
          {copy.email}
        </a>

        {socialLinks.length > 0 ? (
          <nav className="mt-10" aria-label={locale === "es" ? "Redes sociales" : "Social media"}>
            <ul className="flex flex-wrap gap-x-7 gap-y-3">
              {socialLinks.map((socialLink) => (
                <li key={socialLink.url}>
                  <a
                    href={socialLink.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 border-b border-transparent pb-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/60 outline-none transition hover:border-foreground/50 hover:text-foreground focus-visible:border-foreground focus-visible:text-foreground"
                  >
                    {getPlainText(translate(locale, socialLink.label))}
                    <ArrowUpRightIcon />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </section>

      <section className="grid gap-10 py-12 sm:py-20 lg:grid-cols-12" aria-labelledby="contact-form-title">
        <div className="lg:col-span-3">
          <RichText
            as="h2"
            id="contact-form-title"
            value={copy.formTitle}
            className="text-3xl leading-none tracking-[-0.035em] sm:text-4xl"
          />
          {formSubtitle ? (
            <RichText
              value={copy.formSubtitle}
              className="mt-4 max-w-56 font-mono text-[10px] uppercase leading-4 tracking-[0.15em] text-foreground/60 [&_p]:my-0"
            />
          ) : (
            <p className="mt-4 max-w-56 font-mono text-[10px] uppercase leading-4 tracking-[0.15em] text-foreground/60">
              {locale === "es" ? "Todos los campos marcados con * son obligatorios" : "Fields marked * are required"}
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-x-8 gap-y-8 lg:col-span-8 lg:col-start-5 sm:grid-cols-2"
          aria-busy={status === "sending"}
        >
          <label htmlFor="contact-name" className="block text-sm text-foreground/75">
            <RichText as="span" value={copy.nameLabel} /> <span aria-hidden="true">*</span>
            <input
              id="contact-name"
              required
              autoComplete="name"
              value={formData.name}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, name: event.target.value }))
              }
              className={fieldClassName}
              name="name"
            />
          </label>

          <label htmlFor="contact-email" className="block text-sm text-foreground/75">
            <RichText as="span" value={copy.emailLabel} /> <span aria-hidden="true">*</span>
            <input
              id="contact-email"
              required
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, email: event.target.value }))
              }
              className={fieldClassName}
              name="email"
            />
          </label>

          <label htmlFor="contact-organization" className="block text-sm text-foreground/75">
            <RichText as="span" value={copy.organizationLabel} />
            <input
              id="contact-organization"
              autoComplete="organization"
              value={formData.organization}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, organization: event.target.value }))
              }
              className={fieldClassName}
              name="organization"
            />
          </label>

          <label htmlFor="contact-phone" className="block text-sm text-foreground/75">
            <RichText as="span" value={copy.phoneLabel} />
            <input
              id="contact-phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, phone: event.target.value }))
              }
              className={fieldClassName}
              name="phone"
            />
          </label>

          <label htmlFor="contact-subject" className="block text-sm text-foreground/75 sm:col-span-2">
            <RichText as="span" value={copy.subjectLabel} />
            <input
              id="contact-subject"
              value={formData.subject}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, subject: event.target.value }))
              }
              className={fieldClassName}
              name="subject"
            />
          </label>

          <label htmlFor="contact-message" className="block text-sm text-foreground/75 sm:col-span-2">
            <RichText as="span" value={copy.messageLabel} /> <span aria-hidden="true">*</span>
            <textarea
              id="contact-message"
              required
              rows={6}
              value={formData.message}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, message: event.target.value }))
              }
              className={`${fieldClassName} resize-y`}
              name="message"
            />
          </label>

          <div className="flex flex-col items-start gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              className="group inline-flex min-h-11 items-center gap-4 border-b border-foreground/50 py-2 text-sm outline-none transition hover:border-foreground focus-visible:border-foreground disabled:cursor-not-allowed disabled:opacity-40"
              disabled={status === "sending"}
            >
              {status === "sending" ? (
                <RichText as="span" value={copy.sendingLabel} />
              ) : (
                <RichText as="span" value={copy.submitLabel} />
              )}
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                <ArrowRightIcon />
              </span>
            </button>

            <div aria-live="polite" className="min-h-5 text-sm">
              {status === "success" ? (
                <p className="font-mono text-[10px] uppercase tracking-[0.15em]">
                  <RichText as="span" value={copy.successLabel} /> · <CheckIcon />
                </p>
              ) : null}
              {error ? <p role="alert" className="text-red-500">{error}</p> : null}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
