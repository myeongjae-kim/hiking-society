import type { ClockPort } from "@/core/common/application/port/out/ClockPort";

export class SystemClockAdapter implements ClockPort {
	now() {
		return new Date();
	}
}
