import { Autowired } from '@/core/config/Autowired';
import type { ListNotificationsUseCase } from './port/in/ListNotificationsUseCase';
import type { NotificationQueryPort } from './port/out/NotificationQueryPort';

export class ListNotificationsService implements ListNotificationsUseCase {
  constructor(
    @Autowired('NotificationQueryPort')
    private notificationQueryPort: NotificationQueryPort,
  ) {}

  async list(input: Parameters<ListNotificationsUseCase['list']>[0]) {
    return this.notificationQueryPort.list(input);
  }
}
