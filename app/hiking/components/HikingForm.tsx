'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';

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

export function HikingForm({
  error,
  hiking,
  onCancel,
  onSubmit,
  submitting = false,
}: HikingFormProps) {
  const [values, setValues] = useState(() => getHikingFormDefaults(hiking));
  const [metadataStatus, setMetadataStatus] = useState(
    '사진을 선택하면 EXIF 좌표와 촬영시각을 채웁니다.',
  );

  const updateValue = (key: keyof HikingFormValues, value: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  };

  const handleMetadataFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    setMetadataStatus('EXIF 메타정보를 읽는 중...');

    try {
      const metadata = await readPhotoMetadataFromFile(file);
      const hasGps =
        typeof metadata.latitude === 'number' && typeof metadata.longitude === 'number';
      const appliedLabels: string[] = [];
      const missingLabels: string[] = [];

      if (!hasGps && !metadata.takenAt) {
        setMetadataStatus('이 사진에서 EXIF 좌표와 촬영시각을 찾지 못했습니다.');
        return;
      }

      setValues((currentValues) => ({
        ...currentValues,
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
    } finally {
      input.value = '';
    }
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
      <Command>{hiking ? `산행 수정: ${hiking.id}` : '산행 등록'}</Command>
      <div className="grid gap-1.5">
        <label className={inlineButtonClassName}>
          사진에서 메타정보 채우기
          <input
            accept="image/jpeg,image/tiff"
            className={hiddenFileInputClassName}
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
