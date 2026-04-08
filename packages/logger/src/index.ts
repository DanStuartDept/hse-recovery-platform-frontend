export const log = (...args: unknown[]): void => {
	console.log("LOGGER: ", ...args);
};

export const warn = (...args: unknown[]): void => {
	console.warn("LOGGER: ", ...args);
};

export const error = (...args: unknown[]): void => {
	console.error("LOGGER: ", ...args);
};
