"use client";

import { $api } from "#/api/client/$api";
import { apiQueryKeys } from "#/api/client/queryKeys";
import type { HikingFormValues } from "#/features/hiking/components/hikingFormTypes";
import type { HikingId } from "@/core/hiking/domain";

import type { ActiveHikingForm } from "../utils/feedCrudTypes";
import type { FeedActionDeps } from "./feedActionTypes";

type UseFeedHikingDialogActionsInput = FeedActionDeps & {
	activeHikingForm: ActiveHikingForm;
	setActiveHikingForm: (form: ActiveHikingForm) => void;
};

function createHikingBody(values: HikingFormValues) {
	return {
		altitude: values.altitude.trim() ? Number(values.altitude) : null,
		completedTime: values.completedTime,
		hikingDate: values.hikingDate,
		latitude: Number(values.latitude),
		longitude: Number(values.longitude),
		mountainName: values.mountainName,
		participantsCsv: values.participantsCsv,
		restaurantAddress: values.restaurantAddress,
		startedTime: values.startedTime,
		timezone: values.timezone,
	};
}

export function useFeedHikingDialogActions({
	activeHikingForm,
	invalidateQueryKeys,
	refreshRoute,
	runner,
	setActiveHikingForm,
}: UseFeedHikingDialogActionsInput) {
	const createHikingMutation = $api.useMutation("post", "/api/hikings");
	const updateHikingMutation = $api.useMutation(
		"patch",
		"/api/hikings/{hikingId}",
	);
	const activeHikingSingleFlightKey =
		activeHikingForm?.type === "create"
			? "hiking-create"
			: activeHikingForm?.type === "edit"
				? `hiking-update-${activeHikingForm.hikingId}`
				: null;
	const activeHikingSubmitting =
		(activeHikingSingleFlightKey !== null &&
			runner.isRunning(activeHikingSingleFlightKey)) ||
		(runner.isPending && runner.loadingLabel !== null);

	const closeActiveHikingForm = () => {
		if (activeHikingForm?.type === "create") {
			runner.setError("hiking-new", null);
		}

		if (activeHikingForm?.type === "edit") {
			runner.setError(`hiking-edit-${activeHikingForm.hikingId}`, null);
		}

		setActiveHikingForm(null);
	};

	const createHiking = (values: HikingFormValues) => {
		runner.runMutation(
			{
				errorKey: "hiking-new",
				loadingLabel: "산행 저장 중",
				singleFlightKey: "hiking-create",
			},
			async () => {
				await createHikingMutation.mutateAsync({
					body: createHikingBody(values),
				});
				setActiveHikingForm(null);
				invalidateQueryKeys([
					apiQueryKeys.feed(),
					apiQueryKeys.notifications(),
				]);
				refreshRoute();
			},
		);
	};

	const updateHiking = (hikingId: HikingId, values: HikingFormValues) => {
		runner.runMutation(
			{
				errorKey: `hiking-edit-${hikingId}`,
				loadingLabel: "산행 저장 중",
				singleFlightKey: `hiking-update-${hikingId}`,
			},
			async () => {
				await updateHikingMutation.mutateAsync({
					body: createHikingBody(values),
					params: { path: { hikingId } },
				});
				setActiveHikingForm(null);
				invalidateQueryKeys([
					apiQueryKeys.feed(),
					apiQueryKeys.hikingArticles(hikingId),
				]);
				refreshRoute();
			},
		);
	};

	return {
		activeHikingSubmitting,
		closeActiveHikingForm,
		createHiking,
		updateHiking,
	};
}
