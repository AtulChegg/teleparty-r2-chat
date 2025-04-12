import React, { createContext, useContext, ReactNode } from 'react';
import toast, { Toaster,  ToastOptions } from 'react-hot-toast';

interface ToastContextType {
  showSuccess: (message: string, options?: ToastOptions) => string;
  showError: (message: string, options?: ToastOptions) => string;
  showInfo: (message: string, options?: ToastOptions) => string;
  showWarning: (message: string, options?: ToastOptions) => string;
  dismiss: (toastId?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const showSuccess = (message: string, options?: ToastOptions): string => {
    return toast.success(message, options);
  };

  const showError = (message: string, options?: ToastOptions): string => {
    return toast.error(message, options);
  };

  const showInfo = (message: string, options?: ToastOptions): string => {
    return toast(message, {
      icon: '📝',
      style: {
        backgroundColor: '#3b82f6',
        color: 'white',
      },
      ...options,
    });
  };

  const showWarning = (message: string, options?: ToastOptions): string => {
    return toast(message, {
      icon: '⚠️',
      style: {
        backgroundColor: '#f59e0b',
        color: 'white',
      },
      ...options,
    });
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  return (
    <ToastContext.Provider
      value={{
        showSuccess,
        showError,
        showInfo,
        showWarning,
        dismiss,
      }}
    >
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            padding: '16px',
          },
        }}
      />
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 