import type { MergedDictionary } from "@repo/i18n";
import type app from "@/dictionaries/en.json";

/** Fully typed dictionary available via `useDictionary<Dictionary>()`. */
export type Dictionary = MergedDictionary<typeof app>;
