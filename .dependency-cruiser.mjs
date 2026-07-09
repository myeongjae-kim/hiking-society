/** @type {import("dependency-cruiser").IConfiguration} */
export default {
	forbidden: [
		{
			name: "no-circular",
			severity: "error",
			from: {},
			to: { circular: true },
		},
		{
			name: "not-to-unresolvable",
			severity: "error",
			from: {},
			to: { couldNotResolve: true },
		},
		{
			name: "core-not-to-web-framework-packages",
			comment: "Core code should not import React, TanStack, or Hono directly.",
			severity: "error",
			from: { path: "^src/core/" },
			to: { path: "^(react($|/)|react-dom($|/)|@tanstack/|hono($|/))" },
		},
		{
			name: "core-domain-model-independent",
			comment:
				"Domain and model code should stay independent from application, adapters, config, database, and web modules.",
			severity: "error",
			from: { path: "^src/core/[^/]+/(domain|model)/" },
			to: {
				path: [
					"^src/core/[^/]+/(application|adapter|config)/",
					"^src/core/config/",
					"^drizzle/",
					"^src/(api|features|integrations|routes|styles|theme)/",
					"^(react($|/)|react-dom($|/)|@tanstack/|hono($|/))",
				],
			},
		},
		{
			name: "core-application-ports-independent",
			comment:
				"Application ports should not depend on adapters, config, database, or web modules.",
			severity: "error",
			from: { path: "^src/core/[^/]+/application/port/" },
			to: {
				path: [
					"^src/core/[^/]+/adapter/",
					"^src/core/config/",
					"^drizzle/",
					"^src/(api|features|integrations|routes|styles|theme)/",
					"^(react($|/)|react-dom($|/)|@tanstack/|hono($|/))",
				],
			},
		},
		{
			name: "core-application-services-not-to-infra",
			comment:
				"Application services may use DI annotations, but should not import adapters, database schema, or web modules.",
			severity: "error",
			from: { path: "^src/core/[^/]+/application/[^/]+[.]ts$" },
			to: {
				path: [
					"^src/core/[^/]+/adapter/",
					"^drizzle/",
					"^src/(api|features|integrations|routes|styles|theme)/",
					"^(react($|/)|react-dom($|/)|@tanstack/|hono($|/))",
				],
			},
		},
		{
			name: "web-not-to-outbound-ports",
			comment: "Routes, API controllers, and features should call in-ports only.",
			severity: "error",
			from: { path: "^src/(api|features|routes)/" },
			to: { path: "^src/core/[^/]+/application/port/out/" },
		},
		{
			name: "web-not-to-database",
			comment: "Web adapters should not import DB schema or DB connection directly.",
			severity: "error",
			from: { path: "^src/(api|features|routes)/" },
			to: { path: ["^drizzle/", "^src/core/config/drizzle[.]server[.]ts$"] },
		},
		{
			name: "shared-feature-not-to-product-features",
			comment: "Shared feature code should not depend on product features.",
			severity: "error",
			from: { path: "^src/features/shared/" },
			to: {
				path: "^src/features/(article|auth|comment|feed|hiking|media|member|notification|profile)/",
			},
		},
	],
	options: {
		doNotFollow: {
			path: ["node_modules"],
			dependencyTypes: [
				"npm",
				"npm-dev",
				"npm-optional",
				"npm-peer",
				"npm-bundled",
				"npm-no-pkg",
			],
		},
		exclude: {
			path: ["^src/routeTree[.]gen[.]ts$", "^src/api/schema[.]d[.]ts$"],
		},
		tsConfig: {
			fileName: "tsconfig.json",
		},
		enhancedResolveOptions: {
			conditionNames: ["import", "require", "node", "default", "types"],
			exportsFields: ["exports"],
			extensions: [".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs", ".json"],
			mainFields: ["module", "main", "types"],
		},
		skipAnalysisNotInRules: true,
	},
};
