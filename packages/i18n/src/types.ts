import type { ReactNode } from "react";
import type SharedDict from "../dictionaries/en.json";

/** Configuration for an app's supported locales. */
export type I18nConfig = {
	/** The default locale — hidden from the URL. */
	defaultLocale: string;
	/** All supported locales, including the default. */
	locales: readonly string[];
};

/** Two-level categorized dictionary shape: `{ category: { key: value } }`. */
export type CategorizedDictionary = Record<string, Record<string, string>>;

/** Async loaders that return categorized dictionary modules, keyed by locale. */
export type DictionaryLoaders = Record<string, () => Promise<{ default: CategorizedDictionary }>>;

// ── Unflatten utility type ──────────────────────────────────────────

type PluralSuffix = "_zero" | "_one" | "_two" | "_few" | "_many" | "_other";

type StripPlural<K extends string> = K extends `${infer Base}${PluralSuffix}` ? Base : K;

type IsPluralKey<K extends string> = K extends `${string}${PluralSuffix}` ? true : false;

type PluralValue<K extends string> = IsPluralKey<K> extends true ? (count: number) => string : string;

type Split<S extends string> = S extends `${infer H}.${infer T}` ? [H, ...Split<T>] : [S];

type SetPath<P extends string[], V> = P extends [infer H extends string]
	? { readonly [K in H]: V }
	: P extends [infer H extends string, ...infer T extends string[]]
		? { readonly [K in H]: SetPath<T, V> }
		: never;

type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

type Simplify<T> = { [K in keyof T]: T[K] extends Record<string, unknown> ? Simplify<T[K]> : T[K] } & {};

/**
 * Converts a flat dotted-key dictionary type to a nested object type.
 * Keys ending in plural suffixes (`_zero`, `_one`, `_other`, etc.)
 * collapse into `(count: number) => string` at the base key path.
 */
export type Unflatten<T extends Record<string, string>> = Simplify<
	UnionToIntersection<{ [K in keyof T & string]: SetPath<Split<StripPlural<K>>, PluralValue<K>> }[keyof T & string]>
>;

// ── Categorized dictionary utilities ──────────────────────────────────

/**
 * Compile-time companion to `flattenCategorized()`.
 * Converts `{ category: { key: string } }` to `{ "category.key": string }`.
 */
export type FlattenCategorized<T extends CategorizedDictionary> = {
	[Cat in keyof T & string as `${Cat}.${keyof T[Cat] & string}`]: string;
};

/**
 * Merges the shared dictionary type with an app dictionary type,
 * flattens both, and unflattens the result.
 *
 * Usage in an app:
 * ```ts
 * import type app from "@/dictionaries/en.json";
 * export type Dictionary = MergedDictionary<typeof app>;
 * ```
 */
export type MergedDictionary<TApp extends CategorizedDictionary> = Unflatten<
	FlattenCategorized<typeof SharedDict> & FlattenCategorized<TApp>
>;

/**
 * Tag factory for the `rich()` helper.
 * Receives the inner text content and returns a React node.
 */
export type RichTagFactory = (children: string) => ReactNode;
