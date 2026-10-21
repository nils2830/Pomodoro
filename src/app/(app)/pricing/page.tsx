import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/core/shell/ClientOnly";
import { PricingView } from "@/core/billing/PricingView";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <ClientOnly fallback={<div className="min-h-svh" />}>
      <Suspense>
        <PricingView />
      </Suspense>
    </ClientOnly>
  );
}
