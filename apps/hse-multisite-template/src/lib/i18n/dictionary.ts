import type { Unflatten } from "@repo/i18n";

// The default locale dictionary is the source of truth for keys.
import type en from "@/dictionaries/en.json";

type FlatDictionary = typeof en;

export type Dictionary = Unflatten<FlatDictionary>;
