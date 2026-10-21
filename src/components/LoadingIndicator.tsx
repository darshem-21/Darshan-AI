import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface LoadingIndicatorProps {
  currentStep?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ currentStep = 'Thinking...' }) => {
  return (
    <div className="flex items-start gap-3 my-4 pl-1 text-sm">
      {/* AI Avatar badge */}
      <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm relative overflow-hidden">
        <Bot className="w-4 h-4 relative z-10" />
        <div className="absolute inset-0 bg-cyan-400/10 animate-pulse" />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl rounded-tl-sm bg-neutral-900/80 border border-neutral-800 text-neutral-300 text-xs shadow-sm backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="font-medium text-neutral-200">{currentStep}</span>
          <div className="flex items-center gap-1 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
