import type { Unflatten } from "@repo/i18n";

// The default locale dictionary is the source of truth for keys.
import type enIe from "@/dictionaries/en-ie.json";

type FlatDictionary = typeof enIe;

export type Dictionary = Unflatten<FlatDictionary>;
