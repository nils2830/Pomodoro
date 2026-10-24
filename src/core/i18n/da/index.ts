import shell from "./shell";
import billing from "./billing";
import focus from "./focus";
import settings from "./settings";
import warmup from "./warmup";
import insights from "./insights";
import distractions from "./distractions";
import tour from "./tour";
import landing from "./landing";
import growth from "./growth";

/** Every Danish string, keyed by its English source text. */
export const DA: Record<string, string> = { ...shell, ...billing, ...focus, ...settings, ...warmup, ...insights, ...distractions, ...tour, ...landing, ...growth };
