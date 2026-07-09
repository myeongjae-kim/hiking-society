"use client";

import dayjs from "dayjs";
import "dayjs/locale/ko";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";

dayjs.extend(relativeTime);
dayjs.locale("ko");

type DateTimeLabelProps = {
	className?: string;
	value: string;
};

function getAbsoluteLabel(value: string) {
	const date = dayjs(value);

	if (!date.isValid()) {
		return value;
	}

	return date.format("YYYY.MM.DD HH:mm");
}

function getDisplayLabel(value: string) {
	const date = dayjs(value);

	if (!date.isValid()) {
		return value;
	}

	const now = dayjs();
	const daysFromNow = now.diff(date, "day", true);

	if (daysFromNow >= 0 && daysFromNow < 7) {
		return date.from(now);
	}

	return getAbsoluteLabel(value);
}

export function DateTimeLabel({ className, value }: DateTimeLabelProps) {
	const absoluteLabel = getAbsoluteLabel(value);
	const [isMounted, setIsMounted] = useState(false);
	const label = isMounted ? getDisplayLabel(value) : absoluteLabel;

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setIsMounted(true);
		}, 0);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, []);

	return (
		<time className={className} dateTime={value} title={absoluteLabel}>
			{label}
		</time>
	);
}
