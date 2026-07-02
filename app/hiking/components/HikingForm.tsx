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

import { readGpsFromFile } from './exifGps';
import type { HikingFormValues } from './hikingFormTypes';
import { getHikingFormDefaults } from './hikingFormUtils';

type HikingFormProps = {
  error?: string;
  hiking?: Hiking;
  onCancel: () => void;
  onSubmit: (values: HikingFormValues) => void;
};

export function HikingForm({ error, hiking, onCancel, onSubmit }: HikingFormProps) {
  const [values, setValues] = useState(() => getHikingFormDefaults(hiking));
  const [gpsStatus, setGpsStatus] = useState('EXIF 좌표를 읽을 사진을 선택하세요.');

  const updateValue = (key: keyof HikingFormValues, value: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  };

  const handleGpsFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    setGpsStatus('EXIF 좌표를 읽는 중...');

    try {
      const gps = await readGpsFromFile(file);

      if (!gps) {
        setGpsStatus('이 사진에서 EXIF 위경도를 찾지 못했습니다.');
        return;
      }

      setValues((currentValues) => ({
        ...currentValues,
        latitude: gps.latitude.toFixed(6),
        longitude: gps.longitude.toFixed(6),
      }));
      setGpsStatus(`${file.name}에서 좌표를 반영했습니다.`);
    } catch {
      setGpsStatus('EXIF 좌표를 읽지 못했습니다.');
    } finally {
      input.value = '';
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form
      className={`grid gap-4 bg-[var(--surface0)] !p-4 ${boxBorderClassName}`}
      box-="round"
      onSubmit={handleSubmit}
    >
      <Command>{hiking ? `산행 수정: ${hiking.id}` : '산행 등록'}</Command>
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
        <FieldLabel label="식당 주소">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('restaurantAddress', event.currentTarget.value)}
            value={values.restaurantAddress}
          />
        </FieldLabel>
        <div className="grid content-end gap-1.5">
          <label className={inlineButtonClassName}>
            사진에서 좌표 읽기
            <input
              accept="image/jpeg,image/tiff"
              className={hiddenFileInputClassName}
              onChange={handleGpsFileChange}
              type="file"
            />
          </label>
          <p className="m-0 text-xs leading-[1.35] text-[var(--subtext0)]">{gpsStatus}</p>
        </div>
      </div>
      {error ? <p className="m-0 text-sm text-[var(--red)]">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <ActionButton onClick={onCancel}>취소</ActionButton>
        <ActionButton type="submit">저장</ActionButton>
      </div>
    </form>
  );
}
