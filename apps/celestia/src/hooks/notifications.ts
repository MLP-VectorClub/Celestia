import { useQuery } from '@tanstack/react-query';

import { AccountService } from 'src/services/account';

export const NOTIFICATIONS_KEY = '/notifications';

/** The signed in visitor's unread notifications. The old site was told over a websocket, here they are fetched again every minute and when the tab gets focus */
export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY],
    queryFn: () => AccountService.getNotifications().then((r) => r.data.notifications),
    enabled,
    refetchInterval: 60e3,
  });
}
