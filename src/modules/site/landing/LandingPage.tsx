"use client";

import { MotionConfig } from "motion/react";
import { SmoothScroll } from "../motion";
import { Hero } from "./Hero";
import { ScrollStatement, Steps } from "./Story";
import { WarmupShowcase } from "./WarmupShowcase";
import { FacesShowcase } from "./FacesShowcase";
import { InsightsShowcase } from "./InsightsShowcase";
import { Landscapes } from "./Landscapes";
import { IphoneSection } from "./IphoneSection";
import { FinalCta, PricingTeaser } from "./Closing";

/** The welcome page: what Steen is, why it's calm, and a way in. */
export function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll />
      <Hero />
      <ScrollStatement />
      <Steps />
      <WarmupShowcase />
      <FacesShowcase />
      <InsightsShowcase />
      <Landscapes />
      <IphoneSection />
      <PricingTeaser />
      <FinalCta />
    </MotionConfig>
  );
}
