import { useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

type NotificationType = 'success' | 'error' | 'info' | 'loading';

const useNotifications = () => {
  const { theme } = useTheme();

  const notify = useCallback((message: string, type: NotificationType = 'info', duration: number = 5000) => {
    const toastOptions = {
      duration,
      position: 'top-right' as const,
      className: '!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-white !shadow-lg',
      style: {
        border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
      },
    };

    switch (type) {
      case 'success':
        return toast.success(message, toastOptions);
      case 'error':
        return toast.error(message, toastOptions);
      case 'loading':
        return toast.loading(message, { ...toastOptions, duration: Infinity });
      default:
        return toast(message, toastOptions);
    }
  }, [theme]);

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  return { notify, dismiss, Toaster };
};

export default useNotifications;
