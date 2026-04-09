import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
	title: "HSE Multisite Docs",
	tagline: "Documentation for the HSE Multisite Frontend monorepo",
	favicon: "img/favicon.svg",

	url: "https://dept.github.io",
	baseUrl: "/hse-multisite-frontend/",
	organizationName: "dept",
	projectName: "hse-multisite-frontend",
	trailingSlash: false,

	onBrokenLinks: "throw",
	markdown: {
		hooks: {
			onBrokenMarkdownLinks: "warn",
		},
	},

	future: {
		faster: true,
		v4: true,
	},

	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},

	presets: [
		[
			"classic",
			{
				docs: {
					sidebarPath: "./sidebars.ts",
					routeBasePath: "/",
				},
				blog: false,
				theme: {
					customCss: ["./src/css/custom.css"],
				},
			} satisfies Preset.Options,
		],
	],

	plugins: [
		[
			"docusaurus-plugin-typedoc",
			{
				id: "api-client",
				entryPoints: ["../../packages/wagtail-cms-client/src/index.ts"],
				tsconfig: "../../packages/wagtail-cms-client/tsconfig.json",
				out: "docs/api/wagtail-api-client",
				sidebar: { autoConfiguration: true },
			},
		],
		[
			"docusaurus-plugin-typedoc",
			{
				id: "cms-types",
				entryPoints: [
					"../../packages/wagtail-cms-types/src/types/blocks/index.ts",
					"../../packages/wagtail-cms-types/src/types/core/index.ts",
					"../../packages/wagtail-cms-types/src/types/fields/index.ts",
					"../../packages/wagtail-cms-types/src/types/page-models/index.ts",
					"../../packages/wagtail-cms-types/src/types/settings/index.ts",
					"../../packages/wagtail-cms-types/src/types/snippets/index.ts",
				],
				tsconfig: "../../packages/wagtail-cms-types/tsconfig.json",
				out: "docs/api/wagtail-cms-types",
				sidebar: { autoConfiguration: true },
			},
		],
		[
			"docusaurus-plugin-typedoc",
			{
				id: "cms-mapping",
				entryPoints: ["../../packages/wagtail-cms-mapping/src/index.tsx"],
				tsconfig: "../../packages/wagtail-cms-mapping/tsconfig.json",
				out: "docs/api/wagtail-cms-mapping",
				sidebar: { autoConfiguration: true },
			},
		],
		[
			"docusaurus-plugin-typedoc",
			{
				id: "app-config",
				entryPoints: ["../../packages/app-config/src/index.ts"],
				tsconfig: "../../packages/app-config/tsconfig.json",
				out: "docs/api/app-config",
				sidebar: { autoConfiguration: true },
			},
		],
		[
			"docusaurus-plugin-typedoc",
			{
				id: "i18n-pkg",
				entryPoints: ["../../packages/i18n/src/index.ts"],
				tsconfig: "../../packages/i18n/tsconfig.json",
				out: "docs/api/i18n",
				sidebar: { autoConfiguration: true },
			},
		],
	],

	themeConfig: {
		navbar: {
			title: "HSE Multisite Docs",
			logo: {
				alt: "HSE Logo",
				src: "img/logo-hse.svg",
			},
			items: [
				{
					type: "docSidebar",
					sidebarId: "guideSidebar",
					position: "left",
					label: "Guide",
				},
				{
					type: "docSidebar",
					sidebarId: "apiSidebar",
					position: "left",
					label: "API Reference",
				},
				{
					href: "https://github.com/dept/hse-multisite-frontend",
					label: "GitHub",
					position: "right",
				},
			],
		},
		footer: {
			style: "dark",
			links: [
				{
					title: "Docs",
					items: [
						{ label: "Getting Started", to: "/getting-started/prerequisites" },
						{ label: "Architecture", to: "/architecture/monorepo-structure" },
						{ label: "Deployment", to: "/deployment/environment-variables" },
					],
				},
				{
					title: "Resources",
					items: [
						{
							label: "HSE Service Manual",
							href: "https://service-manual.hse.ie",
						},
						{
							label: "GitHub",
							href: "https://github.com/dept/hse-multisite-frontend",
						},
					],
				},
			],
			copyright: `Copyright \u00a9 ${new Date().getFullYear()} Health Service Executive`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
			additionalLanguages: ["bash", "json", "yaml", "docker"],
		},
	} satisfies Preset.ThemeConfig,
};

export default config;
