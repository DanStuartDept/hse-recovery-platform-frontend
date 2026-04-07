#!/usr/bin/env node

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const rootDir = new URL("../../", import.meta.url).pathname;

function findCoveragePackages() {
	const results = [];

	for (const dir of ["packages", "apps"]) {
		const base = join(rootDir, dir);
		if (!existsSync(base)) continue;

		for (const name of readdirSync(base, { withFileTypes: true })) {
			if (!name.isDirectory()) continue;

			const coveragePath = join(base, name.name, "coverage", "coverage-summary.json");
			const pkgPath = join(base, name.name, "package.json");

			if (!existsSync(coveragePath) || !existsSync(pkgPath)) continue;

			const coverage = JSON.parse(readFileSync(coveragePath, "utf8"));
			const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

			results.push({
				name: pkg.name,
				statements: coverage.total.statements.pct,
				branches: coverage.total.branches.pct,
				functions: coverage.total.functions.pct,
				lines: coverage.total.lines.pct,
			});
		}
	}

	return results.sort((a, b) => a.name.localeCompare(b.name));
}

const packages = findCoveragePackages();

if (packages.length === 0) {
	console.log("No test coverage data found.");
	process.exit(0);
}

console.log("| Package | Stmts | Branch | Funcs | Lines |");
console.log("|---------|-------|--------|-------|-------|");

for (const pkg of packages) {
	console.log(
		`| ${pkg.name} | ${pkg.statements}% | ${pkg.branches}% | ${pkg.functions}% | ${pkg.lines}% |`,
	);
}

const avg = (key) => (packages.reduce((sum, p) => sum + p[key], 0) / packages.length).toFixed(1);
console.log(`| **Total** | **${avg("statements")}%** | **${avg("branches")}%** | **${avg("functions")}%** | **${avg("lines")}%** |`);
