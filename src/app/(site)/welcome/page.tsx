import type { Metadata } from "next";
import { LandingPage } from "@/modules/site/landing/LandingPage";

const description =
  "A free focus timer for studying and deep work. Pomodoro sessions with a short warm-up, a timer you can hide, and stats on when and how long you actually focus.";

export const metadata: Metadata = {
  title: { absolute: "Steen: free Pomodoro and focus timer for studying" },
  description,
  alternates: { canonical: "/welcome", languages: { en: "/welcome", da: "/da", "x-default": "/welcome" } },
};

/** Structured data so search engines know this is a free web app, not just a page. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Steen",
  url: "https://www.steen.fit/welcome",
  description,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web browser",
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
    { "@type": "Offer", price: "4", priceCurrency: "USD", name: "Pro (monthly)" },
  ],
  featureList: ["Pomodoro focus timer", "Focus warm-up", "Hideable timer and clock faces", "Study insights and streaks", "Tasks and activities"],
};

export default function WelcomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingPage />
    </>
  );
}
