'use client';

import { useState } from 'react';

import { $api } from '@/app/common/api/$api';
import { apiQueryKeys } from '@/app/common/api/queryKeys';
import type { HikingFormValues } from '@/app/hiking/components/hikingFormTypes';
import type { Hiking, HikingId } from '@/core/hiking/domain';

import type { ActiveHikingForm } from '../utils/feedCrudTypes';
import type { FeedActionDeps } from './feedActionTypes';

type UseFeedHikingActionsInput = FeedActionDeps & {
  getHikingArticleCount: (hikingId: HikingId) => number;
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

export function useFeedHikingActions({
  getHikingArticleCount,
  invalidateQueryKeys,
  refreshRoute,
  runner,
  setConfirmState,
}: UseFeedHikingActionsInput) {
  const createHikingMutation = $api.useMutation('post', '/api/hikings');
  const updateHikingMutation = $api.useMutation('patch', '/api/hikings/{hikingId}');
  const deleteHikingMutation = $api.useMutation('delete', '/api/hikings/{hikingId}');
  const [activeHikingForm, setActiveHikingForm] = useState<ActiveHikingForm>(null);
  const activeHikingSingleFlightKey =
    activeHikingForm?.type === 'create'
      ? 'hiking-create'
      : activeHikingForm?.type === 'edit'
        ? `hiking-update-${activeHikingForm.hikingId}`
        : null;
  const activeHikingSubmitting =
    (activeHikingSingleFlightKey !== null && runner.isRunning(activeHikingSingleFlightKey)) ||
    (runner.isPending && runner.loadingLabel !== null);

  const closeActiveHikingForm = () => {
    if (activeHikingForm?.type === 'create') {
      runner.setError('hiking-new', null);
    }

    if (activeHikingForm?.type === 'edit') {
      runner.setError(`hiking-edit-${activeHikingForm.hikingId}`, null);
    }

    setActiveHikingForm(null);
  };

  const createHiking = (values: HikingFormValues) => {
    runner.runMutation(
      {
        errorKey: 'hiking-new',
        loadingLabel: '산행 저장 중',
        singleFlightKey: 'hiking-create',
      },
      async () => {
        await createHikingMutation.mutateAsync({ body: createHikingBody(values) });
        setActiveHikingForm(null);
        invalidateQueryKeys([apiQueryKeys.feed(), apiQueryKeys.notifications()]);
        refreshRoute();
      },
    );
  };

  const updateHiking = (hikingId: HikingId, values: HikingFormValues) => {
    runner.runMutation(
      {
        errorKey: `hiking-edit-${hikingId}`,
        loadingLabel: '산행 저장 중',
        singleFlightKey: `hiking-update-${hikingId}`,
      },
      async () => {
        await updateHikingMutation.mutateAsync({
          body: createHikingBody(values),
          params: { path: { hikingId } },
        });
        setActiveHikingForm(null);
        invalidateQueryKeys([apiQueryKeys.feed(), apiQueryKeys.hikingArticles(hikingId)]);
        refreshRoute();
      },
    );
  };

  const requestDeleteHiking = (hiking: Hiking) => {
    const hasArticles = getHikingArticleCount(hiking.id) > 0;

    if (hasArticles) {
      runner.setError(`hiking-${hiking.id}`, '글이 있는 산행은 삭제할 수 없습니다.');
      return;
    }

    setConfirmState({
      body: `${hiking.mountainName} 산행 기록을 삭제합니다.`,
      confirmLabel: '삭제',
      onConfirm: () => {
        runner.runMutation(
          {
            errorKey: `hiking-${hiking.id}`,
          },
          async () => {
            await deleteHikingMutation.mutateAsync({
              params: { path: { hikingId: hiking.id } },
            });
            setConfirmState(null);
            invalidateQueryKeys([apiQueryKeys.feed(), apiQueryKeys.hikingArticles(hiking.id)]);
            refreshRoute();
          },
        );
      },
      title: '산행 삭제',
    });
  };

  return {
    activeHikingForm,
    activeHikingSubmitting,
    closeActiveHikingForm,
    createHiking,
    requestDeleteHiking,
    setActiveHikingForm,
    updateHiking,
  };
}
