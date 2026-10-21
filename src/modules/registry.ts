import type { ModuleManifest } from "@/core/modules/types";
import { focusModule } from "./focus/manifest";
import { insightsModule } from "./insights/manifest";
import { wellnessModule } from "./wellness/manifest";
import { fitnessModule } from "./fitness/manifest";

/** Navigation order. Register new modules here. */
export const MODULES: ModuleManifest[] = [focusModule, insightsModule, wellnessModule, fitnessModule];

export function getModule(id: string): ModuleManifest | undefined {
  return MODULES.find((m) => m.id === id);
}
