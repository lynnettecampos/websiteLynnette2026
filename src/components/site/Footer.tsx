"use client";

import Link from "next/link";

import { ArrowUpRightIcon } from "@/components/site/icons";
import { getPlainText } from "@/components/site/rich-text";
import type { SiteContent } from "@/domain/site";
import { translate } from "@/lib/i18n";
import { useLocale } from "./locale-context";

type FooterProps = {
  footer: SiteContent["footer"];
  artistName: string;
};

export function Footer({ footer, artistName }: FooterProps) {
  const { locale } = useLocale();
  const socialLinks = [
    footer.instagramUrl
      ? {
          href: footer.instagramUrl,
          label: getPlainText(translate(locale, footer.instagramLabel)).trim() || "Instagram",
        }
      : null,
    footer.facebookUrl
      ? {
          href: footer.facebookUrl,
          label: getPlainText(translate(locale, footer.facebookLabel)).trim() || "Facebook",
        }
      : null,
    footer.linkedinUrl
      ? {
          href: footer.linkedinUrl,
          label: getPlainText(translate(locale, footer.linkedinLabel)).trim() || "LinkedIn",
        }
      : null,
  ].filter((link): link is { href: string; label: string } => Boolean(link));

  return (
    <footer className="site-footer">
      <div className="editorial-frame site-footer-grid">
        <div>
          <p className="site-footer-name">{artistName}</p>
          <p className="site-footer-caption">{getPlainText(translate(locale, footer.tagline))}</p>
        </div>

        {socialLinks.length > 0 ? (
          <nav
            className="site-footer-links"
            aria-label={locale === "es" ? "Redes sociales" : "Social media"}
          >
            {socialLinks.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
                <span aria-hidden="true"><ArrowUpRightIcon /></span>
              </a>
            ))}
          </nav>
        ) : (
          <div />
        )}

        <div className="site-footer-meta">
          <p>
            © {new Date().getFullYear()} {artistName}
          </p>
          <Link href="/admin/login">{getPlainText(translate(locale, footer.adminLabel))}</Link>
        </div>
      </div>
    </footer>
  );
}
