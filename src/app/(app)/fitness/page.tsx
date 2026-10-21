import type { Metadata } from "next";
import { ComingSoon } from "@/core/shell/ComingSoon";
import { fitnessModule } from "@/modules/fitness/manifest";

export const metadata: Metadata = { title: "Fitness" };

export default function FitnessPage() {
  return <ComingSoon module={fitnessModule} />;
}
