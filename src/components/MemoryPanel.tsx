import React from 'react';
import { Database, Eye, Trash2, Sliders, MessageSquareText, Bookmark } from 'lucide-react';
import { MemoryItem } from '../types';

interface MemoryPanelProps {
  memories: MemoryItem[];
  onViewMemory: () => void;
  onClearMemory: () => void;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  memories,
  onViewMemory,
  onClearMemory,
}) => {
  // Extract summary representations for the 3 categories
  const prefMem = memories.find((m) => m.category === 'preferences');
  const convMem = memories.find((m) => m.category === 'conversations');
  const savedMem = memories.find((m) => m.category === 'saved_information');

  return (
    <div className="rounded-xl bg-neutral-900/70 border border-neutral-800/80 p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-semibold text-neutral-200">Agent Memory</span>
        </div>
        <span className="text-[11px] text-neutral-400 tabular-nums">
          {memories.length} items
        </span>
      </div>

      <p className="text-[11px] text-neutral-400 leading-normal">
        Context persisted in Supabase pgvector store for personalized reasoning.
      </p>

      {/* Memory cards */}
      <div className="space-y-2 pt-1">
        {/* User Preferences Card */}
        <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/60 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-cyan-300">
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>User Preferences</span>
          </div>
          <p className="text-[11px] text-neutral-300 line-clamp-2">
            {prefMem?.content || 'Prefers Python 3.11+ & modular FastAPI architecture.'}
          </p>
        </div>

        {/* Previous Conversations Card */}
        <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/60 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-300">
            <MessageSquareText className="w-3 h-3 text-blue-400" />
            <span>Previous Conversations</span>
          </div>
          <p className="text-[11px] text-neutral-300 line-clamp-2">
            {convMem?.content || 'Discussed asynchronous worker patterns & streaming token endpoints.'}
          </p>
        </div>

        {/* Saved Information Card */}
        <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/60 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
            <Bookmark className="w-3 h-3 text-emerald-400" />
            <span>Saved Information</span>
          </div>
          <p className="text-[11px] text-neutral-300 line-clamp-2">
            {savedMem?.content || 'Repository: darshan-ai-core · Vector DB: Supabase pgvector.'}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/60">
        <button
          type="button"
          onClick={onViewMemory}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white text-xs font-medium border border-neutral-700/60 transition-colors cursor-pointer"
        >
          <Eye className="w-3 h-3 text-neutral-400" />
          <span>View Memory</span>
        </button>

        <button
          type="button"
          onClick={onClearMemory}
          className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-neutral-900 hover:bg-red-950/40 text-neutral-400 hover:text-red-300 text-xs font-medium border border-neutral-800 hover:border-red-800/40 transition-colors cursor-pointer"
          title="Clear agent memory"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
};
