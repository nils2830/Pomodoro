import type { Metadata } from "next";
import { LandingPage } from "@/modules/site/landing/LandingPage";
import { KeepDanish } from "@/modules/site/KeepDanish";

const description =
  "En gratis fokustimer til studiet og fordybet arbejde. Pomodoro-sessioner med en kort opvarmning, en timer du kan skjule, og statistik over hvornår og hvor længe du faktisk fokuserer.";

export const metadata: Metadata = {
  title: { absolute: "Steen: gratis Pomodoro- og fokustimer til studiet" },
  description,
  alternates: { canonical: "/da", languages: { en: "/welcome", da: "/da", "x-default": "/welcome" } },
  openGraph: { locale: "da_DK", title: "Steen: gratis Pomodoro- og fokustimer til studiet", description, url: "/da" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Steen",
  url: "https://www.steen.fit/da",
  inLanguage: "da",
  description,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Webbrowser",
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Gratis" },
    { "@type": "Offer", price: "4", priceCurrency: "USD", name: "Pro (månedlig)" },
  ],
};

/** The welcome page in Danish, rendered in Danish on the server for search engines. */
export default function DanishWelcomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <KeepDanish />
      <LandingPage />
    </>
  );
}
