import React from 'react';
import { ChevronRight, X, Sparkles } from 'lucide-react';
import { AgentStatus as IAgentStatus, Tool, AgentActivityStep, MemoryItem } from '../types';
import { AgentStatus } from './AgentStatus';
import { ToolList } from './ToolList';
import { AgentActivity } from './AgentActivity';
import { MemoryPanel } from './MemoryPanel';

interface AgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  status: IAgentStatus;
  tools: Tool[];
  onToggleTool: (toolId: string) => void;
  activitySteps: AgentActivityStep[];
  isGenerating: boolean;
  memories: MemoryItem[];
  onViewMemory: () => void;
  onClearMemory: () => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  isOpen,
  onClose,
  status,
  tools,
  onToggleTool,
  activitySteps,
  isGenerating,
  memories,
  onViewMemory,
  onClearMemory,
}) => {
  if (!isOpen) return null;

  return (
    <aside
      className="w-80 shrink-0 h-full flex flex-col bg-neutral-950/95 border-l border-neutral-800/80 overflow-y-auto select-none"
      aria-label="Agent Information"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
            Agent Information
          </h2>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850 transition-colors cursor-pointer"
          title="Close Agent Panel"
          aria-label="Close Agent Panel"
        >
          <ChevronRight className="w-4 h-4 hidden lg:block" />
          <X className="w-4 h-4 lg:hidden" />
        </button>
      </div>

      {/* Main Content Sections */}
      <div className="p-3.5 space-y-3.5 flex-1">
        {/* Agent Status */}
        <AgentStatus status={status} />

        {/* Live Agent Activity Timeline */}
        <AgentActivity currentSteps={activitySteps} isGenerating={isGenerating} />

        {/* Tools List */}
        <ToolList tools={tools} onToggleTool={onToggleTool} />

        {/* Memory Section */}
        <MemoryPanel
          memories={memories}
          onViewMemory={onViewMemory}
          onClearMemory={onClearMemory}
        />
      </div>
    </aside>
  );
};
