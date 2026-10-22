import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/core/shell/ClientOnly";
import { PricingView } from "@/core/billing/PricingView";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Steen is free to use. Pro adds deep insights, every timer face and landscape, and flow mode for $4 a month or $36 a year.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <ClientOnly fallback={<div className="min-h-svh" />}>
      <Suspense>
        <PricingView />
      </Suspense>
    </ClientOnly>
  );
}
