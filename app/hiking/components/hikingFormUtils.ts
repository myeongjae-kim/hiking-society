import type { Hiking } from '@/core/hiking/domain';

import type { HikingFormValues } from './hikingFormTypes';

const defaultTimezone = 'Asia/Seoul';

function getTimeValue(value: string) {
  return value.slice(11, 16);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function getHikingFormDefaults(hiking?: Hiking): HikingFormValues {
  return {
    completedTime: hiking ? getTimeValue(hiking.completedAt) : '',
    hikingDate: hiking?.hikingDate ?? todayIsoDate(),
    latitude: hiking ? String(hiking.latitude) : '',
    longitude: hiking ? String(hiking.longitude) : '',
    mountainName: hiking?.mountainName ?? '',
    participantsCsv: hiking?.participantsCsv ?? '',
    restaurantAddress: hiking?.restaurantAddress ?? '',
    startedTime: hiking ? getTimeValue(hiking.startedAt) : '',
    timezone: hiking?.timezone ?? defaultTimezone,
  };
}

export function formatDateLabel(value: string) {
  return value;
}

export function formatTimeLabel(value: string) {
  return value.slice(11, 16);
}

export function getHikingMeta(hiking: Hiking) {
  return [
    `date=${formatDateLabel(hiking.hikingDate)}`,
    `tz=${hiking.timezone}`,
    `start=${formatTimeLabel(hiking.startedAt)}`,
    `done=${formatTimeLabel(hiking.completedAt)}`,
    `lat=${hiking.latitude}`,
    `lng=${hiking.longitude}`,
  ];
}
