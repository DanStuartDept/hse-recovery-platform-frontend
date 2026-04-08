"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";
import { unflatten } from "./unflatten";

const DictionaryContext = createContext<Record<string, unknown> | null>(null);

/**
 * Provides an unflattened dictionary to client components via React context.
 * Accepts a flat dictionary and locale — unflattens on the client side
 * (functions can't cross the server-client serialisation boundary).
 */
export function DictionaryProvider({
	flat,
	locale,
	children,
}: {
	flat: Record<string, string>;
	locale: string;
	children: ReactNode;
}) {
	const dictionary = useMemo(() => unflatten(flat, locale), [flat, locale]);
	return <DictionaryContext value={dictionary}>{children}</DictionaryContext>;
}

/**
 * Access the dictionary in a client component.
 * Must be used within a DictionaryProvider.
 */
export function useDictionary<T = Record<string, unknown>>(): T {
	const dict = useContext(DictionaryContext);
	if (!dict) {
		throw new Error("useDictionary must be used within a DictionaryProvider");
	}
	return dict as T;
}
