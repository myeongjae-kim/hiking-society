"use client";

import { Link as RouterLink } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ComponentType, ReactNode } from "react";

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
	children?: ReactNode;
	href: string;
};

export default function Link({ href, ...props }: AppLinkProps) {
	const AnyRouterLink = RouterLink as ComponentType<AppLinkProps>;

	return <AnyRouterLink href={href} {...props} />;
}
