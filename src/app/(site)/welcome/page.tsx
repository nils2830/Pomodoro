import type { Metadata } from "next";
import { LandingPage } from "@/modules/site/landing/LandingPage";

export const metadata: Metadata = {
  title: { absolute: "Steen · Focus, set in stone" },
  description: "A calm focus timer with a warm-up ritual, a clock you can hide, and honest insights into how often you actually sit down to work.",
};

export default function WelcomePage() {
  return <LandingPage />;
}
