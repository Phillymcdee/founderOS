'use client';

import { useEffect, useState } from 'react';

export type Notification = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
};

interface NotificationToastProps {
  notification: Notification | null;
  onDismiss: () => void;
}

export function NotificationToast({
  notification,
  onDismiss
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for fade-out animation
      }, notification.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification) return null;

  const colors = {
    success: { bg: '#10b981', icon: '✅' },
    error: { bg: '#ef4444', icon: '❌' },
    info: { bg: '#3b82f6', icon: 'ℹ️' },
    warning: { bg: '#f59e0b', icon: '⚠️' }
  };

  const color = colors[notification.type];

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        backgroundColor: color.bg,
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        minWidth: '300px',
        maxWidth: '500px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'all 0.3s ease-in-out',
        cursor: 'pointer'
      }}
      onClick={onDismiss}
    >
      <span style={{ fontSize: '1.25rem' }}>{color.icon}</span>
      <span style={{ flex: 1, fontWeight: 500 }}>{notification.message}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(false);
          setTimeout(onDismiss, 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '1.25rem',
          cursor: 'pointer',
          padding: 0,
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
    </div>
  );
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const showSuccess = (message: string) => {
    addNotification({ type: 'success', message });
  };

  const showError = (message: string) => {
    addNotification({ type: 'error', message });
  };

  const showInfo = (message: string) => {
    addNotification({ type: 'info', message });
  };

  const showWarning = (message: string) => {
    addNotification({ type: 'warning', message });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
}

