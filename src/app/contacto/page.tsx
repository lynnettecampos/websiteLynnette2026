import ContactPageClient, { type ContactSocialLink } from "./page.client";

import { getSiteContent } from "@/data/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactPage() {
  const siteContent = await getSiteContent();
  const socialLinks: ContactSocialLink[] = [
    siteContent.footer.instagramUrl
      ? {
          label: {
            es: siteContent.footer.instagramLabel.es.trim() || "Instagram",
            en: siteContent.footer.instagramLabel.en.trim() || "Instagram",
          },
          url: siteContent.footer.instagramUrl,
        }
      : null,
    siteContent.footer.facebookUrl
      ? {
          label: {
            es: siteContent.footer.facebookLabel.es.trim() || "Facebook",
            en: siteContent.footer.facebookLabel.en.trim() || "Facebook",
          },
          url: siteContent.footer.facebookUrl,
        }
      : null,
    siteContent.footer.linkedinUrl
      ? {
          label: {
            es: siteContent.footer.linkedinLabel.es.trim() || "LinkedIn",
            en: siteContent.footer.linkedinLabel.en.trim() || "LinkedIn",
          },
          url: siteContent.footer.linkedinUrl,
        }
      : null,
  ].filter((socialLink): socialLink is ContactSocialLink => socialLink !== null);

  return (
    <ContactPageClient
      copy={siteContent.contact}
      socialLinks={socialLinks}
    />
  );
}
