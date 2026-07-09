import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	Object.assign(process.env, env);

	const googleClientId =
		env.VITE_GOOGLE_LOGIN_CLIENT_ID ??
		env.GOOGLE_LOGIN_CLIENT_ID ??
		env.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID ??
		"";

	return {
		define: {
			"import.meta.env.VITE_GOOGLE_LOGIN_CLIENT_ID":
				JSON.stringify(googleClientId),
			"import.meta.env.VITE_SITE_URL": JSON.stringify(
				env.VITE_SITE_URL ?? env.NEXT_PUBLIC_SITE_URL ?? "",
			),
		},
		resolve: {
			tsconfigPaths: true,
		},
		server: {
			allowedHosts: ["hike.myeongjae.kim"],
		},
		plugins: [nitro(), tailwindcss(), tanstackStart(), viteReact()],
	};
});
