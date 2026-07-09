import type { MemberListItem } from "@/core/member/model/MemberListItem";

export interface ListMembersUseCase {
	list(): Promise<MemberListItem[]>;
}
