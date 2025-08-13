import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Notification interface
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // Auto-dismiss duration in milliseconds
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
}

// Context state interface
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

// Context actions
type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'UPDATE_UNREAD_COUNT' };

// Context interface
interface NotificationContextType extends NotificationState {
  showNotification: (
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

// Notification reducer
const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload),
      };
    case 'CLEAR_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        unreadCount: 0,
      };
    case 'UPDATE_UNREAD_COUNT':
      return {
        ...state,
        unreadCount: state.notifications.length,
      };
    default:
      return state;
  }
};

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider props interface
interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
}

// Notification provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 10,
  defaultDuration = 5000,
}) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Generate unique ID for notifications
  const generateId = (): string => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Show notification function
  const showNotification = React.useCallback((
    type: NotificationType,
    title: string,
    message: string,
    options: {
      duration?: number;
      action?: { label: string; onClick: () => void };
    } = {}
  ): string => {
    const id = generateId();
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration: options.duration ?? defaultDuration,
      action: options.action,
      timestamp: Date.now(),
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

    // Auto-dismiss notification
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    return id;
  }, [defaultDuration, dispatch]);

  // Remove notification function
  const removeNotification = React.useCallback((id: string): void => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, [dispatch]);

  // Clear all notifications function
  const clearAllNotifications = React.useCallback((): void => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  }, [dispatch]);

  // Mark notification as read function
  const markAsRead = React.useCallback((id: string): void => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  }, [dispatch]);

  // Mark all notifications as read function
  const markAllAsRead = React.useCallback((): void => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  }, [dispatch]);

  // Limit number of notifications
  useEffect(() => {
    if (state.notifications.length > maxNotifications) {
      const notificationsToRemove = state.notifications.slice(maxNotifications);
      notificationsToRemove.forEach(notification => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
      });
    }
  }, [state.notifications.length, maxNotifications]);

  // Update unread count when notifications change
  useEffect(() => {
    dispatch({ type: 'UPDATE_UNREAD_COUNT' });
  }, [state.notifications]);

  // Context value
  const contextValue: NotificationContextType = React.useMemo(() => ({
    ...state,
    showNotification,
    removeNotification,
    clearAllNotifications,
    markAsRead,
    markAllAsRead,
  }), [state, showNotification, removeNotification, clearAllNotifications, markAsRead, markAllAsRead]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Convenience functions for different notification types
export const useNotificationHelpers = () => {
  const { showNotification } = useNotification();

  return {
    showSuccess: (title: string, message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) =>
      showNotification('success', title, message, options),
    showError: (title: string, message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) =>
      showNotification('error', title, message, options),
    showWarning: (title: string, message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) =>
      showNotification('warning', title, message, options),
    showInfo: (title: string, message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) =>
      showNotification('info', title, message, options),
  };
};

// Export context for testing
export { NotificationContext };
