// Re-export the useNotification hook from NotificationContext
export { useNotification, useNotificationHelpers } from '../contexts/NotificationContext';

// Additional notification-related hooks can be added here
export const useNotificationCount = () => {
  const { useNotification } = require('../contexts/NotificationContext');
  const { notifications, unreadCount } = useNotification();
  return { totalCount: notifications.length, unreadCount };
};

export const useNotificationFilter = (type?: string) => {
  const { useNotification } = require('../contexts/NotificationContext');
  const { notifications } = useNotification();
  if (type) {
    return notifications.filter((notification: any) => notification.type === type);
  }
  return notifications;
};
