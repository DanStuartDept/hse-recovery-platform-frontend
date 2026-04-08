import { error, log, warn } from "..";

describe("@repo/logger", () => {
	it("log writes to console.log", () => {
		vi.spyOn(global.console, "log");
		log("hello");
		expect(console.log).toBeCalledWith("LOGGER: ", "hello");
	});

	it("warn writes to console.warn", () => {
		vi.spyOn(global.console, "warn");
		warn("careful");
		expect(console.warn).toBeCalledWith("LOGGER: ", "careful");
	});

	it("error writes to console.error", () => {
		vi.spyOn(global.console, "error");
		error("broken");
		expect(console.error).toBeCalledWith("LOGGER: ", "broken");
	});
});
