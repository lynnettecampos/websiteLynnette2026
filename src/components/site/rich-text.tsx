import type { ComponentPropsWithoutRef, ElementType } from "react";

import { translate, type LocaleText } from "@/lib/i18n";
import { useLocale } from "@/components/site/locale-context";

type RichTextProps<T extends ElementType> = {
  as?: T;
  value: LocaleText;
} & ComponentPropsWithoutRef<T>;

const FONT_SIZE_MAP: Record<string, string> = {
  "1": "0.75rem",
  "2": "0.875rem",
  "3": "1rem",
  "4": "1.125rem",
  "5": "1.25rem",
  "6": "1.5rem",
  "7": "1.875rem",
};

const stripHtmlContent = (value: string): string =>
  value
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();

const normalizeRichText = (value: string | undefined): string => {
  if (!value) return "";

  const withSpanFonts = value.replace(/<font([^>]*)>/gi, (_, attributes) => {
    const sizeMatch = attributes.match(/size=["']?(\d)["']?/i);
    const colorMatch = attributes.match(/color=["']?([^"'>]+)["']?/i);
    const styleMatch = attributes.match(/style=["']?([^"']+)["']?/i);
    const styles: string[] = [];

    if (sizeMatch?.[1]) {
      const mappedSize = FONT_SIZE_MAP[sizeMatch[1]];
      if (mappedSize) {
        styles.push(`font-size: ${mappedSize}`);
      }
    }

    if (colorMatch?.[1]) {
      styles.push(`color: ${colorMatch[1]}`);
    }

    if (styleMatch?.[1]) {
      styles.push(styleMatch[1]);
    }

    const styleAttr = styles.length > 0 ? ` style="${styles.join("; ")}"` : "";
    return `<span${styleAttr}>`;
  });

  const normalized = withSpanFonts
    .replace(/<\/font>/gi, "</span>")
    .replace(/<(p|div|span)[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/(p|div|span)>/gi, "")
    .replace(/^(\s|&nbsp;|<br\s*\/?>)+/gi, "")
    .replace(/(\s|&nbsp;|<br\s*\/?>)+$/gi, "");

  return stripHtmlContent(normalized) ? normalized : "";
};

export const getPlainText = (value: string | undefined): string =>
  stripHtmlContent(normalizeRichText(value));

export function RichText<T extends ElementType = "div">({
  as,
  value,
  className,
  ...props
}: RichTextProps<T>) {
  const { locale } = useLocale();
  const Component = (as || "div") as ElementType;
  const content = normalizeRichText(translate(locale, value));
  const mergedClassName = ["rich-text-reset", className].filter(Boolean).join(" ");

  if (!content) {
    return null;
  }

  return (
    <Component
      className={mergedClassName}
      dangerouslySetInnerHTML={{ __html: content?.replace(/\n/g, "<br />") ?? "" }}
      {...props}
    />
  );
}
