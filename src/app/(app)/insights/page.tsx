import type { Metadata } from "next";
import { ClientOnly } from "@/core/shell/ClientOnly";
import { InsightsView } from "@/modules/insights/components/InsightsView";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return (
    <ClientOnly fallback={<div className="min-h-svh" />}>
      <InsightsView />
    </ClientOnly>
  );
}
