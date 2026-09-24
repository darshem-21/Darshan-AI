import React from 'react';
import { Bot, Sparkles, Database, Cpu } from 'lucide-react';
import { AgentStatus as IAgentStatus } from '../types';

interface AgentStatusProps {
  status: IAgentStatus;
}

export const AgentStatus: React.FC<AgentStatusProps> = ({ status }) => {
  const isOnline = status.status === 'online';
  const isBusy = status.status === 'busy';

  return (
    <div className="rounded-xl bg-neutral-900/70 border border-neutral-800/80 p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-neutral-200">Agent Status</span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="relative flex h-2 w-2">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isBusy ? 'bg-amber-400' : isOnline ? 'bg-emerald-500' : 'bg-neutral-500'
              }`}
            />
          </span>
          <span
            className={`font-medium capitalize text-xs ${
              isBusy ? 'text-amber-400' : isOnline ? 'text-emerald-400' : 'text-neutral-400'
            }`}
          >
            {isBusy ? 'Processing' : status.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/60 text-xs">
        <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/50">
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 mb-0.5">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>Model</span>
          </div>
          <p className="font-semibold text-neutral-200 truncate">{status.model}</p>
        </div>

        <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/50">
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 mb-0.5">
            <Database className="w-3 h-3 text-blue-400" />
            <span>Memory</span>
          </div>
          <p className="font-semibold text-neutral-200 truncate">{status.memoryProvider}</p>
        </div>
      </div>

      {status.activeTask && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-cyan-300 text-xs">
          <Sparkles className="w-3.5 h-3.5 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="truncate">{status.activeTask}</span>
        </div>
      )}
    </div>
  );
};
