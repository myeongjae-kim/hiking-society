"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import { clientEnv } from "@/core/config/clientEnv";

const toasterOffset = { top: "1rem" };
const toasterMobileOffset = {
	left: "1rem",
	right: "1rem",
	top: "calc(env(safe-area-inset-top, 0px) + 1rem)",
};

const ClientDependencyContainer = (props: PropsWithChildren) => {
	return (
		<GoogleOAuthProvider clientId={clientEnv.VITE_GOOGLE_LOGIN_CLIENT_ID}>
			{props.children}
			<Toaster
				mobileOffset={toasterMobileOffset}
				offset={toasterOffset}
				position="top-center"
			/>
		</GoogleOAuthProvider>
	);
};

export default ClientDependencyContainer;
