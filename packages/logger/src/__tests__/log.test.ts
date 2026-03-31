import { log } from "..";

vi.spyOn(global.console, "log");

describe("@repo/logger", () => {
	it("prints a message", () => {
		log("hello");
		expect(console.log).toBeCalledWith("LOGGER: ", "hello");
	});
});
