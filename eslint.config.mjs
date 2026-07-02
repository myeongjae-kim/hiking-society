import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/db/drizzle",
              message: "Use applicationContext use cases or ports from app code.",
            },
            {
              name: "@/lib/db/schema",
              message: "Use core models and application ports from app code.",
            },
            {
              name: "drizzle-orm",
              message: "Keep Drizzle access inside core adapters.",
            },
          ],
          patterns: [
            {
              group: ["@/lib/db/*"],
              message: "Use applicationContext use cases or ports from app code.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
