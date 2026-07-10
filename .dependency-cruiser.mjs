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
			name: "core-not-to-infrastructure",
			comment:
				"Core owns policy and ports, but concrete adapters and composition live in infrastructure.",
			severity: "error",
			from: { path: "^src/core/" },
			to: { path: "^src/infrastructure/" },
		},
		{
			name: "core-domain-model-independent",
			comment:
				"Domain and model code should stay independent from application, adapters, config, database, and web modules.",
			severity: "error",
			from: { path: "^src/core/[^/]+/(domain|model)/" },
			to: {
				path: [
					"^src/core/[^/]+/application/",
					"^src/core/config/",
					"^src/infrastructure/",
					"^drizzle/",
					"^src/(api|config|integrations|routes|society|society-app|styles|theme)/",
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
					"^src/core/config/",
					"^src/infrastructure/",
					"^drizzle/",
					"^src/(api|config|integrations|routes|society|society-app|styles|theme)/",
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
					"^src/infrastructure/",
					"^drizzle/",
					"^src/(api|config|integrations|routes|society|society-app|styles|theme)/",
					"^(react($|/)|react-dom($|/)|@tanstack/|hono($|/))",
				],
			},
		},
		{
			name: "web-not-to-outbound-ports",
			comment:
				"Routes, API controllers, society-app, and society UI should call in-ports only.",
			severity: "error",
			from: { path: "^src/(api|routes|society|society-app)/" },
			to: { path: "^src/core/[^/]+/application/port/out/" },
		},
		{
			name: "web-not-to-database",
			comment: "Web adapters should not import DB schema or DB connection directly.",
			severity: "error",
			from: { path: "^src/(api|routes|society|society-app)/" },
			to: {
				path: [
					"^drizzle/",
					"^src/infrastructure/common/adapter/",
				],
			},
		},
		{
			name: "web-not-to-infrastructure-internals",
			comment:
				"Web adapters may use the typed getUseCase boundary, but not concrete infrastructure internals.",
			severity: "error",
			from: { path: "^src/(api|routes|society|society-app)/" },
			to: {
				path: "^src/infrastructure/(?!config/getUseCase[.]ts$)",
			},
		},
		{
			name: "web-not-to-composition-internals",
			comment:
				"Routes, API controllers, and society modules should use the typed use case context instead of DI internals.",
			severity: "error",
			from: { path: "^src/(api|routes|society|society-app)/" },
			to: {
				path: [
					"^src/infrastructure/config/applicationContext[.]server[.]ts$",
					"^src/core/config/Autowired[.]ts$",
					"^src/infrastructure/config/BeanConfig[.]server[.]ts$",
				],
			},
		},
		{
			name: "web-schema-boundaries-only-to-core-schemas-at-runtime",
			comment:
				"API schemas and API response parsers may reuse canonical core schemas, but should not execute core services or domain policies.",
			severity: "error",
			from: {
				path: "^src/(api/schemas[.]ts|society/shared/apiResponseParsers[.]ts)$",
			},
			to: {
				dependencyTypesNot: ["type-only"],
				path: "^src/core/",
				pathNot: "Schema[.]ts$",
			},
		},
		{
			name: "api-config-not-to-controllers",
			comment:
				"API config and middleware are lower-level HTTP adapter infrastructure and should not depend on concrete controllers; ApiControllerConfig is the explicit composition root.",
			severity: "error",
			from: { path: "^src/api/config/(?!ApiControllerConfig[.]server[.]ts$)" },
			to: { path: "^src/api/controllers/" },
		},
		{
			name: "society-shared-not-to-product-society-modules",
			comment: "Shared society UI code should not depend on product modules.",
			severity: "error",
			from: { path: "^src/society/shared/" },
			to: {
				path: "^src/society/(article|auth|comment|feed|hiking|media|member|notification|profile)/",
			},
		},
		{
			name: "society-app-not-to-society-ui",
			comment:
				"Society app server-function boundaries should orchestrate core use cases, not depend on UI modules.",
			severity: "error",
			from: { path: "^src/society-app/" },
			to: { path: "^src/society/" },
		},
		{
			name: "society-ui-not-to-society-app",
			comment:
				"Society UI modules should receive data/actions from routes or props instead of importing server-function boundaries directly.",
			severity: "error",
			from: { path: "^src/society/" },
			to: { path: "^src/society-app/" },
		},
		{
			name: "society-ui-not-to-server-functions",
			comment:
				"Server functions belong in src/society-app so src/society stays a UI/client product boundary.",
			severity: "error",
			from: { path: "^src/society/.*[.]functions[.]ts$" },
			to: { path: "^" },
		},
		{
			name: "society-ui-not-to-core-domain-policy-runtime",
			comment:
				"Society UI may receive core-shaped data, but should not execute core domain policies directly.",
			severity: "error",
			from: { path: "^src/society/" },
			to: {
				path: [
					"^src/core/auth/model/(roles|roleLabels)[.]ts$",
					"^src/core/article/domain/ArticlePolicy[.]ts$",
				],
			},
		},
		{
			name: "routes-and-society-not-to-core-runtime",
			comment:
				"Routes and society UI can reference core types, but runtime execution must go through society-app or API boundaries.",
			severity: "error",
			from: {
				path: "^src/(routes|society)/",
				pathNot: "^src/society/shared/apiResponseParsers[.]ts$",
			},
			to: {
				path: "^src/core/",
				dependencyTypesNot: ["type-only"],
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
