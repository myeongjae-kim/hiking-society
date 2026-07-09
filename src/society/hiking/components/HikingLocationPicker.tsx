"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { $api } from "#/api/client/$api";
import {
	Map as HikingMap,
	MapMarker,
	type MapViewport,
	MarkerContent,
	useMap,
} from "#/society/hiking/components/map";
import { ActionButton } from "#/society/shared/components/ActionButton";
import { fieldClassName } from "#/society/shared/components/styles";

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

function MapClickHandler({
	onClick,
}: {
	onClick: (coordinate: { latitude: number; longitude: number }) => void;
}) {
	const { map } = useMap();

	useEffect(() => {
		if (!map) {
			return;
		}

		const handleClick = (event: { lngLat: { lat: number; lng: number } }) => {
			onClick({
				latitude: event.lngLat.lat,
				longitude: event.lngLat.lng,
			});
		};

		map.on("click", handleClick);

		return () => {
			map.off("click", handleClick);
		};
	}, [map, onClick]);

	return null;
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
	const viewportTransition = useMemo(() => ({ duration: 700 }), []);
	const [query, setQuery] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const trimmedQuery = query.trim();
	const geocodingQuery = $api.useQuery(
		"get",
		"/api/geocoding/search",
		{ params: { query: { q: searchTerm } } },
		{ enabled: searchTerm.length >= 2 && trimmedQuery.length >= 2 },
	);
	const results =
		trimmedQuery.length >= 2 &&
		searchTerm.length >= 2 &&
		searchTerm === trimmedQuery
			? ((geocodingQuery.data?.results ?? []) as GeocodingResult[])
			: [];
	const isSearching = geocodingQuery.isFetching;
	const status =
		trimmedQuery.length === 0
			? "주소를 검색하거나 지도에서 한 지점을 선택하세요."
			: trimmedQuery.length < 2
				? "주소는 두 글자 이상 입력하세요."
				: geocodingQuery.isFetching
					? "주소 검색 중..."
					: geocodingQuery.error
						? geocodingQuery.error instanceof Error
							? geocodingQuery.error.message
							: "주소 검색에 실패했습니다."
						: searchTerm !== trimmedQuery
							? "주소 검색 중..."
							: results.length > 0
								? `${results.length}개 결과를 찾았습니다.`
								: searchTerm.length >= 2
									? "검색 결과가 없습니다."
									: "주소 검색 중...";

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
		(
			coordinate: { latitude: number; longitude: number },
			zoom = Math.max(viewport.zoom, 13),
		) => {
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
		(coordinate: { latitude: number; longitude: number }) =>
			moveToCoordinate(coordinate),
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
	};

	const searchAddress = useCallback((rawQuery: string) => {
		const trimmedQuery = rawQuery.trim();

		if (trimmedQuery.length < 2) {
			return;
		}

		setSearchTerm(trimmedQuery);
	}, []);

	const handleQueryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key !== "Enter") {
			return;
		}

		event.preventDefault();
		searchAddress(query);
	};

	useEffect(() => {
		if (trimmedQuery.length < 2) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setSearchTerm(trimmedQuery);
		}, 350);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [trimmedQuery]);

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
							className="!block !h-auto !min-h-0 !border !border-[var(--overlay0)] !bg-[var(--background0)] !bg-none !px-2 !py-2 !text-[var(--foreground0)] hover:!bg-[var(--surface1)] w-full min-w-0 appearance-none overflow-hidden text-left text-sm leading-[1.35] focus:font-normal focus:no-underline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2"
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
							<span className="block min-w-0 truncate text-left">
								{result.label}
							</span>
						</button>
					))}
				</div>
			) : null}
			<div className="relative h-[20rem] min-h-0 overflow-hidden border border-[var(--overlay0)] bg-[var(--background1)]">
				<HikingMap
					center={[initialCoordinate.longitude, initialCoordinate.latitude]}
					className="h-full"
					onViewportChange={setViewport}
					viewport={viewport}
					viewportTransition={viewportTransition}
					zoom={viewport.zoom}
				>
					<MapClickHandler onClick={handleMapClick} />
					<MapMarker
						draggable={!submitting}
						latitude={markerCoordinate.latitude}
						longitude={markerCoordinate.longitude}
						onDragEnd={handleMarkerDragEnd}
					>
						<MarkerContent className="cursor-move" />
					</MapMarker>
				</HikingMap>
				<div className="pointer-events-none absolute top-2 left-2 border border-[var(--overlay0)] bg-[color-mix(in_srgb,var(--background1)_86%,transparent)] px-2 py-1 font-mono text-[var(--foreground1)] text-xs">
					{formatCoordinate(markerCoordinate.latitude)},{" "}
					{formatCoordinate(markerCoordinate.longitude)}
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<p className="m-0 text-[var(--subtext0)] text-xs leading-[1.35]">
					{status}
				</p>
			</div>
		</div>
	);
}
