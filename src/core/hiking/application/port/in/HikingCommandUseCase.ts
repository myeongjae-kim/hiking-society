import type {
	CreateHikingInput,
	HikingId,
	UpdateHikingInput,
} from "@/core/hiking/domain";

export interface HikingCommandUseCase {
	create(input: CreateHikingInput): Promise<void>;
	update(input: {
		hikingId: HikingId;
		userId: number;
		values: UpdateHikingInput;
	}): Promise<void>;
	delete(input: { hikingId: HikingId; userId: number }): Promise<void>;
}
