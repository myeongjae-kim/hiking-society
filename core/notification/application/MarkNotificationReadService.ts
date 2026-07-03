import { Autowired } from '@/core/config/Autowired';
import type { MarkAllNotificationsReadUseCase } from './port/in/MarkAllNotificationsReadUseCase';
import type { MarkNotificationReadUseCase } from './port/in/MarkNotificationReadUseCase';
import type { NotificationCommandPort } from './port/out/NotificationCommandPort';

export class MarkNotificationReadService
  implements MarkNotificationReadUseCase, MarkAllNotificationsReadUseCase
{
  constructor(
    @Autowired('NotificationCommandPort')
    private notificationCommandPort: NotificationCommandPort,
  ) {}

  async markAllRead(input: Parameters<MarkAllNotificationsReadUseCase['markAllRead']>[0]) {
    await this.notificationCommandPort.markAllRead(input);
  }

  async markRead(input: Parameters<MarkNotificationReadUseCase['markRead']>[0]) {
    await this.notificationCommandPort.markRead(input);
  }
}
