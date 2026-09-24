import React from 'react';
import { Calculator, Globe, Database, FileSearch, Wrench } from 'lucide-react';
import { Tool } from '../types';

interface ToolListProps {
  tools: Tool[];
  onToggleTool?: (toolId: string) => void;
}

export const ToolList: React.FC<ToolListProps> = ({ tools, onToggleTool }) => {
  const getToolIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'calculator':
        return <Calculator className="w-3.5 h-3.5 text-amber-400" />;
      case 'web search':
        return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
      case 'supabase':
      case 'supabase vector':
        return <Database className="w-3.5 h-3.5 text-emerald-400" />;
      case 'file analysis':
        return <FileSearch className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return (
    <div className="rounded-xl bg-neutral-900/70 border border-neutral-800/80 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-neutral-200">Agent Tools</span>
        </div>
        <span className="text-[11px] text-neutral-400 tabular-nums">
          {tools.filter((t) => t.enabled).length}/{tools.length} active
        </span>
      </div>

      <div className="space-y-1.5 pt-1">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/50 hover:bg-neutral-950 border border-neutral-800/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-6 h-6 rounded-md bg-neutral-900 flex items-center justify-center shrink-0 border border-neutral-800">
                {getToolIcon(tool.name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-neutral-200 truncate">{tool.name}</p>
                <p className="text-[10px] text-neutral-400 truncate">{tool.description}</p>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              onClick={() => onToggleTool && onToggleTool(tool.id)}
              className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                tool.enabled ? 'bg-cyan-500' : 'bg-neutral-800'
              }`}
              title={tool.enabled ? `Disable ${tool.name}` : `Enable ${tool.name}`}
              aria-label={`Toggle ${tool.name}`}
            >
              <span
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                  tool.enabled ? 'left-3.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
