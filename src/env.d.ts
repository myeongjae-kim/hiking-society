/** biome-ignore-all lint/correctness/noUnusedVariables: vite용 환경변수 정보 제공 */

/* https://tanstack.com/start/latest/docs/framework/react/guide/environment-variables#type-safety */
interface ImportMetaEnv {
	readonly VITE_GOOGLE_LOGIN_CLIENT_ID: string;
}
