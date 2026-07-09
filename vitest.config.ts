import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));
const src = fileURLToPath(new URL("./src/", import.meta.url));

export default defineConfig({
	resolve: {
		alias: [
			{ find: /^@\/core\/(.*)$/, replacement: `${src}core/$1` },
			{ find: /^#\/(.*)$/, replacement: `${src}$1` },
			{ find: /^@\/(.*)$/, replacement: `${root}$1` },
		],
	},
	test: {
		environment: "node",
		include: ["src/core/**/*.test.ts"],
	},
});
