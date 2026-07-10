import type { HikingViewModel as Hiking } from "#/society/shared/viewModels";

import type { HikingFormValues } from "./hikingFormTypes";

const defaultTimezone = "Asia/Seoul";

function getTimeValue(value: string) {
	return value.slice(11, 16);
}

function todayIsoDate() {
	return new Date().toISOString().slice(0, 10);
}

export function getHikingFormDefaults(hiking?: Hiking): HikingFormValues {
	return {
		altitude:
			hiking?.altitude === null || hiking?.altitude === undefined
				? ""
				: String(hiking.altitude),
		completedTime: hiking ? getTimeValue(hiking.completedAt) : "",
		hikingDate: hiking?.hikingDate ?? todayIsoDate(),
		latitude: hiking ? String(hiking.latitude) : "",
		longitude: hiking ? String(hiking.longitude) : "",
		mountainName: hiking?.mountainName ?? "",
		participantsCsv: hiking?.participantsCsv ?? "",
		restaurantAddress: hiking?.restaurantAddress ?? "",
		startedTime: hiking ? getTimeValue(hiking.startedAt) : "",
		timezone: hiking?.timezone ?? defaultTimezone,
	};
}

export function formatDateLabel(value: string) {
	const [year, month, day] = value.split("-");

	if (!year || !month || !day) {
		return value;
	}

	return `${year}.${month}.${day}`;
}

export function formatTimeLabel(value: string) {
	return value.slice(11, 16);
}

function formatDurationLabel(startedAt: string, completedAt: string) {
	const startedMs = Date.parse(startedAt);
	const completedMs = Date.parse(completedAt);

	if (
		!Number.isFinite(startedMs) ||
		!Number.isFinite(completedMs) ||
		completedMs < startedMs
	) {
		return null;
	}

	const totalMinutes = Math.round((completedMs - startedMs) / 60000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (hours === 0) {
		return `${minutes}분`;
	}

	if (minutes === 0) {
		return `${hours}시간`;
	}

	return `${hours}시간 ${minutes}분`;
}

function formatCoordinateLabel(value: number) {
	return value.toFixed(4);
}

function getParticipantLabels(participantsCsv: string) {
	return participantsCsv
		.split(",")
		.map((participant) => participant.trim())
		.filter(Boolean);
}

export function getHikingDisplay(hiking: Hiking) {
	const startedTime = formatTimeLabel(hiking.startedAt);
	const completedTime = formatTimeLabel(hiking.completedAt);

	return {
		altitudeLabel:
			hiking.altitude === null
				? "고도 미기록"
				: `${Math.round(hiking.altitude)}m`,
		dateLabel: formatDateLabel(hiking.hikingDate),
		durationLabel: formatDurationLabel(hiking.startedAt, hiking.completedAt),
		latitudeLabel: formatCoordinateLabel(hiking.latitude),
		longitudeLabel: formatCoordinateLabel(hiking.longitude),
		participants: getParticipantLabels(hiking.participantsCsv),
		restaurantLabel: hiking.restaurantAddress,
		timeRangeLabel: `${startedTime}-${completedTime}`,
		timezoneLabel: hiking.timezone,
	};
}
