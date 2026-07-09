import type {
	CreateHikingInput,
	HikingId,
	UpdateHikingInput,
} from "@/core/hiking/domain";

export type ActiveHikingCommandSnapshot = {
	readonly activeArticleCount: number;
	readonly authorUserId: number;
	readonly id: HikingId;
};

export interface HikingCommandPort {
	create(input: CreateHikingInput): Promise<void>;
	delete(input: { hikingId: HikingId; now: Date }): Promise<boolean>;
	findActiveHikingById(
		hikingId: HikingId,
	): Promise<ActiveHikingCommandSnapshot | null>;
	update(input: {
		hikingId: HikingId;
		now: Date;
		values: UpdateHikingInput;
	}): Promise<boolean>;
}
