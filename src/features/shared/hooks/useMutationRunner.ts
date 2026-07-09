"use client";

import { useCallback, useState, useTransition } from "react";

import { useSingleFlightAction } from "./useSingleFlightAction";

type RunMutationOptions = {
	errorKey: string;
	loadingLabel?: string;
	onSettled?: () => void;
	singleFlightKey?: string;
};

export function useMutationRunner() {
	const singleFlightAction = useSingleFlightAction();
	const [isPending, startTransition] = useTransition();
	const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});
	const [loadingLabel, setLoadingLabel] = useState<string | null>(null);

	const setError = useCallback((key: string, value: string | null) => {
		setErrorByKey((currentErrors) => {
			const nextErrors = { ...currentErrors };

			if (value === null) {
				delete nextErrors[key];
			} else {
				nextErrors[key] = value;
			}

			return nextErrors;
		});
	}, []);

	const runMutation = useCallback(
		(options: RunMutationOptions, mutation: () => Promise<void>) => {
			const execute = async () => {
				setLoadingLabel(options.loadingLabel ?? null);

				await new Promise<void>((resolve) => {
					startTransition(async () => {
						try {
							await mutation();
							setError(options.errorKey, null);
						} catch (error) {
							setError(
								options.errorKey,
								error instanceof Error
									? error.message
									: "요청을 처리하지 못했습니다.",
							);
						} finally {
							options.onSettled?.();
							resolve();
						}
					});
				});
			};

			if (options.singleFlightKey) {
				void singleFlightAction.run(options.singleFlightKey, execute);
				return;
			}

			void execute();
		},
		[setError, singleFlightAction, startTransition],
	);

	return {
		errorByKey,
		isPending,
		isRunning: singleFlightAction.isRunning,
		loadingLabel,
		runMutation,
		setError,
		setLoadingLabel,
	};
}
