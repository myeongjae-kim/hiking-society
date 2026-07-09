import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import type { MemberListItem } from "./MemberListItem";

export type MemberManagementResult =
	| {
			readonly status: "forbidden";
	  }
	| {
			readonly actor: AuthenticatedUser;
			readonly members: readonly MemberListItem[];
			readonly status: "ok";
	  };
