'use client';

import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { useState } from 'react';
import dynamic from 'next/dynamic';

import { ActionButton } from '@/app/common/components/ActionButton';
import { Command } from '@/app/common/components/Command';
import { FieldLabel } from '@/app/common/components/FieldLabel';
import {
  boxBorderClassName,
  fieldClassName,
  hiddenFileInputClassName,
  inlineButtonClassName,
} from '@/app/common/components/styles';
import type { Hiking } from '@/core/hiking/domain';

import { readPhotoMetadataFromFile } from './exifGps';
import type { HikingFormValues } from './hikingFormTypes';
import { getHikingFormDefaults } from './hikingFormUtils';

const HikingLocationPicker = dynamic(
  () => import('./HikingLocationPicker').then((module) => module.HikingLocationPicker),
  {
    loading: () => (
      <div className="grid h-[20rem] place-items-center border border-[var(--overlay0)] bg-[var(--background1)] text-sm text-[var(--subtext0)]">
        지도 불러오는 중...
      </div>
    ),
    ssr: false,
  },
);

const exifPhotoAccept =
  'image/jpeg,image/tiff,image/heic,image/heif,.jpg,.jpeg,.tif,.tiff,.heic,.heif';
const exifPhotoTypes = new Set(['image/jpeg', 'image/tiff', 'image/heic', 'image/heif']);
const exifPhotoFileNamePattern = /\.(jpe?g|tiff?|heic|heif)$/i;

type HikingFormProps = {
  error?: string;
  hiking?: Hiking;
  onCancel: () => void;
  onSubmit: (values: HikingFormValues) => void;
  submitting?: boolean;
};

function shiftTimeValue(time: string, offsetMinutes: number) {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  const minutesInDay = 24 * 60;
  const shiftedMinutes = (hour * 60 + minute + offsetMinutes + minutesInDay) % minutesInDay;
  const shiftedHour = Math.floor(shiftedMinutes / 60);
  const shiftedMinute = shiftedMinutes % 60;

  return `${String(shiftedHour).padStart(2, '0')}:${String(shiftedMinute).padStart(2, '0')}`;
}

function isExifPhotoFile(file: File) {
  return exifPhotoTypes.has(file.type.toLowerCase()) || exifPhotoFileNamePattern.test(file.name);
}

function formatAltitudeValue(value: number) {
  return String(Math.round(value * 10) / 10);
}

export function HikingForm({
  error,
  hiking,
  onCancel,
  onSubmit,
  submitting = false,
}: HikingFormProps) {
  const [values, setValues] = useState(() => getHikingFormDefaults(hiking));
  const [metadataStatus, setMetadataStatus] = useState(
    '사진을 선택하거나 드롭하면 EXIF 좌표, 고도, 촬영시각을 채웁니다.',
  );
  const [isMetadataDropActive, setIsMetadataDropActive] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  const updateValue = (key: keyof HikingFormValues, value: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  };

  const readMetadataFromFiles = async (files: File[]) => {
    if (submitting || files.length === 0) {
      return;
    }

    const file = files.find(isExifPhotoFile);

    if (!file) {
      setMetadataStatus('EXIF를 읽을 수 있는 JPEG/TIFF/HEIC/HEIF 사진만 지원합니다.');
      return;
    }

    setMetadataStatus('EXIF 메타정보를 읽는 중...');

    try {
      const metadata = await readPhotoMetadataFromFile(file);
      const hasGps =
        typeof metadata.latitude === 'number' && typeof metadata.longitude === 'number';
      const altitude = metadata.altitude;
      const hasAltitude = typeof altitude === 'number';
      const appliedLabels: string[] = [];
      const missingLabels: string[] = [];

      if (!hasGps && !hasAltitude && !metadata.takenAt) {
        setMetadataStatus('이 사진에서 EXIF 좌표, 고도, 촬영시각을 찾지 못했습니다.');
        return;
      }

      setValues((currentValues) => ({
        ...currentValues,
        ...(hasAltitude
          ? {
              altitude: formatAltitudeValue(altitude),
            }
          : {}),
        ...(hasGps
          ? {
              latitude: metadata.latitude?.toFixed(6) ?? currentValues.latitude,
              longitude: metadata.longitude?.toFixed(6) ?? currentValues.longitude,
            }
          : {}),
        ...(metadata.takenAt
          ? {
              completedTime: shiftTimeValue(metadata.takenAt.time, 60),
              hikingDate: metadata.takenAt.date,
              startedTime: shiftTimeValue(metadata.takenAt.time, -90),
            }
          : {}),
      }));

      if (hasGps) {
        appliedLabels.push('좌표');
      } else {
        missingLabels.push('좌표');
      }

      if (hasAltitude) {
        appliedLabels.push(`고도 ${formatAltitudeValue(altitude)}m`);
      } else {
        missingLabels.push('고도');
      }

      if (metadata.takenAt) {
        appliedLabels.push(`촬영시각 ${metadata.takenAt.date} ${metadata.takenAt.time}`);
      } else {
        missingLabels.push('촬영시각');
      }

      setMetadataStatus(
        `${file.name}: ${appliedLabels.join(', ')} 반영${
          missingLabels.length > 0 ? ` (${missingLabels.join(', ')} 없음)` : ''
        }.`,
      );
    } catch {
      setMetadataStatus('EXIF 메타정보를 읽지 못했습니다.');
    }
  };

  const handleMetadataFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);

    input.value = '';
    await readMetadataFromFiles(files);
  };

  const hasFileTransfer = (event: DragEvent<HTMLElement>) =>
    Array.from(event.dataTransfer.types).includes('Files');

  const handleMetadataDropAreaDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (submitting || !hasFileTransfer(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsMetadataDropActive(true);
  };

  const handleMetadataDropAreaDrop = async (event: DragEvent<HTMLDivElement>) => {
    if (!hasFileTransfer(event)) {
      return;
    }

    event.preventDefault();
    setIsMetadataDropActive(false);
    await readMetadataFromFiles(Array.from(event.dataTransfer.files));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    onSubmit(values);
  };

  return (
    <form
      className={`grid gap-4 bg-[var(--surface0)] !p-4 ${boxBorderClassName}`}
      box-="round"
      onSubmit={handleSubmit}
    >
      <Command>{hiking ? `hiking.edit: ${hiking.id}` : 'hiking.new'}</Command>
      <div
        className={`grid gap-1.5 border border-dashed p-3 transition-[background-color,border-color,opacity] ${
          submitting ? 'opacity-70' : ''
        } ${
          isMetadataDropActive
            ? 'border-[var(--blue)] bg-[var(--surface1)]'
            : 'border-[var(--overlay0)] bg-[var(--background0)]'
        }`}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsMetadataDropActive(false);
          }
        }}
        onDragOver={handleMetadataDropAreaDragOver}
        onDrop={handleMetadataDropAreaDrop}
      >
        <label className={inlineButtonClassName}>
          사진에서 메타정보 채우기
          <input
            accept={exifPhotoAccept}
            className={hiddenFileInputClassName}
            disabled={submitting}
            onChange={handleMetadataFileChange}
            type="file"
          />
        </label>
        <p className="m-0 text-xs leading-[1.35] text-[var(--subtext0)]">{metadataStatus}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel label="산 이름">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('mountainName', event.currentTarget.value)}
            required
            value={values.mountainName}
          />
        </FieldLabel>
        <FieldLabel label="산행 날짜">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('hikingDate', event.currentTarget.value)}
            required
            type="date"
            value={values.hikingDate}
          />
        </FieldLabel>
        <FieldLabel label="타임존">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('timezone', event.currentTarget.value)}
            required
            value={values.timezone}
          />
        </FieldLabel>
        <FieldLabel label="참석자 (쉼표로 구분)">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('participantsCsv', event.currentTarget.value)}
            required
            value={values.participantsCsv}
          />
        </FieldLabel>
        <FieldLabel label="출발 시각">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('startedTime', event.currentTarget.value)}
            required
            type="time"
            value={values.startedTime}
          />
        </FieldLabel>
        <FieldLabel label="하산 완료 시각">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('completedTime', event.currentTarget.value)}
            required
            type="time"
            value={values.completedTime}
          />
        </FieldLabel>
        <FieldLabel label="위도">
          <input
            className={fieldClassName}
            inputMode="decimal"
            onChange={(event) => updateValue('latitude', event.currentTarget.value)}
            required
            value={values.latitude}
          />
        </FieldLabel>
        <FieldLabel label="경도">
          <input
            className={fieldClassName}
            inputMode="decimal"
            onChange={(event) => updateValue('longitude', event.currentTarget.value)}
            required
            value={values.longitude}
          />
        </FieldLabel>
        <div className="grid gap-2 sm:col-span-2">
          <button
            aria-expanded={isLocationPickerOpen}
            className={`${inlineButtonClassName} justify-self-start`}
            onClick={() => setIsLocationPickerOpen((open) => !open)}
            type="button"
          >
            지도에서 좌표 선택
          </button>
          {isLocationPickerOpen ? (
            <div className="border border-[var(--overlay0)] bg-[var(--background0)] p-3">
              <HikingLocationPicker
                latitude={values.latitude}
                longitude={values.longitude}
                onSelect={(coordinate) =>
                  setValues((currentValues) => ({
                    ...currentValues,
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude,
                  }))
                }
                submitting={submitting}
              />
            </div>
          ) : null}
        </div>
        <FieldLabel label="고도(m)">
          <input
            className={fieldClassName}
            inputMode="decimal"
            onChange={(event) => updateValue('altitude', event.currentTarget.value)}
            value={values.altitude}
          />
        </FieldLabel>
        <FieldLabel label="식당 주소 (생략 가능)">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('restaurantAddress', event.currentTarget.value)}
            value={values.restaurantAddress}
          />
        </FieldLabel>
      </div>
      {error ? <p className="m-0 text-sm text-[var(--red)]">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <ActionButton onClick={onCancel}>취소</ActionButton>
        <ActionButton disabled={submitting} type="submit">
          저장
        </ActionButton>
      </div>
    </form>
  );
}
