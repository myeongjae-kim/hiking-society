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
}
