import type { Metadata } from "next";
import { ComingSoon } from "@/core/shell/ComingSoon";
import { wellnessModule } from "@/modules/wellness/manifest";

export const metadata: Metadata = { title: "Wellness" };

export default function WellnessPage() {
  return <ComingSoon module={wellnessModule} />;
}
