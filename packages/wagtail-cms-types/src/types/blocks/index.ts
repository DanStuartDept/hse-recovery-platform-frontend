import { z } from "zod";

// Export base schemas first (no circular dependencies)
export * from "./base";

// Export all from individual block files
export * from "./content-block";
export * from "./text-content";

// Re-import types for union
import type {
	BlockContentBlockValuesProps,
	BlockTextContentValuesProps,
} from ".";

/**
 * Union type of all block value properties.
 * Used for type narrowing and discriminated unions based on block type.
 */
export type BlockValuesProps =
	| BlockTextContentValuesProps
	| BlockContentBlockValuesProps;
