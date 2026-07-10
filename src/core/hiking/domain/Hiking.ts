import type {
	Altitude,
	AuthorName,
	Brand,
	IsoDateString,
	IsoDateTimeString,
	Latitude,
	Longitude,
	Timezone,
} from "@/core/common/domain";

export type HikingId = Brand<string, "HikingId">;

export type Hiking = {
	readonly id: HikingId;
	readonly authorUserId?: number;
	readonly mountainName: string;
	readonly hikingDate: IsoDateString;
	readonly timezone: Timezone;
	readonly latitude: Latitude;
	readonly longitude: Longitude;
	readonly altitude: Altitude | null;
	readonly order: number;
	readonly startedAt: IsoDateTimeString;
	readonly completedAt: IsoDateTimeString;
	readonly participantsCsv: string;
	readonly restaurantAddress: string | null;
	readonly authorName: AuthorName;
	readonly createdAt: IsoDateTimeString;
	readonly updatedAt: IsoDateTimeString;
};

export type CreateHikingInput = {
	readonly authorUserId: number;
	readonly mountainName: string;
	readonly hikingDate: IsoDateString;
	readonly timezone: Timezone;
	readonly latitude: Latitude;
	readonly longitude: Longitude;
	readonly altitude: Altitude | null;
	readonly startedAt: IsoDateTimeString;
	readonly completedAt: IsoDateTimeString;
	readonly participantsCsv: string;
	readonly restaurantAddress: string | null;
};

export type UpdateHikingInput = {
	readonly mountainName?: string;
	readonly hikingDate?: IsoDateString;
	readonly timezone?: Timezone;
	readonly latitude?: Latitude;
	readonly longitude?: Longitude;
	readonly altitude?: Altitude | null;
	readonly startedAt?: IsoDateTimeString;
	readonly completedAt?: IsoDateTimeString;
	readonly participantsCsv?: string;
	readonly restaurantAddress?: string | null;
};

export type HikingEntitySnapshot = {
	readonly activeArticleCount: number;
	readonly authorUserId: number;
	readonly id: HikingId;
};

export type HikingDeleteDecision =
	| { readonly status: "ok"; readonly hikingId: HikingId }
	| { readonly status: "forbidden" }
	| {
			readonly activeArticleCount: number;
			readonly status: "has-active-articles";
	  };

export class HikingEntity {
	private constructor(private readonly snapshot: HikingEntitySnapshot) {}

	static rehydrate(snapshot: HikingEntitySnapshot) {
		return new HikingEntity(snapshot);
	}

	canBeManagedBy(userId: number) {
		return this.snapshot.authorUserId === userId;
	}

	canBeDeleted() {
		return this.snapshot.activeArticleCount === 0;
	}

	planUpdate(input: {
		readonly userId: number;
		readonly values: UpdateHikingInput;
	}) {
		if (!this.canBeManagedBy(input.userId)) {
			return null;
		}

		return {
			hikingId: this.snapshot.id,
			values: input.values,
		};
	}

	planDelete(input: { readonly userId: number }): HikingDeleteDecision {
		if (!this.canBeManagedBy(input.userId)) {
			return { status: "forbidden" };
		}

		if (!this.canBeDeleted()) {
			return {
				activeArticleCount: this.snapshot.activeArticleCount,
				status: "has-active-articles",
			};
		}

		return {
			hikingId: this.snapshot.id,
			status: "ok",
		};
	}
}
