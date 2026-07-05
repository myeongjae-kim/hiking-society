'use client';

import { $api } from '@/app/common/api/$api';
import { apiQueryKeys } from '@/app/common/api/queryKeys';
import type { Hiking, HikingId } from '@/core/hiking/domain';

import type { FeedActionDeps } from './feedActionTypes';

type UseFeedHikingActionsInput = FeedActionDeps & {
  getHikingArticleCount: (hikingId: HikingId) => number;
  setActiveHikingForm: (form: { hikingId: HikingId; type: 'edit' } | { type: 'create' }) => void;
};

export function useFeedHikingActions({
  getHikingArticleCount,
  invalidateQueryKeys,
  refreshRoute,
  runner,
  setActiveHikingForm,
  setConfirmState,
}: UseFeedHikingActionsInput) {
  const deleteHikingMutation = $api.useMutation('delete', '/api/hikings/{hikingId}');

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
    requestDeleteHiking,
    setActiveHikingForm,
  };
}
