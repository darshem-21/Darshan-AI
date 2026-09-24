import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry, onDismiss }) => {
  return (
    <div className="mx-4 my-3 p-3.5 rounded-xl bg-red-950/30 border border-red-800/40 text-red-200 text-xs flex items-start gap-3 shadow-md backdrop-blur-sm">
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-red-200">Request Error</p>
        <p className="text-red-300/80 mt-0.5">{message}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            type="button"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-900/40 hover:bg-red-800/60 text-red-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            type="button"
            className="p-1 rounded-md hover:bg-red-900/30 text-red-400 hover:text-red-200 transition-colors cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
