'use client';

import type { KeyboardEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';

import { ActionButton } from '@/app/common/components/ActionButton';
import { Map, MapMarker, MarkerContent, type MapViewport } from '@/app/common/components/Map';
import { fieldClassName } from '@/app/common/components/styles';
import { fetchClient } from '@/app/common/api/$api';

const defaultCoordinate = {
  latitude: 37.5665,
  longitude: 126.978,
};

type GeocodingResult = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

type HikingLocationPickerProps = {
  latitude: string;
  longitude: string;
  onSelect: (coordinate: { latitude: string; longitude: string }) => void;
  submitting?: boolean;
};

function parseCoordinate(latitude: string, longitude: string) {
  if (!latitude.trim() || !longitude.trim()) {
    return null;
  }

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (
    Number.isFinite(parsedLatitude) &&
    Number.isFinite(parsedLongitude) &&
    parsedLatitude >= -90 &&
    parsedLatitude <= 90 &&
    parsedLongitude >= -180 &&
    parsedLongitude <= 180
  ) {
    return {
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    };
  }

  return null;
}

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

export function HikingLocationPicker({
  latitude,
  longitude,
  onSelect,
  submitting = false,
}: HikingLocationPickerProps) {
  const initialCoordinate = useMemo(
    () => parseCoordinate(latitude, longitude) ?? defaultCoordinate,
    [latitude, longitude],
  );
  const selectedCoordinate = parseCoordinate(latitude, longitude);
  const markerCoordinate = selectedCoordinate ?? initialCoordinate;
  const [viewport, setViewport] = useState<MapViewport>({
    bearing: 0,
    center: [initialCoordinate.longitude, initialCoordinate.latitude],
    pitch: 0,
    zoom: selectedCoordinate ? 12 : 8,
  });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [status, setStatus] = useState('주소를 검색하거나 지도에서 한 지점을 선택하세요.');
  const [isSearching, setIsSearching] = useState(false);

  const selectCoordinate = useCallback(
    (coordinate: { latitude: number; longitude: number }) => {
      onSelect({
        latitude: formatCoordinate(coordinate.latitude),
        longitude: formatCoordinate(coordinate.longitude),
      });
    },
    [onSelect],
  );

  const moveToCoordinate = useCallback(
    (coordinate: { latitude: number; longitude: number }, zoom = Math.max(viewport.zoom, 13)) => {
      selectCoordinate(coordinate);
      setViewport((currentViewport) => ({
        ...currentViewport,
        center: [coordinate.longitude, coordinate.latitude],
        zoom,
      }));
    },
    [selectCoordinate, viewport.zoom],
  );

  const handleMapClick = useCallback(
    (event: { lngLat: { lat: number; lng: number } }) =>
      moveToCoordinate({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      }),
    [moveToCoordinate],
  );

  const handleMarkerDragEnd = useCallback(
    (coordinate: { lat: number; lng: number }) =>
      moveToCoordinate({
        latitude: coordinate.lat,
        longitude: coordinate.lng,
      }),
    [moveToCoordinate],
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);

    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      setResults([]);
      setStatus('주소를 검색하거나 지도에서 한 지점을 선택하세요.');
      setIsSearching(false);
      return;
    }

    if (trimmedValue.length < 2) {
      setResults([]);
      setStatus('주소는 두 글자 이상 입력하세요.');
      setIsSearching(false);
    }
  };

  const searchAddress = useCallback((rawQuery: string) => {
    const trimmedQuery = rawQuery.trim();

    if (trimmedQuery.length < 2) {
      setStatus(
        trimmedQuery.length === 0
          ? '주소를 검색하거나 지도에서 한 지점을 선택하세요.'
          : '주소는 두 글자 이상 입력하세요.',
      );
      return;
    }

    setIsSearching(true);
    setStatus('주소 검색 중...');
    fetchClient
      .GET('/api/geocoding/search', {
        params: { query: { q: trimmedQuery } },
      })
      .then(({ data }) => {
        const nextResults = data?.results ?? [];
        setResults(nextResults);
        setStatus(
          nextResults.length > 0
            ? `${nextResults.length}개 결과를 찾았습니다.`
            : '검색 결과가 없습니다.',
        );
      })
      .catch((error: unknown) => {
        setResults([]);
        setStatus(error instanceof Error ? error.message : '주소 검색에 실패했습니다.');
      })
      .finally(() => setIsSearching(false));
  }, []);

  const handleQueryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    searchAddress(query);
  };

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      return;
    }

    let ignore = false;
    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);
      setStatus('주소 검색 중...');
      fetchClient
        .GET('/api/geocoding/search', {
          params: { query: { q: trimmedQuery } },
        })
        .then(({ data }) => {
          if (ignore) {
            return;
          }

          const nextResults = data?.results ?? [];
          setResults(nextResults);
          setStatus(
            nextResults.length > 0
              ? `${nextResults.length}개 결과를 찾았습니다.`
              : '검색 결과가 없습니다.',
          );
        })
        .catch((error: unknown) => {
          if (ignore) {
            return;
          }

          setResults([]);
          setStatus(error instanceof Error ? error.message : '주소 검색에 실패했습니다.');
        })
        .finally(() => {
          if (!ignore) {
            setIsSearching(false);
          }
        });
    }, 350);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          className={fieldClassName}
          disabled={submitting}
          onKeyDown={handleQueryKeyDown}
          onChange={(event) => handleQueryChange(event.currentTarget.value)}
          placeholder="산 이름, 지명, 주소 검색"
          value={query}
        />
        <ActionButton
          disabled={submitting || isSearching || query.trim().length < 2}
          onClick={() => searchAddress(query)}
        >
          검색
        </ActionButton>
      </div>
      {results.length > 0 ? (
        <div className="grid max-h-44 gap-1 overflow-y-auto border border-[var(--overlay0)] bg-[var(--background1)] p-1">
          {results.map((result) => (
            <button
              className="!grid !h-auto !min-h-0 w-full min-w-0 appearance-none content-start justify-items-start gap-1 !border !border-[var(--overlay0)] !bg-[var(--background0)] !bg-none !px-2 !py-2 text-left text-sm leading-[1.35] !text-[var(--foreground0)] hover:!bg-[var(--surface1)] focus:font-normal focus:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
              disabled={submitting}
              key={result.id}
              onClick={() =>
                moveToCoordinate({
                  latitude: result.latitude,
                  longitude: result.longitude,
                })
              }
              type="button"
            >
              <span className="min-w-0 [overflow-wrap:anywhere] whitespace-normal">
                {result.label}
              </span>
              <span className="mt-0.5 block font-mono text-xs text-[var(--subtext0)]">
                {formatCoordinate(result.latitude)}, {formatCoordinate(result.longitude)}
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="relative h-[20rem] min-h-0 overflow-hidden border border-[var(--overlay0)] bg-[var(--background1)]">
        <Map
          center={[initialCoordinate.longitude, initialCoordinate.latitude]}
          className="h-full"
          onClick={handleMapClick}
          onViewportChange={setViewport}
          viewport={viewport}
          zoom={viewport.zoom}
        >
          <MapMarker
            draggable={!submitting}
            latitude={markerCoordinate.latitude}
            longitude={markerCoordinate.longitude}
            onDragEnd={handleMarkerDragEnd}
          >
            <MarkerContent>
              <div className="cursor-move text-[var(--red)] drop-shadow-[0_1px_1px_var(--background0)]">
                <MapPin aria-hidden="true" fill="currentColor" size={30} strokeWidth={1.5} />
              </div>
            </MarkerContent>
          </MapMarker>
        </Map>
        <div className="pointer-events-none absolute top-2 left-2 border border-[var(--overlay0)] bg-[color-mix(in_srgb,var(--background1)_86%,transparent)] px-2 py-1 font-mono text-xs text-[var(--foreground1)]">
          {formatCoordinate(markerCoordinate.latitude)},{' '}
          {formatCoordinate(markerCoordinate.longitude)}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="m-0 text-xs leading-[1.35] text-[var(--subtext0)]">{status}</p>
      </div>
    </div>
  );
}
